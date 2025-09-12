import { TypeLayerMetadataEsri, TypeMetadataEsriDynamic, TypeSourceEsriDynamicInitialConfig } from '@/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig, AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export interface EsriDynamicLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceEsriDynamicInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: EsriDynamicLayerEntryConfigProps;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceEsriDynamicInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {EsriDynamicLayerEntryConfigProps | EsriDynamicLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriDynamicLayerEntryConfigProps | EsriDynamicLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataEsriDynamic | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataEsriDynamic | undefined;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataEsri | undefined;
}
//# sourceMappingURL=esri-dynamic-layer-entry-config.d.ts.map