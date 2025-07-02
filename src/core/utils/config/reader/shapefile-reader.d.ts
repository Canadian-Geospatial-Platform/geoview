import { ShapefileLayerConfig } from '@/api/config/types/map-schema-types';
import { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
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
    static convertShapefileConfigToGeoJson(layerConfig: ShapefileLayerConfig): Promise<TypeGeoJSONLayerConfig[]>;
    /**
     * Generates GeoJson layer configs as TypeJsonObject from shapefiles.
     * @param {TypeJsonArray} layerConfigs - the config to convert
     * @returns {Promise<TypeJsonObject[]>} A geojson layer config array
     */
    static getGVConfigsFromShapefiles(layerConfigs: TypeJsonArray): Promise<TypeJsonObject[]>;
}
//# sourceMappingURL=shapefile-reader.d.ts.map