import { GroupLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
import { CsvLayerConfig } from '@/api/config/types/classes/geoview-config/vector-config/csv-config';
/**
 * Base type used to define the common implementation of a CSV GeoView sublayer to display on the map.
 */
export declare class CsvGroupLayerConfig extends GroupLayerEntryConfig {
    /**
     * Shadow method used to do a cast operation on the parent method to return CsvLayerConfig instead of
     * AbstractGeoviewLayerConfig.
     *
     * @returns {CsvLayerConfig} The Geoview layer configuration that owns this CSV layer entry config.
     * @override
     */
    getGeoviewLayerConfig(): CsvLayerConfig;
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
//# sourceMappingURL=csv-group-layer-config.d.ts.map