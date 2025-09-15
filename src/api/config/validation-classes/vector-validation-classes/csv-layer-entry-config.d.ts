import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { TypeSourceCSVInitialConfig } from '@/geo/layer/geoview-layers/vector/csv';
export interface CsvLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceCSVInitialConfig;
    /** Character separating values in csv file */
    valueSeparator?: string;
}
export declare class CsvLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: CsvLayerEntryConfigProps;
    /** Source settings to apply to the GeoView layer source at creation time. */
    source: TypeSourceCSVInitialConfig;
    /** Character separating values in csv file */
    valueSeparator?: string;
    /**
     * The class constructor.
     * @param {CsvLayerEntryConfigProps | CsvLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: CsvLayerEntryConfigProps | CsvLayerEntryConfig);
}
//# sourceMappingURL=csv-layer-entry-config.d.ts.map