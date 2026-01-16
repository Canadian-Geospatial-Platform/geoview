import type { ShapefileLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
/**
 * A class to generate a GeoView layer config from a shapefile.
 * @exports
 * @class ShapefileReader
 */
export declare class ShapefileReader {
    /**
     * Generates GeoJson layer config from a shapefile.
     * @param {TypeShapefileLayerConfig} layerConfig - The config to convert.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeGeoJSONLayerConfig>} A geojson layer config
     */
    static convertShapefileConfigToGeoJson(layerConfig: ShapefileLayerConfig, abortSignal?: AbortSignal): Promise<TypeGeoJSONLayerConfig>;
}
//# sourceMappingURL=shapefile-reader.d.ts.map