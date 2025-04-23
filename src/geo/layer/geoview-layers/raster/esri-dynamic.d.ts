import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
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
     * @param {string} mapId The id of the map.
     * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
     */
    constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig);
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
     * Performs specific validation that can only be done by the child of the AbstractGeoViewEsriLayer class.
     * @param {TypeLayerEntryConfig} layerConfig - The layer config to check.
     * @returns {boolean} true if an error is detected.
     */
    esriChildHasDetectedAnError(layerConfig: TypeLayerEntryConfig): boolean;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /**
     * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
     * @returns {Promise<ImageLayer<ImageArcGISRest>>} The created Open Layer object.
     */
    protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<ImageLayer<ImageArcGISRest>>;
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
