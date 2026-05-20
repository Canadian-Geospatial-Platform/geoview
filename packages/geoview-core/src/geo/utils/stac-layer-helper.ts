import type OlMap from 'ol/Map';
import WebGLTile from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';

import { logger } from '@/core/utils/logger';
import { getStoreMapCurrentProjectionEPSG, getStoreMapExtent } from '@/core/stores/states/map-state';
import { extractGeotiffColorMap, type RGBA } from '@/core/utils/utilities';
import { Projection } from '@/geo/utils/projection';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';

/** Property key used to tag layers added by the STAC browser plugin. */
const STAC_BROWSER_TAG = 'gv-stac-browser';

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
   * @returns A promise that resolves with the created WebGLTile layer, or null on failure
   */
  static async addGeoTiffLayer(map: OlMap, geotiffUrl: string): Promise<WebGLTile | null> {
    try {
      // Try to extract embedded colormap — it affects source configuration.
      // This can fail (CORS, network, malformed TIFF) so we catch and fall back to default rendering.
      let palette: RGBA[] | undefined;
      try {
        palette = await extractGeotiffColorMap(geotiffUrl);
      } catch (error) {
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
        // When an embedded color map exists, disable normalization so raw integer pixel values can index the palette
        normalize: !hasColorMap,
        // Use nearest-neighbor interpolation for palette data to avoid blending between class indices
        interpolate: !hasColorMap,
        // Auto-detect multi-band RGB/RGBA COGs and render in color (only when no palette)
        convertToRGB: hasColorMap ? undefined : 'auto',
      });

      // Read the TIFF headers to discover the source projection and register it if missing.
      // Without this, OL cannot transform between the GeoTIFF's native CRS and the map projection.
      const sourceView = await source.getView();
      if (sourceView.projection) {
        const epsgCode = Projection.readEPSGNumber(sourceView.projection);
        if (epsgCode) {
          await Projection.addProjectionIfMissing({ wkid: epsgCode });
        }
      }

      const layer = new WebGLTile({ source });

      // Tag the layer so we can find/remove it later
      layer.set(STAC_BROWSER_TAG, true);

      // Render above GeometryApi footprint layers (z-index 9999)
      layer.setZIndex(10000);

      // Apply colormap palette style if present
      if (palette) {
        StacLayerHelper.#applyPaletteStyle(layer, palette);
      }
      map.addLayer(layer);

      return layer;
    } catch (error) {
      logger.logError(`StacLayerHelper.addGeoTiffLayer - Failed to add GeoTIFF layer: ${geotiffUrl}`, error);
      return null;
    }
  }

  /**
   * Removes a STAC layer from the map.
   *
   * @param map - The OpenLayers map instance
   * @param layer - The STAC layer to remove
   */
  static removeStacLayer(map: OlMap, layer: unknown): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ol-stac layer type not statically available
      map.removeLayer(layer as any);
    } catch (error) {
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
    if (geometryApi.hasGeometryGroup(groupId)) {
      geometryApi.deleteGeometryGroup(groupId);
    }
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
    const destProj = Projection.getProjectionFromString(getStoreMapCurrentProjectionEPSG(mapId));
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
   * @returns The map extent as [west, south, east, north] in EPSG:4326, clamped to valid bounds
   */
  static getMapExtentAsWgs84Bbox(mapId: string): [number, number, number, number] {
    const extent = getStoreMapExtent(mapId);
    if (!extent) return [-180, -90, 180, 90];
    const srcProj = Projection.getProjectionFromString(getStoreMapCurrentProjectionEPSG(mapId));
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
    // South edge: SW → SE
    for (let i = 0; i <= stops; i++) ring.push([west + (east - west) * (i / stops), south]);
    // East edge: SE → NE
    for (let i = 1; i <= stops; i++) ring.push([east, south + (north - south) * (i / stops)]);
    // North edge: NE → NW
    for (let i = 1; i <= stops; i++) ring.push([east - (east - west) * (i / stops), north]);
    // West edge: NW → SW (closes the ring)
    for (let i = 1; i <= stops; i++) ring.push([west, north - (north - south) * (i / stops)]);
    return ring;
  }

  /**
   * Applies an embedded color palette as a WebGLTile style.
   *
   * @param layer - The WebGLTile layer
   * @param palette - Array of RGBA color tuples from the GeoTIFF color map
   */
  static #applyPaletteStyle(layer: WebGLTile, palette: RGBA[]): void {
    // Make nodata index (0) fully transparent
    const adjustedPalette = [...palette];
    adjustedPalette[0] = [0, 0, 0, 0];

    // Convert RGBA tuples to CSS color strings
    const colorStrings = adjustedPalette.map(([r, g, b, a]) => `rgba(${r},${g},${b},${a / 255})`);

    // Apply the palette style
    layer.setStyle({
      color: ['palette', ['band', 1], colorStrings],
    });
  }
}
