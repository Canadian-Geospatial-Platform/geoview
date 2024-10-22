import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export declare class EsriGroupLayerConfig extends GroupLayerEntryConfig {
    #private;
    /**
     * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override
     */
    fetchLayerMetadata(): Promise<void>;
    /**
     * This method is used to analyze metadata and extract the relevant information from a group layer based on a definition
     * provided by the ESRI service.
     * @override @protected
     */
    protected parseLayerMetadata(): void;
}
