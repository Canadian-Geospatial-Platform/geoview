import { TypeLayerMetadataWfs, TypeSourceWFSVectorInitialConfig } from '@/api/types/layer-schema-types';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface WfsLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceWFSVectorInitialConfig;
}
export declare class WfsLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: WfsLayerEntryConfigProps;
    source: TypeSourceWFSVectorInitialConfig;
    /**
     * The class constructor.
     * @param {WfsLayerEntryConfigProps | WfsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: WfsLayerEntryConfigProps | WfsLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataWfs[] | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataWfs[] | undefined;
}
//# sourceMappingURL=wfs-layer-entry-config.d.ts.map