import type OlMap from 'ol/Map';
import ImageLayer from 'ol/layer/Image';
import WebGLTile from 'ol/layer/WebGLTile';
import { transform as transformCoordinate } from 'ol/proj';
import type OlProjection from 'ol/proj/Projection';
import GeoTIFF from 'ol/source/GeoTIFF';
import ImageCanvas from 'ol/source/ImageCanvas';
import type { Extent } from 'ol/extent';
import type { Size } from 'ol/size';

import { getStoreMapCurrentProjectionEPSG, getStoreMapExtent } from '@/core/stores/states/map-state';
import { logger } from '@/core/utils/logger';
import { extractGeotiffColorMap, type RGBA } from '@/core/utils/utilities';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Projection } from '@/geo/utils/projection';

/** Property key used to tag layers added by the STAC browser plugin. */
const STAC_BROWSER_TAG = 'gv-stac-browser';

/** Two-dimensional coordinate used while fitting a static preview to its footprint. */
type TypePoint2D = [number, number];

/**
 * Extracts polygon rings from GeoJSON Polygon, MultiPolygon, or GeometryCollection values.
 *
 * @param geometry - GeoJSON geometry value
 * @returns Valid rings in longitude/latitude order
 */
function getGeoJsonRings(geometry: unknown): TypePoint2D[][] {
  if (!geometry || typeof geometry !== 'object') return [];
  const geoJson = geometry as { type?: unknown; coordinates?: unknown; geometries?: unknown };

  if (geoJson.type === 'GeometryCollection' && Array.isArray(geoJson.geometries)) {
    return geoJson.geometries.flatMap(getGeoJsonRings);
  }

  if (geoJson.type === 'Polygon' && Array.isArray(geoJson.coordinates)) {
    return geoJson.coordinates.flatMap((ring) => {
      if (!Array.isArray(ring)) return [];
      const coordinates = ring.filter(
        (coordinate): coordinate is TypePoint2D =>
          Array.isArray(coordinate) && typeof coordinate[0] === 'number' && typeof coordinate[1] === 'number'
      );
      return coordinates.length >= 4 ? [coordinates] : [];
    });
  }

  if (geoJson.type === 'MultiPolygon' && Array.isArray(geoJson.coordinates)) {
    return geoJson.coordinates.flatMap((polygon) => getGeoJsonRings({ type: 'Polygon', coordinates: polygon }));
  }

  return [];
}

/**
 * Helper class for managing ol-stac layers on an OpenLayers map.
 *
 * This utility wraps ol-stac's STACLayer to provide a simple API for adding,
 * removing, and querying STAC layers. It does NOT integrate with the GeoView
 * layer system (no layerPath, no legend, no store entry).
 */
export abstract class StacLayerHelper {
  /**
   * Creates a WebGLTile layer with a GeoTIFF source directly, bypassing ol-stac.
   *
   * This is useful when ol-stac's asset selection logic does not find the right
   * asset (e.g., datacube items with role "data" instead of "overview"/"visual").
   *
   * @param map - The OpenLayers map instance
   * @param geotiffUrl - URL to the Cloud-Optimized GeoTIFF file
   * @param opacity - Optional layer opacity (0-1), defaults to 1
   * @returns A promise that resolves with the created WebGLTile layer, or null on failure
   */
  static async addGeoTiffLayer(map: OlMap, geotiffUrl: string, opacity?: number): Promise<WebGLTile | null> {
    try {
      let palette: RGBA[] | undefined;
      try {
        palette = await extractGeotiffColorMap(geotiffUrl);
      } catch (error: unknown) {
        logger.logError(
          `StacLayerHelper.addGeoTiffLayer - Could not extract colormap (falling back to default rendering): ${geotiffUrl}`,
          error
        );
      }

      const hasColorMap = !!palette;
      logger.logInfo(
        `StacLayerHelper.addGeoTiffLayer - hasColorMap=${hasColorMap}, palette entries=${palette?.length ?? 0} for: ${geotiffUrl}`
      );

      const source = new GeoTIFF({
        sources: [{ url: geotiffUrl }],
        normalize: !hasColorMap,
        interpolate: !hasColorMap,
        convertToRGB: hasColorMap ? undefined : 'auto',
      });

      const sourceView = await source.getView();
      if (sourceView.projection) {
        const epsgCode = Projection.readEPSGNumber(sourceView.projection);
        if (epsgCode) await Projection.addProjectionIfMissing(epsgCode);
      }

      const layer = new WebGLTile({ source, opacity });
      layer.set(STAC_BROWSER_TAG, true);
      layer.setZIndex(10000);
      if (palette) StacLayerHelper.#applyPaletteStyle(layer, palette);
      map.addLayer(layer);
      return layer;
    } catch (error: unknown) {
      logger.logError(`StacLayerHelper.addGeoTiffLayer - Failed to add GeoTIFF layer: ${geotiffUrl}`, error);
      return null;
    }
  }

