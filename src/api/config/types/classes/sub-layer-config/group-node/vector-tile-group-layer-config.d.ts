import { GroupLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { VectorTileLayerConfig } from '../../geoview-config/raster-config/vector-tile-config';
/**
 * Base type used to define the common implementation of a vector tile GeoView sublayer to display on the map.
 */
export declare class VectorTileGroupLayerConfig extends GroupLayerEntryConfig {
    /**
     * Shadow method used to do a cast operation on the parent method to return VectorTileLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {VectorTileLayerConfig} The Geoview layer configuration that owns this vector tile layer entry config.
     * @override
     */
    getGeoviewLayerConfig(): VectorTileLayerConfig;
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
