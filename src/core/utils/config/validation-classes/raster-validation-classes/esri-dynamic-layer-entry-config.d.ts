import { TypeLayerMetadataEsri, TypeMetadataEsriDynamic, TypeSourceEsriDynamicInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceEsriDynamicInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriDynamicLayerEntryConfig);
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