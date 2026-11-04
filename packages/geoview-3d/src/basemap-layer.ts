import { TileLayer } from '@deck.gl/geo-layers';
import type { TileLayerProps } from '@deck.gl/geo-layers';
import { BitmapLayer } from '@deck.gl/layers';

import { logger } from 'geoview-core/core/utils/logger';

/** Basemaps the 3D view can draw under the tileset. */
export const BASEMAP_IDS = ['cbmt', 'imagery', 'none'] as const;

/** Id of a basemap the 3D view can draw under the tileset. */
export type TypeBasemapId = (typeof BASEMAP_IDS)[number];

/** Basemap shown when the 3D view opens. */
export const DEFAULT_BASEMAP_ID: TypeBasemapId = 'cbmt';

/** A Web Mercator raster tile service. */
type TypeRasterBasemapSource = {
  /** XYZ tile URL template. */
  url: string;
  /** Deepest level the service serves; deeper views over-zoom (stretch) these tiles. */
  maxZoom: number;
};

/**
 * Raster sources of the drawable basemaps.
 *
 * - cbmt: Canada Base Map (CBMT) geometry from NRCan, the same map as GeoView's 'transport' basemap, whose 3857
 *   variant is an Esri vector-tile service deck.gl cannot style. Its cache stops at level 15 (maxScale 1:18 056; the
 *   advertised levels 16-23 return 404), so it turns blurry at street scale.
 * - imagery: Esri World Imagery, also used by GeoView's 'imagery' basemap; real tiles down to level 19 over Canadian
 *   cities.
 *
 * Both send `Access-Control-Allow-Origin: *` and serve 256 px tiles.
 */
const RASTER_BASEMAP_SOURCES: Record<Exclude<TypeBasemapId, 'none'>, TypeRasterBasemapSource> = {
  cbmt: {
    url: 'https://maps-cartes.services.geo.ca/server2_serveur2/rest/services/BaseMaps/CBMT_CBCT_GEOM_3857/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 15,
  },
  imagery: {
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
  },
};

/** Id prefix of the basemap layer; the basemap id keeps each basemap's tile cache distinct. */
const BASEMAP_LAYER_ID = 'geoview-3d-basemap';

/** Basemaps that already reported a failed tile; later failures are not logged again. */
const basemapsWithFailedTiles = new Set<TypeBasemapId>();

/** Bounding box of a Web Mercator tile, as given by TileLayer. */
type TypeTileBoundingBox = { west: number; south: number; east: number; north: number };

/**
 * Checks whether a value is a basemap id the 3D view can draw.
 *
 * @param value - The value to check
 * @returns Whether the value is a basemap id
 */
export function isBasemapId(value: unknown): value is TypeBasemapId {
  return (BASEMAP_IDS as readonly unknown[]).includes(value);
}

/**
 * Creates the basemap layer drawn under the tileset.
 *
 * @param basemapId - The basemap to draw
 * @returns The basemap tile layer, or undefined when no basemap is wanted
 */
export function createBasemapLayer(basemapId: TypeBasemapId): TileLayer | undefined {
  if (basemapId === 'none') return undefined;
  const { url, maxZoom } = RASTER_BASEMAP_SOURCES[basemapId];

  return new TileLayer({
    id: `${BASEMAP_LAYER_ID}-${basemapId}`,
    data: url,
    minZoom: 0,
    maxZoom,
    tileSize: 256,
    // Decode images in the browser: the default worker setup downloads worker scripts from a public CDN (unpkg).
    loadOptions: { core: { worker: false } },
    // A failed tile only leaves a gap (the Canada Base Map has no street-scale tiles outside Canada, for instance);
    // replaces TileLayer's default console.error per tile with one warning per basemap.
    onTileError: (error: Error): void => {
      if (basemapsWithFailedTiles.has(basemapId)) return;
      basemapsWithFailedTiles.add(basemapId);
      logger.logWarning(`geoview-3d - Some basemap tiles failed to load (${basemapId}); they are left blank`, error.message);
    },
    renderSubLayers: (props: Parameters<NonNullable<TileLayerProps['renderSubLayers']>>[0]): BitmapLayer => {
      const { west, south, east, north } = props.tile.bbox as TypeTileBoundingBox;
      return new BitmapLayer({
        id: props.id,
        image: props.data as string | null,
        bounds: [west, south, east, north],
      });
    },
  });
}
