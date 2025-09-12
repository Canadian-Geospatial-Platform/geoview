import { TypeLayerMetadataEsri, TypeSourceImageEsriInitialConfig } from '@/api/types/layer-schema-types';
import { AbstractBaseLayerEntryConfig, AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceImageEsriInitialConfig;
}
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: EsriImageLayerEntryConfigProps;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageEsriInitialConfig;
    /**
     * The class constructor.
     * @param {EsriImageLayerEntryConfigProps | EsriImageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriImageLayerEntryConfigProps | EsriImageLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
     */
    getLayerMetadata(): TypeLayerMetadataEsri | undefined;
}
//# sourceMappingURL=esri-image-layer-entry-config.d.ts.map