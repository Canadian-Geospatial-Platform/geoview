import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeCSVLayerConfig } from '@/geo/layer/geoview-layers/vector/csv';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceCSVInitialConfig } from '@/api/types/layer-schema-types';
export interface CsvLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceCSVInitialConfig;
}
export declare class CsvLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * Creates an instance of CsvLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: CsvLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeCSVLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceCSVInitialConfig;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a CSV layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a CSV layer; otherwise `false`
     */
    static isClassOrTypeCSV(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeCSVLayerConfig;
}
//# sourceMappingURL=csv-layer-entry-config.d.ts.map