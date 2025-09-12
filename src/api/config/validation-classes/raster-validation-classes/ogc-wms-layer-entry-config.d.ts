import { TypeLayerMetadataWMS, TypeMetadataWMS, TypeSourceImageWmsInitialConfig } from '@/api/types/layer-schema-types';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig, AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export interface OgcWmsLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageWmsInitialConfig;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: OgcWmsLayerEntryConfigProps;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageWmsInitialConfig;
    /**
     * The class constructor.
     * @param {OgcWmsLayerEntryConfigProps | OgcWmsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: OgcWmsLayerEntryConfigProps | OgcWmsLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataWMS | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataWMS | undefined;
    /**
     * Clones an instance of a OgcWmsLayerEntryConfig.
     * @returns {ConfigBaseClass} The cloned OgcWmsLayerEntryConfig instance
     */
    protected onClone(): ConfigBaseClass;
}
//# sourceMappingURL=ogc-wms-layer-entry-config.d.ts.map