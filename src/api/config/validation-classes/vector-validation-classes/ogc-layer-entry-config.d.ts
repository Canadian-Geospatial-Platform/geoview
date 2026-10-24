import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataOGC, TypeMetadataOGCFeature } from '@/api/types/layer-schema-types';
import type { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface OgcFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    #private;
    /**
     * Creates an instance of OgcFeatureLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: OgcFeatureLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer
     */
    getGeoviewLayerConfig(): TypeOgcFeatureLayerConfig;
    /**
     * Overrides the parent class's getter to provide strongly-typed OGC API Features service metadata.
     *
     * @returns The service metadata, or undefined if it has not been set
     */
    getServiceMetadata(): TypeMetadataOGCFeature | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config
     */
    getLayerMetadata(): TypeLayerMetadataOGC | undefined;
    /**
     * Gets the full Queryables URL used for the layer, if available.
     *
     * @returns The Queryables URL, or undefined if none has been set
     */
    getQueryablesFullUrl(): string | undefined;
    /**
     * Sets the full Queryables URL used for the layer.
     *
     * @param queryablesFullUrl - The Queryables URL to store
     */
    setQueryablesFullUrl(queryablesFullUrl: string): void;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object) represents an OGC Feature layer type.
     *
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for an OGC Feature layer; otherwise `false`
     */
    static isClassOrTypeOGCLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeOgcFeatureLayerConfig;
}
//# sourceMappingURL=ogc-layer-entry-config.d.ts.map