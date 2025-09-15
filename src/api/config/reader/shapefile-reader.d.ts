import { ShapefileLayerConfig } from '@/api/types/layer-schema-types';
import { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
/**
 * A class to generate a GeoView layer config from a shapefile.
 * @exports
 * @class ShapefileReader
 */
export declare class ShapefileReader {
    /**
     * Generates GeoJson layer config from a shapefile.
     * @param {TypeShapefileLayerConfig} layerConfig - the config to convert
     * @returns {Promise<TypeGeoJSONLayerConfig>} A geojson layer config
     */
    static convertShapefileConfigToGeoJson(layerConfig: ShapefileLayerConfig): Promise<TypeGeoJSONLayerConfig>;
}
//# sourceMappingURL=shapefile-reader.d.ts.map