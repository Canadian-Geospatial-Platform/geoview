import Static from 'ol/source/ImageStatic';
import { TypeJsonArray } from '@/api/config/types/config-types';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { GVImageStatic } from '@/geo/layer/gv-layers/raster/gv-image-static';
export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.IMAGE_STATIC;
    listOfLayerEntryConfig: ImageStaticLayerEntryConfig[];
}
/**
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
export declare class ImageStatic extends AbstractGeoViewRaster {
    /**
     * Constructs a ImageStatic Layer configuration processor.
     * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeImageStaticLayerConfig);
    /**
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {ImageStaticLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<ImageStaticLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: ImageStaticLayerEntryConfig): Promise<ImageStaticLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {ImageStaticLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVImageStatic} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: ImageStaticLayerEntryConfig): GVImageStatic;
    /**
     * Creates a configuration object for a Static Image layer.
     * This function constructs a `TypeImageStaticLayerConfig` object that describes an Static Image layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeImageStaticLayerConfig} The constructed configuration object for the Static Image layer.
     */
    static createImageStaticLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeJsonArray): TypeImageStaticLayerConfig;
    /**
     * Creates a StaticImage source from a layer config.
     * @param {ImageStaticLayerEntryConfig} layerConfig - Configuration for the image static layer.
     * @returns A configured ol/source/ImageStatic instance.
     * @throws If required config fields like dataAccessPath, extent, or projection are missing.
     */
    static createImageStaticSource(layerConfig: ImageStaticLayerEntryConfig): Static;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeImageStaticLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsImageStatic: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeImageStaticLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a ImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsImageStatic: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is ImageStaticLayerEntryConfig;
