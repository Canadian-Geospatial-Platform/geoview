import { GroupLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { XyzLayerConfig } from '@/api/config/types/classes/geoview-config/raster-config/xyz-tile-config';
/**
 * Base type used to define the common implementation of a XYZ tile GeoView sublayer to display on the map.
 */
export declare class XyzGroupLayerConfig extends GroupLayerEntryConfig {
    /**
     * Shadow method used to do a cast operation on the parent method to return XyzLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {XyzLayerConfig} The Geoview layer configuration that owns this XYZ tile layer entry config.
     * @override
     */
    getGeoviewLayerConfig(): XyzLayerConfig;
    /** ***************************************************************************************************************************
     * This method is used to fetch, parse and extract the relevant information from the metadata for the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
    /**
     * This method is used to parse the layer metadata and extract the source information and other properties.
     * @override @protected
     */
    protected parseLayerMetadata(): void;
}
