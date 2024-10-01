import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { GeoJsonLayerConfig } from '@config/types/classes/geoview-config/vector-config/geojson-config';
/**
 * Base type used to define the common implementation of a GeoJson GeoView sublayer to display on the map.
 */
export declare class GeoJsonGroupLayerConfig extends GroupLayerEntryConfig {
    #private;
    /**
     * Shadow method used to do a cast operation on the parent method to return GeoJsonLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {GeoJsonLayerConfig} The Geoview layer configuration that owns this GeoJson layer entry config.
     * @override
     */
    getGeoviewLayerConfig(): GeoJsonLayerConfig;
    /** ***************************************************************************************************************************
     * This method is used to fetch, parse and extract the relevant information from the metadata for the group layer.
     * The same method signature is used by layer group nodes and leaf nodes (layers).
     * @override @async
     */
    fetchLayerMetadata(): Promise<void>;
}
