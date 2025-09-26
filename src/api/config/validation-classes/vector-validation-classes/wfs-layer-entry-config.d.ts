import { ConfigClassOrType, TypeGeoviewLayerConfig, TypeLayerMetadataWfs, TypeSourceWFSVectorInitialConfig } from '@/api/types/layer-schema-types';
import { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface WfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceWFSVectorInitialConfig;
}
export declare class WfsLayerEntryConfig extends VectorLayerEntryConfig {
    source: TypeSourceWFSVectorInitialConfig;
    /**
     * The class constructor.
     * @param {WfsLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: WfsLayerEntryConfigProps);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataWfs[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataWfs[] | undefined;
    /**
     * Type guard that checks whether the given configuration (class instance or plain object)
     * represents a WFS Feature layer type.
     * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
     * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
     * @returns `true` if the config is for a WFS Feature layer; otherwise `false`.
     * @static
     */
    static isClassOrTypeWFSLayer(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeWFSLayerConfig;
}
//# sourceMappingURL=wfs-layer-entry-config.d.ts.map