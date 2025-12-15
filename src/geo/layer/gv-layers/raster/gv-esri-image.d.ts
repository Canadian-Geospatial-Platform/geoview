import type { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export declare class GVEsriImage extends AbstractGVRaster {
    /**
     * Constructs a GVEsriImage layer to manage an OpenLayer layer.
     * @param {ImageArcGISRest} olSource - The OpenLayer source.
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {ImageLayer<ImageArcGISRest>} The strongly-typed OpenLayers type.
     */
    getOLLayer(): ImageLayer<ImageArcGISRest>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @override
     * @returns {ImageArcGISRest} The ImageArcGISRest source instance associated with this layer.
     */
    getOLSource(): ImageArcGISRest;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {EsriImageLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): EsriImageLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for an Esri image layer.
     * @override
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides when the style should be set by the fetched legend.
     * @param {TypeLegend} legend - The legend type
     * @override
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @override
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
     */
    applyViewFilter(filter?: string | undefined): void;
}
export type TypeEsriImageLayerLegend = {
    layers: TypeEsriImageLayerLegendLayer[];
};
export type TypeEsriImageLayerLegendLayer = {
    layerId: number | string;
    layerName: string;
    layerType: string;
    minScale: number;
    maxScale: number;
    legendType: string;
    legend: TypeEsriImageLayerLegendLayerLegend[];
};
export type TypeEsriImageLayerLegendLayerLegend = {
    label: string;
    url: string;
    imageData: string;
    contentType: string;
    height: number;
    width: number;
    values: string[];
};
//# sourceMappingURL=gv-esri-image.d.ts.map