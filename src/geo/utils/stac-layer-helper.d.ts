import type OlMap from 'ol/Map';
import WebGLTile from 'ol/layer/WebGLTile';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
/**
 * Helper class for managing ol-stac layers on an OpenLayers map.
 *
 * This utility wraps ol-stac's STACLayer to provide a simple API for adding,
 * removing, and querying STAC layers. It does NOT integrate with the GeoView
 * layer system (no layerPath, no legend, no store entry).
 */
export declare abstract class StacLayerHelper {
    #private;
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
    static addGeoTiffLayer(map: OlMap, geotiffUrl: string): Promise<WebGLTile | null>;
    /**
     * Removes a STAC layer from the map.
     *
     * @param map - The OpenLayers map instance
     * @param layer - The STAC layer to remove
     */
    static removeStacLayer(map: OlMap, layer: unknown): void;
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
    static addFootprintLayer(geometryApi: GeometryApi, footprint: {
        bbox?: [number, number, number, number];
        geometry?: unknown;
    }, color: string, fillOpacity?: number, groupId?: string): void;
    /**
     * Removes all footprint geometries for a given group and deletes the group.
     *
     * @param geometryApi - The GeometryApi instance
     * @param groupId - The geometry group ID to clear
     */
    static clearFootprints(geometryApi: GeometryApi, groupId: string): void;
    /**
     * Transforms a bbox from EPSG:4326 to the map's current projection.
     * Uses densified polygon edges for accurate extent in curvilinear projections.
     *
     * @param mapId - The map identifier
     * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
     * @returns The transformed extent in the map's projection
     */
    static transformBboxToMapProjection(mapId: string, bbox: [number, number, number, number]): [number, number, number, number];
    /**
     * Returns the map's current extent as a WGS84 bbox.
     *
     * @param mapId - The map identifier
     * @returns The map extent as [west, south, east, north] in EPSG:4326, clamped to valid bounds
     */
    static getMapExtentAsWgs84Bbox(mapId: string): [number, number, number, number];
}
//# sourceMappingURL=stac-layer-helper.d.ts.map