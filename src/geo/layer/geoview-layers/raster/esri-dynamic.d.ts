import { ImageArcGISRest } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
export interface TypeEsriDynamicLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_DYNAMIC;
    listOfLayerEntryConfig: EsriDynamicLayerEntryConfig[];
}
/**
 * A class to add an EsriDynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
export declare class EsriDynamic extends AbstractGeoViewRaster {
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /**
     * Constructs an EsriDynamic Layer configuration processor.
     * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
     */
    constructor(layerConfig: TypeEsriDynamicLayerConfig);
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Overrides the way the validation of the list of layer entry config happens.
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<EsriDynamicLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: EsriDynamicLayerEntryConfig): Promise<EsriDynamicLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVEsriDynamic} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriDynamicLayerEntryConfig): GVEsriDynamic;
    /**
     * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
     * @param {TypeLayerEntryConfig} layerConfig - The layer config to check.
     * @returns {boolean} true if an error is detected.
     */
    esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig): boolean;
    /**
     * Creates a configuration object for a Esri Dynamic layer.
     * This function constructs a `TypeEsriDynamicLayerConfig` object that describes an Esri Dynamic layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeEsriDynamicLayerConfig} The constructed configuration object for the Esri Dynamic layer.
     */
    static createEsriDynamicLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeJsonArray, customGeocoreLayerConfig: TypeJsonObject): TypeEsriDynamicLayerConfig;
    /**
     * Creates an ImageArcGISRest source from a layer config.
     * @param {EsriDynamicLayerEntryConfig} layerConfig - The configuration for the EsriDynamic layer.
     * @returns A fully configured ImageArcGISRest source.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createEsriDynamicSource(layerConfig: EsriDynamicLayerEntryConfig): ImageArcGISRest;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsEsriDynamic: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeEsriDynamicLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a EsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsEsriDynamic: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is EsriDynamicLayerEntryConfig;
//# sourceMappingURL=esri-dynamic.d.ts.map