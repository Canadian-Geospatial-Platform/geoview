import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export declare class WmsGroupLayerConfig extends GroupLayerEntryConfig {
    #private;
    /** ***************************************************************************************************************************
     * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
}
