import { TerrainLayer } from '@deck.gl/geo-layers';
import { fromArrayBuffer } from 'geotiff';

import { logger } from 'geoview-core/core/utils/logger';

/**
 * NRCan HRDEM mosaic (1 m lidar) Web Coverage Service; its `dtm` coverage is bare-ground elevation in CGVD2013
 * orthometric metres, which is also the vertical reference of the tilesets this plugin was tested with.
 *
 * Covers lidar survey areas only; elsewhere it returns its nodata value and the ground stays at 0 m.
 */
const HRDEM_WCS_URL = 'https://datacube.services.geo.ca/wrapper/ogc/elevation-hrdem-mosaic';

/** Coverage holding bare-ground elevation (the alternative, `dsm`, includes buildings and trees). */
const HRDEM_COVERAGE = 'dtm';

/** Nodata value of the HRDEM coverage. */
const HRDEM_NODATA = -32767;

/**
 * Deepest tile level whose elevation is requested; deeper views reuse (over-zoom) these tiles.
 *
 * Kept low because every tile is a WCS GetCoverage (about 1 s, resampled by the server). A pre-tiled source (e.g.
 * PMTiles) could go to the data's native level, about 17 for 1 m HRDEM, past which any source over-zooms.
 */
export const TERRAIN_MAX_ZOOM = 15;

/**
 * Shallowest tile level whose elevation is requested. Wider views get flat tiles built locally: relief barely shows
 * there, and the draped basemap still needs a mesh to be painted on.
 */
const TERRAIN_MIN_ZOOM = 12;

/** Grid cells per tile side: a 129 x 129 vertex grid, about 9.5 m spacing at level 15. */
const TERRAIN_GRID_CELLS = 128;

/** Grid cells per side of the flat tiles used below TERRAIN_MIN_ZOOM. */
const FLAT_GRID_CELLS = 1;

/** Half the Web Mercator world width, in metres. */
const WEB_MERCATOR_HALF_WORLD = 20037508.342789244;

/** Width of deck.gl's Web Mercator common space. */
const COMMON_SPACE_WORLD = 512;

/** Id of the terrain layer. */
const TERRAIN_LAYER_ID = 'geoview-3d-terrain';

/** Scheme prefix of the terrain tile URLs. */
const TERRAIN_URL_PREFIX = 'hrdem://';

/** URL template of the terrain tiles; the custom fetch turns z/x/y into a WCS request. */
const TERRAIN_URL_TEMPLATE = `${TERRAIN_URL_PREFIX}{z}/{x}/{y}`;

/** Mesh in the shape TerrainLayer renders (the shape @loaders.gl/terrain's TerrainLoader returns). */
type TypeTerrainMesh = {
  loaderData: { header: Record<string, never> };
  header: { vertexCount: number; boundingBox: [[number, number, number], [number, number, number]] };
  mode: 4;
  indices: { value: Uint32Array; size: 1 };
  attributes: { POSITION: { value: Float32Array; size: 3 }; TEXCOORD_0: { value: Float32Array; size: 2 } };
};

/** The context TerrainLayer passes to its fetch function. */
type TypeTerrainFetchContext = { propName: string; loadOptions?: { terrain?: { bounds?: number[] } }; signal?: AbortSignal };

/**
 * Converts a deck.gl Web Mercator common-space coordinate to Web Mercator metres.
 *
 * @param common - The common-space coordinate (0 to 512 across the world)
 * @returns The coordinate in metres
 */
function commonToMeters(common: number): number {
  return (common / COMMON_SPACE_WORLD) * 2 * WEB_MERCATOR_HALF_WORLD - WEB_MERCATOR_HALF_WORLD;
}

/**
 * Requests HRDEM elevations around a tile and samples them at the mesh vertices.
 *
 * MapServer's pixel count for a WCS 1.1 request is not predictable to the pixel, so the returned raster is located by
 * its own georeferencing and sampled bilinearly, whatever its exact size.
 *
 * @param bounds - The tile bounds in common space [minX, minY, maxX, maxY]
 * @param signal - Aborts the request when the tile is no longer needed
 * @returns The elevations at the vertices, row by row from the north edge, (cells + 1) x (cells + 1) values
 * @throws {Error} When the service answers with an HTTP error (or `fetch()` / GeoTIFF decoding fails)
 */
