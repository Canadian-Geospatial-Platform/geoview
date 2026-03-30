import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeMetadataEsriDynamic, TypeMetadataEsriFeature, TypeMetadataEsriFeatureLayer } from '@/api/types/layer-schema-types';
import type { VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { TypeEsriFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import type { TypeStyleGeometry } from '@/api/types/map-schema-types';
export interface EsriFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
}
export declare class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    /**
     * Creates an instance of EsriFeatureLayerEntryConfig.
     *
     * @param layerConfig - The layer configuration we want to instantiate
     */
    constructor(layerConfig: EsriFeatureLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeEsriFeatureLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @remarks Sometimes, the layer processing uses metadata coming from MapServer/?f=json (TypeMetadataEsriDynamic) and sometimes
     * from FeatureServer/?f=json (TypeMetadataEsriFeature) which is the reason for the double types.
     *
     * @returns The strongly-typed service metadata specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataEsriDynamic | TypeMetadataEsriFeature | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeMetadataEsriFeatureLayer | undefined;
    /**
     * Overrides the get geometry type to interpret the esri type name.
     *
     * @returns The geometry type, or undefined if it could not be determined
     * @throws {NotSupportedError} When the geometry type is not supported
     */
    protected onGetGeometryType(): TypeStyleGeometry | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents an Esri Feature layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     *
     * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
     * @returns `true` if the config is for an Esri Feature layer; otherwise `false`
     */
    static isClassOrTypeEsriFeature(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriFeatureLayerConfig;
}
//# sourceMappingURL=esri-feature-layer-entry-config.d.ts.map