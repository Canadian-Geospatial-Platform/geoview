import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataEsri } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeEsriFeatureLayerConfig, TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
export interface EsriFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceEsriFeatureInitialConfig;
}
export declare class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    source: TypeSourceEsriFeatureInitialConfig;
    /**
     * The class constructor.
     * @param {EsriFeatureLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriFeatureLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataEsri | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a Esri Feature layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a Esri Feature layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeEsriFeature(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriFeatureLayerConfig;
}
//# sourceMappingURL=esri-feature-layer-entry-config.d.ts.map