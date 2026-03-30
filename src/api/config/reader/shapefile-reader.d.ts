import type { ShapefileLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
/** A class to generate a GeoView layer config from a shapefile. */
export declare class ShapefileReader {
    /**
     * Generates GeoJson layer config from a shapefile.
     *
     * @param layerConfig - The config to convert
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the GeoJSON layer config
     */
    static convertShapefileConfigToGeoJson(layerConfig: ShapefileLayerConfig, abortSignal?: AbortSignal): Promise<TypeGeoJSONLayerConfig>;
}
//# sourceMappingURL=shapefile-reader.d.ts.map