import { TypeSourceImageEsriInitialConfig } from '@/api/config/types/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageEsriInitialConfig;
    /** Max number of records for query - NOT USE FOR IMAGE SERVER */
    maxRecordCount?: number;
    /**
     * The class constructor.
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriImageLayerEntryConfig);
}
//# sourceMappingURL=esri-image-layer-entry-config.d.ts.map