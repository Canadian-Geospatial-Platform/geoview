import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export declare abstract class AbstractBaseEsriLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** ***************************************************************************************************************************
     * This method is used to process the metadata of the sub-layers. It will fill the empty properties of the configuration
     * (renderer, initial settings, fields and aliases).
     */
    fetchLayerMetadata(): Promise<void>;
}
