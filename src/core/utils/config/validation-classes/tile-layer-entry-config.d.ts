import { TypeSourceTileInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from './abstract-base-layer-entry-config';
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class TileLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    /** Initial settings to apply to the GeoView image layer source at creation time. */
    source?: TypeSourceTileInitialConfig;
    /**
     * The class constructor.
     * @param {TileLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: TileLayerEntryConfig);
}
