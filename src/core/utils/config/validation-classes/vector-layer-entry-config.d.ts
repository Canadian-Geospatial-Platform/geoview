import { TypeVectorSourceInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';
/** ******************************************************************************************************************************
 * Type used to define a GeoView vector layer to display on the map.
 */
export declare abstract class VectorLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Layer entry data type. */
    entryType: import("@/geo/map/map-schema-types").TypeLayerEntryType;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Initial settings to apply to the GeoView vector layer source at creation time. */
    source?: TypeVectorSourceInitialConfig;
    /**
     * The class constructor.
     * @param {VectorLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    protected constructor(layerConfig: VectorLayerEntryConfig);
}
