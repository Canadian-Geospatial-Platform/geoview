import ImageLayer from 'ol/layer/Image';
import Static from 'ol/source/ImageStatic';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
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
     * @param {Static} olSource - The OpenLayer source.
     * @param {ImageStaticLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: Static, layerConfig: ImageStaticLayerEntryConfig);
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
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
}
//# sourceMappingURL=gv-image-static.d.ts.map