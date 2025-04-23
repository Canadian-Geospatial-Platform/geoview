import Static from 'ol/source/ImageStatic';
import ImageLayer from 'ol/layer/Image';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
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
     *
     * @param {string} mapId the id of the map
     * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeImageStaticLayerConfig);
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
     * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
     * @returns {Promise<ImageLayer<Static>>} The GeoView raster layer that has been created.
     */
    protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<ImageLayer<Static>>;
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
