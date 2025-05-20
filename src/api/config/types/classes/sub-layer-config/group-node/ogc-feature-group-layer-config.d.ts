import { GroupLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
/**
 * Base type used to define the common implementation of a OGC GeoView sublayer to display on the map.
 */
export declare class OgcFeatureGroupLayerConfig extends GroupLayerEntryConfig {
    /** ***************************************************************************************************************************
     * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to parse the layer metadata and extract the style, source information and other properties.
     * However, since OGC doesn't have groups in its metadata, this routine does nothing for the group nodes.
     *
     * @protected @override
     */
    protected parseLayerMetadata(): void;
}
