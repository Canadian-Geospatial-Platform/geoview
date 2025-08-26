import { TypeLayerMetadataVector, TypeVectorSourceInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';
/**
 * Type used to define a GeoView vector layer to display on the map.
 */
export declare abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    /** Initial settings to apply to the GeoView vector layer source at creation time. */
    source?: TypeVectorSourceInitialConfig;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /**
     * The class constructor.
     * @param {VectorLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: VectorLayerEntryConfig);
    /**
     * Helper function to get the layer metadata casted as TypeLayerMetadataVector.
     * @returns {TypeLayerMetadataVector | undefined} The casted layer metadata in the right type.
     */
    getLayerMetadataCasted(): TypeLayerMetadataVector | undefined;
}
//# sourceMappingURL=vector-layer-entry-config.d.ts.map