import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
export declare class CsvLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    source: TypeSourceCSVInitialConfig;
    valueSeparator?: string | undefined;
    /**
     * The class constructor.
     * @param {CsvLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: CsvLayerEntryConfig);
}
//# sourceMappingURL=csv-layer-entry-config.d.ts.map