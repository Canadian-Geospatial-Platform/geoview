import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TypeSourceGeoPackageInitialConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
export declare class GeoPackageLayerEntryConfig extends VectorLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    source: TypeSourceGeoPackageInitialConfig;
    /**
     * The class constructor.
     * @param {GeoPackageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: GeoPackageLayerEntryConfig);
}
//# sourceMappingURL=geopackage-layer-config-entry.d.ts.map