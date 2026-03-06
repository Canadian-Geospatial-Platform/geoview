import type { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
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
     * @returns {ImageLayer<ImageArcGISRest>} The strongly-typed OpenLayers type.
     * @override
     */
    getOLLayer(): ImageLayer<ImageArcGISRest>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @returns {ImageArcGISRest} The ImageArcGISRest source instance associated with this layer.
     * @override
     */
    getOLSource(): ImageArcGISRest;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @returns {EsriImageLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     * @override
     */
    getLayerConfig(): EsriImageLayerEntryConfig;
    /**
     * Overrides the fetching of the legend for an Esri image layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     * @override
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides when the style should be set by the fetched legend.
     * @param {TypeLegend} legend - The legend type
     * @returns {void}
     * @override
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise of layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Overrides the way a WMS layer applies a view filter. It does so by updating the source TIME parameters.
     * @param {LayerFilters} [filter] - An optional filter to be used in place of the getViewFilter value.
     * @returns {void}
     * @override
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
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