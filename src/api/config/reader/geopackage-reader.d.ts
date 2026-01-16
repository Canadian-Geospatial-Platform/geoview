import initSqlJs from 'sql.js';
import type { GeoPackageLayerConfig } from '@/api/types/layer-schema-types';
import type { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
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
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<TypeWkbLayerConfig>} A WKB layer config
     */
    static createLayerConfigFromGeoPackage(layerConfig: GeoPackageLayerConfig, abortSignal?: AbortSignal): Promise<TypeWkbLayerConfig>;
}
//# sourceMappingURL=geopackage-reader.d.ts.map