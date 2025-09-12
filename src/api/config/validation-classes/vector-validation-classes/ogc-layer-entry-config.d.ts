import { TypeLayerMetadataOGC, TypeSourceOgcFeatureInitialConfig } from '@/api/types/layer-schema-types';
import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
export interface OgcFeatureLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceOgcFeatureInitialConfig;
}
export declare class OgcFeatureLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: OgcFeatureLayerEntryConfigProps;
    source: TypeSourceOgcFeatureInitialConfig;
    /**
     * The class constructor.
     * @param {OgcFeatureLayerEntryConfigProps | OgcFeatureLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: OgcFeatureLayerEntryConfigProps | OgcFeatureLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataOGC | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataOGC | undefined;
}
//# sourceMappingURL=ogc-layer-entry-config.d.ts.map