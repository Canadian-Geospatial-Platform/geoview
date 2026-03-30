import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceGeoJSONInitialConfig } from '@/api/types/layer-schema-types';
import type { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
export interface GeoJSONLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceGeoJSONInitialConfig;
}
export declare class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * Creates an instance of GeoJSONLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: GeoJSONLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeGeoJSONLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceGeoJSONInitialConfig;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a GeoJSON layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a GeoJSON layer; otherwise `false`
     */
    static isClassOrTypeGeoJSON(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeGeoJSONLayerConfig;
}
//# sourceMappingURL=geojson-layer-entry-config.d.ts.map