  /**
   * Adds a non-georeferenced image clipped and rotated to fit its STAC item footprint.
   *
   * If the item has no polygon geometry, its axis-aligned bbox is used as the footprint.
   *
   * @param map - The OpenLayers map instance
   * @param imageUrl - URL of the image
   * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
   * @param opacity - Optional overlay opacity (0-1), defaults to 1
   * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326
   * @returns The created image layer
   */
  static addImageLayer(
    map: OlMap,
    imageUrl: string,
    bbox: [number, number, number, number],
    opacity?: number,
    geometry?: unknown
  ): ImageLayer<ImageCanvas> {
    const image = new Image();
    // NAPL browse images do not expose Access-Control-Allow-Origin; this canvas is only drawn for display, never pixel-read.
    const source = new ImageCanvas({
      ratio: 1,
      canvasFunction: (extent, resolution, pixelRatio, size, projection): HTMLCanvasElement =>
        StacLayerHelper.#renderFootprintImage(image, bbox, geometry, extent, resolution, pixelRatio, size, projection),
    });
    image.onload = (): void => source.changed();
    image.onerror = (): void => logger.logWarning(`StacLayerHelper.addImageLayer - Failed to load image: ${imageUrl}`);
    image.src = imageUrl;

    const layer = new ImageLayer({ source, opacity });
    layer.set(STAC_BROWSER_TAG, true);
    layer.setZIndex(10000);
    map.addLayer(layer);
    return layer;
  }