async function fetchElevationGrid(bounds: number[], signal?: AbortSignal): Promise<Float32Array> {
  const [minX, minY, maxX, maxY] = bounds.map(commonToMeters);
  const spacingX = (maxX - minX) / TERRAIN_GRID_CELLS;
  const spacingY = (maxY - minY) / TERRAIN_GRID_CELLS;
  // One spare pixel on every side, so every vertex (on the tile border too) lies between pixel centres.
  const bbox = [minX - spacingX, minY - spacingY, maxX + spacingX, maxY + spacingY];

  const params = new URLSearchParams({
    service: 'WCS',
    version: '1.1.1',
    request: 'GetCoverage',
    identifier: HRDEM_COVERAGE,
    BoundingBox: `${bbox.join(',')},urn:ogc:def:crs:EPSG::3857`,
    GridBaseCRS: 'urn:ogc:def:crs:EPSG::3857',
    GridOffsets: `${spacingX},${-spacingY}`,
    format: 'image/geotiff',
  });
  const response = await fetch(`${HRDEM_WCS_URL}?${params.toString()}`, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());

  const tiff = await fromArrayBuffer(await response.arrayBuffer());
  const image = await tiff.getImage();
  const [band] = (await image.readRasters({ samples: [0], signal })) as unknown as ArrayLike<number>[];
  const width = image.getWidth();
  const height = image.getHeight();
  // Top-left corner and pixel size (y negative) of the raster, in Web Mercator metres.
  const [originX, originY] = image.getOrigin();
  const [resolutionX, resolutionY] = image.getResolution();

  const elevationAt = (column: number, row: number): number => {
    const elevation = band[Math.min(Math.max(row, 0), height - 1) * width + Math.min(Math.max(column, 0), width - 1)];
    return elevation <= HRDEM_NODATA ? 0 : elevation;
  };

  const size = TERRAIN_GRID_CELLS + 1;
  const elevations = new Float32Array(size * size);
  for (let row = 0; row < size; row++) {
    // Fractional pixel position, measured between pixel centres.
    const pixelY = (maxY - row * spacingY - originY) / resolutionY - 0.5;
    const row0 = Math.floor(pixelY);
    const fy = pixelY - row0;
    for (let col = 0; col < size; col++) {
      const pixelX = (minX + col * spacingX - originX) / resolutionX - 0.5;
      const col0 = Math.floor(pixelX);
      const fx = pixelX - col0;
      const top = elevationAt(col0, row0) * (1 - fx) + elevationAt(col0 + 1, row0) * fx;
      const bottom = elevationAt(col0, row0 + 1) * (1 - fx) + elevationAt(col0 + 1, row0 + 1) * fx;
      elevations[row * size + col] = top * (1 - fy) + bottom * fy;
    }
  }
  return elevations;
}

/**
 * Builds a regular triangle mesh from an elevation grid.
 *
 * @param elevations - The elevations, row by row from the north edge
 * @param bounds - The tile bounds in common space [minX, minY, maxX, maxY]
 * @param cells - Grid cells per tile side (the grid has cells + 1 vertices per side)
 * @returns The terrain mesh, x and y in common space and z in metres
 */
function buildMesh(elevations: Float32Array, bounds: number[], cells: number): TypeTerrainMesh {
  const [minX, minY, maxX, maxY] = bounds;
  const size = cells + 1;
  const positions = new Float32Array(size * size * 3);
  const texCoords = new Float32Array(size * size * 2);
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const vertex = row * size + col;
      const z = elevations[vertex];
      positions[vertex * 3] = minX + ((maxX - minX) * col) / cells;
      positions[vertex * 3 + 1] = maxY - ((maxY - minY) * row) / cells;
      positions[vertex * 3 + 2] = z;
      texCoords[vertex * 2] = col / cells;
      texCoords[vertex * 2 + 1] = row / cells;
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  const indices = new Uint32Array(cells * cells * 6);
  let index = 0;
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const topLeft = row * size + col;
      const bottomLeft = topLeft + size;
      indices.set([topLeft, bottomLeft, topLeft + 1, topLeft + 1, bottomLeft, bottomLeft + 1], index);
      index += 6;
    }
  }

  return {
    loaderData: { header: {} },
    header: {
      vertexCount: indices.length,
      boundingBox: [
        [minX, minY, minZ],
        [maxX, maxY, maxZ],
      ],
    },
    mode: 4,
    indices: { value: indices, size: 1 },
    attributes: { POSITION: { value: positions, size: 3 }, TEXCOORD_0: { value: texCoords, size: 2 } },
  };
}

