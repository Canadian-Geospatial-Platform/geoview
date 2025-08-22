import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoJSONInitialConfig } from '@/api/config/types/map-schema-types';
export declare class GeoJSONLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    source: TypeSourceGeoJSONInitialConfig;
    /**
     * The class constructor.
     * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: GeoJSONLayerEntryConfig);
}
//# sourceMappingURL=geojson-layer-entry-config.d.ts.map