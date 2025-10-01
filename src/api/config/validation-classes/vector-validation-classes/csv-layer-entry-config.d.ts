import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { TypeCSVLayerConfig, TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { ConfigClassOrType, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
export interface CsvLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceCSVInitialConfig;
    /** Character separating values in csv file */
    valueSeparator?: string;
}
export declare class CsvLayerEntryConfig extends VectorLayerEntryConfig {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source: TypeSourceCSVInitialConfig;
    /** Character separating values in csv file */
    valueSeparator?: string;
    /**
     * The class constructor.
     * @param {CsvLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: CsvLayerEntryConfigProps);
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a CSV layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a CSV layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeCSV(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeCSVLayerConfig;
}
//# sourceMappingURL=csv-layer-entry-config.d.ts.map