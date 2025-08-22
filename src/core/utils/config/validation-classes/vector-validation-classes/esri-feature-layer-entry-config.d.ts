import { TypeLayerMetadataEsri } from '@/api/config/types/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceEsriFeatureInitialConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
export declare class EsriFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    source: TypeSourceEsriFeatureInitialConfig;
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {EsriFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriFeatureLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataEsri | undefined;
}
//# sourceMappingURL=esri-feature-layer-entry-config.d.ts.map