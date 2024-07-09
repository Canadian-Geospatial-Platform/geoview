import { TypeSourceImageEsriInitialConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class EsriDynamicLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/geo/layer/geoview-layers/abstract-geoview-layers").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/geo/map/map-schema-types").TypeLayerEntryType;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageEsriInitialConfig;
    /**
     * The class constructor.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: EsriDynamicLayerEntryConfig);
}
