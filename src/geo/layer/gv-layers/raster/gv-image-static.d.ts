import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Extent } from 'ol/extent';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AbstractGVRaster } from './abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
/**
 * Manages an Image static layer.
 *
 * @exports
 * @class GVImageStatic
 */
export declare class GVImageStatic extends AbstractGVRaster {
    #private;
    /**
     * Constructs a GVImageStatic layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {Static} olSource - The OpenLayer source.
     * @param {ImageStaticLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: Static, layerConfig: ImageStaticLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {ImageLayer<Static>} The OpenLayers Layer
     */
    getOLLayer(): ImageLayer<Static>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {Static} The OpenLayers Layer Source
     */
    getOLSource(): Static;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {ImageStaticLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): ImageStaticLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for an Esri image layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    getLegend(): Promise<TypeLegend | null>;
    /**
     * Gets the bounds of the layer and returns updated bounds.
     * @returns {Extent | undefined} The layer bounding box.
     */
    getBounds(): Extent | undefined;
}
