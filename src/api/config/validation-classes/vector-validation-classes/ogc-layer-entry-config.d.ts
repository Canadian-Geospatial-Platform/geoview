import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataOGC } from '@/api/types/layer-schema-types';
import type { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface OgcFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * The class constructor.
     * @param {OgcFeatureLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: OgcFeatureLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataOGC | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataOGC | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a OGC Feature layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a OGC Feature layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeOGCLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeOgcFeatureLayerConfig;
}
//# sourceMappingURL=ogc-layer-entry-config.d.ts.map