  /**
   * Removes a STAC layer from the map.
   *
   * @param map - The OpenLayers map instance
   * @param layer - The STAC layer to remove
   */
  static removeStacLayer(map: OlMap, layer: unknown): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ol-stac layer type is not statically available
      map.removeLayer(layer as any);
    } catch (error: unknown) {
      logger.logError('StacLayerHelper.removeStacLayer - Failed to remove STAC layer', error);
    }
  }

  /**
   * Adds a footprint polygon to the map using the GeometryApi.
   *
   * Accepts either a bounding box or a GeoJSON geometry. Bbox edges are densified
   * with intermediate points to render accurately in curvilinear projections (e.g., LCC).
   *
   * @param geometryApi - The GeometryApi instance for the target map
   * @param footprint - Either a bbox [west, south, east, north] in EPSG:4326, or a GeoJSON geometry object
   * @param color - CSS color string for stroke and fill (e.g., '#1976d2', '#FF8C00')
   * @param fillOpacity - Optional fill opacity (0-1), defaults to 0.1
   * @param groupId - Optional geometry group ID for managing footprint lifecycle
   */
  static addFootprintLayer(
    geometryApi: GeometryApi,
    footprint: { bbox?: [number, number, number, number]; geometry?: unknown },
    color: string,
    fillOpacity = 0.1,
    groupId?: string
  ): void {
    const style: TypeFeatureStyle = { strokeColor: color, strokeWidth: 2, fillColor: color, fillOpacity };

    if (footprint.geometry) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- GeoJSON geometry type/coordinates access
      const geom = footprint.geometry as any;
      if (geom.type === 'MultiPolygon' && Array.isArray(geom.coordinates)) {
        for (const polygonCoords of geom.coordinates) {
          geometryApi.addPolygon(polygonCoords, { projection: 4326, style }, undefined, groupId);
        }
      } else if (Array.isArray(geom.coordinates)) {
        geometryApi.addPolygon(geom.coordinates, { projection: 4326, style }, undefined, groupId);
      }
      return;
    }

    if (footprint.bbox) {
      const ring = StacLayerHelper.#densifyBboxRing(footprint.bbox);
      geometryApi.addPolygon([ring], { projection: 4326, style }, undefined, groupId);
    }
  }

  /**
   * Removes all footprint geometries for a given group and deletes the group.
   *
   * @param geometryApi - The GeometryApi instance
   * @param groupId - The geometry group ID to clear
   */
  static clearFootprints(geometryApi: GeometryApi, groupId: string): void {
    if (geometryApi.hasGeometryGroup(groupId)) geometryApi.deleteGeometryGroup(groupId);
  }

  /**
   * Transforms a bbox from EPSG:4326 to the map's current projection.
   * Uses densified polygon edges for accurate extent in curvilinear projections.
   *
   * @param mapId - The map identifier
   * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
   * @returns The transformed extent in the map's projection
   */
  static transformBboxToMapProjection(mapId: string, bbox: [number, number, number, number]): [number, number, number, number] {
    const destProj = Projection.getProjectionFromStringOrNumber(getStoreMapCurrentProjectionEPSG(mapId));
    const srcProj = Projection.getProjectionLonLat();
    const coords = Projection.transformAndDensifyExtent(bbox, srcProj, destProj);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of coords) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return [minX, minY, maxX, maxY];
  }

  /**
   * Returns the map's current extent as a WGS84 bbox.
   *
   * @param mapId - The map identifier
   * @returns The map extent as [west, south, east, north], clamped to valid bounds
   */
  static getMapExtentAsWgs84Bbox(mapId: string): [number, number, number, number] {
    const extent = getStoreMapExtent(mapId);
    if (!extent) return [-180, -90, 180, 90];
    const srcProj = Projection.getProjectionFromStringOrNumber(getStoreMapCurrentProjectionEPSG(mapId));
    const destProj = Projection.getProjectionLonLat();
    const bbox4326 = Projection.transformExtentFromProj(extent, srcProj, destProj) as [number, number, number, number];
    return [Math.max(bbox4326[0], -180), Math.max(bbox4326[1], -90), Math.min(bbox4326[2], 180), Math.min(bbox4326[3], 90)];
  }

  /**
   * Densifies a bounding box into a closed polygon ring with intermediate points along each edge.
   *
   * @param bbox - Bounding box [west, south, east, north]
   * @param stops - Optional number of segments per edge, defaults to 25
   * @returns A closed ring of [lon, lat] coordinate pairs
   */
  static #densifyBboxRing(bbox: [number, number, number, number], stops = 25): number[][] {
    const [west, south, east, north] = bbox;
    const ring: number[][] = [];
    for (let i = 0; i <= stops; i++) ring.push([west + (east - west) * (i / stops), south]);
    for (let i = 1; i <= stops; i++) ring.push([east, south + (north - south) * (i / stops)]);
    for (let i = 1; i <= stops; i++) ring.push([east - (east - west) * (i / stops), north]);
    for (let i = 1; i <= stops; i++) ring.push([west, north - (north - south) * (i / stops)]);
    return ring;
  }

  /**
   * Applies an affine image transform from the footprint's first, second, and fourth vertices.
   *
   * @param image - The loaded thumbnail image
   * @param bbox - Fallback item bbox in EPSG:4326
   * @param geometry - Optional GeoJSON footprint in EPSG:4326
   * @param extent - Current map image extent
   * @param resolution - Current map units per pixel
   * @param pixelRatio - Current device pixel ratio
   * @param size - Canvas dimensions in CSS pixels
   * @param projection - Current map projection
   * @returns The canvas containing the footprint-aligned image
   */
  static #renderFootprintImage(
    image: HTMLImageElement,
    bbox: [number, number, number, number],
    geometry: unknown,
    extent: Extent,
    resolution: number,
    pixelRatio: number,
    size: Size,
    projection: OlProjection
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(size[0] * pixelRatio);
    canvas.height = Math.round(size[1] * pixelRatio);
    if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0 || resolution <= 0) return canvas;

    const rings = getGeoJsonRings(geometry);
    const fallbackRing: TypePoint2D[] = [
      [bbox[0], bbox[3]],
      [bbox[0], bbox[1]],
      [bbox[2], bbox[1]],
      [bbox[2], bbox[3]],
      [bbox[0], bbox[3]],
    ];
    const footprintRings = rings.length ? rings : [fallbackRing];
    const projectedRings = footprintRings.map((ring) =>
      ring.map((coordinate) => transformCoordinate(coordinate, 'EPSG:4326', projection) as TypePoint2D)
    );
    const imageRing = projectedRings[0];
    const hasClosedRing =
      imageRing.length > 1 &&
      imageRing[0][0] === imageRing[imageRing.length - 1][0] &&
      imageRing[0][1] === imageRing[imageRing.length - 1][1];
    const cornerCount = hasClosedRing ? imageRing.length - 1 : imageRing.length;
    if (cornerCount < 4) return canvas;

    const context = canvas.getContext('2d');
    if (!context) return canvas;
    context.imageSmoothingEnabled = true;
    const toCanvasPixel = (coordinate: TypePoint2D): TypePoint2D => [
      ((coordinate[0] - extent[0]) / resolution) * pixelRatio,
      ((extent[3] - coordinate[1]) / resolution) * pixelRatio,
    ];

    context.beginPath();
    projectedRings.forEach((ring) => {
      ring.forEach((coordinate, index) => {
        const [pixelX, pixelY] = toCanvasPixel(coordinate);
        if (index === 0) context.moveTo(pixelX, pixelY);
        else context.lineTo(pixelX, pixelY);
      });
      context.closePath();
    });
    context.clip('evenodd');

    // EODMS maps NAPL image pixels to its ordered footprint vertices: 0=top-left, 1=bottom-left, 3=top-right.
    const topLeft = toCanvasPixel(imageRing[0]);
    const bottomLeft = toCanvasPixel(imageRing[1]);
    const topRight = toCanvasPixel(imageRing[3]);

    context.setTransform(
      (topRight[0] - topLeft[0]) / image.naturalWidth,
      (topRight[1] - topLeft[1]) / image.naturalWidth,
      (bottomLeft[0] - topLeft[0]) / image.naturalHeight,
      (bottomLeft[1] - topLeft[1]) / image.naturalHeight,
      topLeft[0],
      topLeft[1]
    );
    context.drawImage(image, 0, 0);
    context.setTransform(1, 0, 0, 1, 0, 0);
    return canvas;
  }

  /**
   * Applies an embedded color palette as a WebGLTile style.
   *
   * @param layer - The WebGLTile layer
   * @param palette - Array of RGBA color tuples from the GeoTIFF color map
   */
  static #applyPaletteStyle(layer: WebGLTile, palette: RGBA[]): void {
    const adjustedPalette = [...palette];
    adjustedPalette[0] = [0, 0, 0, 0];
    const colorStrings = adjustedPalette.map(([r, g, b, a]) => `rgba(${r},${g},${b},${a / 255})`);
    layer.setStyle({
      color: ['palette', ['band', 1], colorStrings],
    });
  }
}
