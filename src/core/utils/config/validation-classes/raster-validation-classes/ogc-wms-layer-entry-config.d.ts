import { TypeSourceImageWmsInitialConfig } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
/**
 * Type used to define a GeoView image layer to display on the map.
 */
export declare class OgcWmsLayerEntryConfig extends AbstractBaseLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    /** Filter to apply on feature of this layer. */
    layerFilter?: string;
    /** Source settings to apply to the GeoView image layer source at creation time. */
    source: TypeSourceImageWmsInitialConfig;
    /**
     * The class constructor.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: OgcWmsLayerEntryConfig);
    /**
     * Clones an instance of a OgcWmsLayerEntryConfig.
     *
     * @returns {ConfigBaseClass} The cloned OgcWmsLayerEntryConfig instance
     */
    protected onClone(): ConfigBaseClass;
}
//# sourceMappingURL=ogc-wms-layer-entry-config.d.ts.map