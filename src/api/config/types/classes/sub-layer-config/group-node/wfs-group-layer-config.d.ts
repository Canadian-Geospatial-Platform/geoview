import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
/**
 * Base type used to define the common implementation of a WFS GeoView sublayer to display on the map.
 */
export declare class WfsGroupLayerConfig extends GroupLayerEntryConfig {
    /** ***************************************************************************************************************************
     * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
}