/**
 * Builds a flat tile at 0 m, without any request.
 *
 * @param bounds - The tile bounds in common space [minX, minY, maxX, maxY]
 * @returns The flat terrain mesh
 */
function buildFlatMesh(bounds: number[]): TypeTerrainMesh {
  return buildMesh(new Float32Array((FLAT_GRID_CELLS + 1) ** 2), bounds, FLAT_GRID_CELLS);
}

/**
 * Counts of elevation requests made by one terrain layer (flat tiles below TERRAIN_MIN_ZOOM are not requests).
 *
 * `loaded` and `failed` add up over the life of the layer; `pending` is the number of requests in flight.
 */
export type TypeTerrainProgress = { pending: number; loaded: number; failed: number };

/**
 * Creates the function that fetches terrain tiles for TerrainLayer, replacing its image-based loader.
 *
 * TerrainLayer's default loader parses encoded elevation images in a web worker downloaded from a public CDN; the HRDEM
 * service returns float GeoTIFF instead, decoded here on the main thread.
 *
 * When the elevation service fails, the tile falls back to flat ground: the basemap is only drawn on terrain meshes, so a
 * missing tile would leave a hole in the ground rather than a flat one. The first failure is logged.
 *
 * @param onProgress - Called with the request counts whenever a request starts, succeeds, fails or is cancelled
 * @returns The fetch function
 */
function createTerrainFetch(
  onProgress?: (progress: TypeTerrainProgress) => void
): (url: string, context: TypeTerrainFetchContext) => Promise<TypeTerrainMesh> {
  const progress: TypeTerrainProgress = { pending: 0, loaded: 0, failed: 0 };
  let failureLogged = false;
  const report = (): void => onProgress?.({ ...progress });

  /**
   * Fetches one terrain tile.
   *
   * @param url - The tile URL, from TERRAIN_URL_TEMPLATE
   * @param context - The fetch context, holding the tile bounds TerrainLayer computed
   * @returns The terrain mesh
   * @throws {Error} When the request is not for elevation data or has no bounds, or was aborted
   */
  return async (url: string, context: TypeTerrainFetchContext): Promise<TypeTerrainMesh> => {
    const bounds = context.loadOptions?.terrain?.bounds;
    if (context.propName !== 'elevationData' || !bounds) throw new Error(`geoview-3d terrain cannot fetch ${url}`);
    const zoom = Number(url.replace(TERRAIN_URL_PREFIX, '').split('/')[0]);
    if (zoom < TERRAIN_MIN_ZOOM) return buildFlatMesh(bounds);

    progress.pending += 1;
    report();
    try {
      const mesh = buildMesh(await fetchElevationGrid(bounds, context.signal), bounds, TERRAIN_GRID_CELLS);
      progress.loaded += 1;
      return mesh;
    } catch (error: unknown) {
      // A tile no longer needed is cancelled, not replaced (nor counted).
      if (context.signal?.aborted) throw error;
      progress.failed += 1;
      if (!failureLogged) {
        failureLogged = true;
        logger.logWarning(
          'geoview-3d - Elevation service failed; showing flat ground where it fails',
          error instanceof Error ? error.message : String(error)
        );
      }
      return buildFlatMesh(bounds);
    } finally {
      progress.pending -= 1;
      report();
    }
  };
}

/**
 * Creates the terrain layer: ground elevation the basemap is draped on, so tilesets sit on the ground.
 *
 * The layer draws the ground mesh; the basemap, with TerrainExtension, is painted onto it as a texture.
 *
 * @param onProgress - Called with the elevation request counts whenever they change
 * @returns The terrain layer
 */
export function createTerrainLayer(onProgress?: (progress: TypeTerrainProgress) => void): TerrainLayer {
  return new TerrainLayer({
    id: TERRAIN_LAYER_ID,
    elevationData: TERRAIN_URL_TEMPLATE,
    minZoom: 0,
    maxZoom: TERRAIN_MAX_ZOOM,
    tileSize: 256,
    // 'draw' is required: draped layers (the basemap) are rendered as a texture onto this mesh, so without it nothing
    // shows the basemap at ground height.
    operation: 'terrain+draw',
    // The custom fetch returns meshes, so no loader (and no worker) is involved.
    loaders: [],
    fetch: createTerrainFetch(onProgress),
    onTileError: (error: Error): void => logger.logWarning('geoview-3d - Terrain tile failed to load', error.message),
  });
}
