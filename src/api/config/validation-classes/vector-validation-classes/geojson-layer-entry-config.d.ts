import { VectorLayerEntryConfig, VectorLayerEntryConfigProps } from '@/api/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoJSONInitialConfig } from '@/api/types/layer-schema-types';
export interface GeoJSONLayerEntryConfigProps extends VectorLayerEntryConfigProps {
    /** Source settings to apply to the GeoView layer source at creation time. */
    source?: TypeSourceGeoJSONInitialConfig;
}
export declare class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: GeoJSONLayerEntryConfigProps;
    source: TypeSourceGeoJSONInitialConfig;
    /**
     * The class constructor.
     * @param {GeoJSONLayerEntryConfigProps | GeoJSONLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: GeoJSONLayerEntryConfigProps | GeoJSONLayerEntryConfig);
}
//# sourceMappingURL=geojson-layer-entry-config.d.ts.map