import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { WmsLayerConfig } from '@config/types/classes/geoview-config/raster-config/wms-config';
/**
 * Base type used to define the common implementation of an ESRI GeoView sublayer to display on the map.
 */
export declare class WmsGroupLayerConfig extends GroupLayerEntryConfig {
    /**
     * Shadow method used to do a cast operation on the parent method to return WmsLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {WmsLayerConfig} The Geoview layer configuration that owns this WFS layer entry config.
     * @override @async
     */
    getGeoviewLayerConfig(): WmsLayerConfig;
    /** ***************************************************************************************************************************
     * This method is used to fetch, parse and extract the relevant information from the metadata of the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to analyze metadata and extract the relevant information from a group layer based on a definition
     * provided by the WMS service.
     * @override @protected
     */
    protected parseLayerMetadata(): void;
}
