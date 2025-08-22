import { TypeLayerMetadataWfs, TypeSourceWFSVectorInitialConfig } from '@/api/config/types/map-schema-types';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
export declare class WfsLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    source: TypeSourceWFSVectorInitialConfig;
    /**
     * The class constructor.
     * @param {WfsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: WfsLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataWfs[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataWfs[] | undefined;
}
//# sourceMappingURL=wfs-layer-entry-config.d.ts.map