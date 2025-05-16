import { ImageArcGISRest } from 'ol/source';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
export interface TypeEsriImageLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_IMAGE;
    listOfLayerEntryConfig: EsriImageLayerEntryConfig[];
}
/**
 * A class to add an EsriImage layer.
 *
 * @exports
 * @class EsriImage
 */
export declare class EsriImage extends AbstractGeoViewRaster {
    /**
     * Constructs an EsriImage Layer configuration processor.
     * @param {TypeEsriImageLayerConfig} layerConfig The layer configuration.
     */
    constructor(layerConfig: TypeEsriImageLayerConfig);
    /**
     * Overrides the way the layer metadata is processed.
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<EsriImageLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: EsriImageLayerEntryConfig): Promise<EsriImageLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVEsriImage} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriImageLayerEntryConfig): GVEsriImage;
    /**
     * Creates a configuration object for a Esri Image layer.
     * This function constructs a `TypeEsriImageLayerConfig` object that describes an Esri Image layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @returns {TypeEsriImageLayerConfig} The constructed configuration object for the Esri Image layer.
     */
    static createEsriImageLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean): TypeEsriImageLayerConfig;
    /**
     * Creates an ImageArcGISRest source from a layer config.
     * @param {EsriImageLayerEntryConfig} layerConfig - The configuration for the EsriImage layer.
     * @returns A fully configured ImageArcGISRest source.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createEsriImageSource(layerConfig: EsriImageLayerEntryConfig): ImageArcGISRest;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeEsriImageLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_IMAGE. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsEsriImage: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeEsriImageLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a EsriImageLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is ESRI_IMAGE. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsEsriImage: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is EsriImageLayerEntryConfig;
