import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceWkbVectorInitialConfig } from '@/api/types/layer-schema-types';
import type { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
export interface WkbLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceWkbVectorInitialConfig;
}
export declare class WkbLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * Creates an instance of WkbLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: WkbLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeWkbLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeSourceWkbVectorInitialConfig;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents a WKB Feature layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for a WKB Feature layer; otherwise `false`
     */
    static isClassOrTypeWKBLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWkbLayerConfig;
}
//# sourceMappingURL=wkb-layer-entry-config.d.ts.map