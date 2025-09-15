import initSqlJs from 'sql.js';
import { GeoPackageLayerConfig } from '@/api/types/layer-schema-types';
import { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
export interface GeoPackageFeature {
    geom: Uint8Array<ArrayBufferLike>;
    properties: initSqlJs.ParamsObject | undefined;
}
export interface GeoPackageLayerData {
    name: string;
    dataProjection: string;
    geoPackageFeatures: GeoPackageFeature[];
    styleSld?: string | number | Uint8Array;
}
/**
 * A class to generate a GeoView layer config from a GeoPackage.
 * @exports
 * @class GeoPackageReader
 */
export declare class GeoPackageReader {
    #private;
    /**
     * Generates a WKB layer config from a GeoPackage.
     * @param {GeoPackageLayerConfig} layerConfig - the config to convert
     * @returns {Promise<TypeWkbLayerConfig>} A WKB layer config
     */
    static createLayerConfigFromGeoPackage(layerConfig: GeoPackageLayerConfig): Promise<TypeWkbLayerConfig>;
}
//# sourceMappingURL=geopackage-reader.d.ts.map