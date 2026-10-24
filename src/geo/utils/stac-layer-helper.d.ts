import ImageLayer from 'ol/layer/Image';
import WebGLTile from 'ol/layer/WebGLTile';
import ImageCanvas from 'ol/source/ImageCanvas';
/** Two-dimensional coordinate used while fitting a static preview to its footprint. */
export type TypePoint2D = [number, number];
/**
 * Helper class for creating STAC preview layers. Adding them to the map is the controller's responsibility.
 *
 * These layers are not integrated with the GeoView layer system (no layerPath, legend, or store entry).
 */
export declare abstract class StacLayerHelper {
    #private;
    /**
     * Creates a WebGLTile layer with a GeoTIFF source directly, bypassing ol-stac.
     *
     * This is useful when ol-stac's asset selection logic does not find the right
     * asset (e.g., datacube items with role "data" instead of "overview"/"visual").
     *
     * @param geotiffUrl - URL to the Cloud-Optimized GeoTIFF file
     * @param opacity - Optional layer opacity (0-1), defaults to 1
     * @returns A promise that resolves with the created layer, or undefined when the source cannot be set up
     */
    static createGeoTiffLayer(geotiffUrl: string, opacity?: number): Promise<WebGLTile | undefined>;
    /**
     * Creates a non-georeferenced image layer stretched over the projected footprint bounds and clipped to the footprint.
     *
     * If the item has no polygon geometry, its axis-aligned bbox is used as the footprint.
     *
     * @param imageUrl - URL of the image
     * @param bbox - Bounding box in EPSG:4326 [west, south, east, north]
     * @param opacity - Optional overlay opacity (0-1), defaults to 1
     * @param geometry - Optional GeoJSON footprint geometry in EPSG:4326
     * @returns A promise that resolves with the created image layer after the image loads
     * @throws {Error} When the image fails to load
     */
    static createImageLayer(imageUrl: string, bbox: [number, number, number, number], opacity?: number, geometry?: unknown): Promise<ImageLayer<ImageCanvas>>;
}
//# sourceMappingURL=stac-layer-helper.d.ts.map