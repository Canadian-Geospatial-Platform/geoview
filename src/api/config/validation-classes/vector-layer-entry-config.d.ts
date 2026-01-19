import type { TypeGeoviewLayerType, TypeLayerMetadataVector, TypeBaseVectorSourceInitialConfig } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
export interface VectorLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
    /** Max number of records for query */
    maxRecordCount?: number;
}
/**
 * Type used to define a GeoView vector layer to display on the map.
 */
export declare abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Max number of records for query */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {VectorLayerEntryConfigProps | VectorLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: VectorLayerEntryConfigProps | VectorLayerEntryConfig, schemaTag: TypeGeoviewLayerType);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeBaseVectorSourceInitialConfig} The strongly-typed source configuration specific to this layer entry config.
     */
    getSource(): TypeBaseVectorSourceInitialConfig;
    /**
     * Helper function to get the layer metadata casted as TypeLayerMetadataVector.
     * @returns {TypeLayerMetadataVector | undefined} The casted layer metadata in the right type.
     */
    getLayerMetadataCasted(): TypeLayerMetadataVector | undefined;
}
//# sourceMappingURL=vector-layer-entry-config.d.ts.map