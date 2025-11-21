import ImageLayer from 'ol/layer/Image';
import type Static from 'ol/source/ImageStatic';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
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
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {ImageLayer<Static>} The strongly-typed OpenLayers type.
     */
    getOLLayer(): ImageLayer<Static>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @override
     * @returns {Static} The Static source instance associated with this layer.
     */
    getOLSource(): Static;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {ImageStaticLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): ImageStaticLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for a static image layer.
     * @override
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @override
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
}
//# sourceMappingURL=gv-image-static.d.ts.map