import { ImageArcGISRest } from 'ol/source';
import { Image as ImageLayer } from 'ol/layer';
import { Extent } from 'ol/extent';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { codedValueType, rangeDomainType } from '@/geo/map/map-schema-types';
import { AbstractGVRaster } from './abstract-gv-raster';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
/**
 * Manages an Esri Image layer.
 *
 * @exports
 * @class GVEsriImage
 */
export declare class GVEsriImage extends AbstractGVRaster {
    /**
     * Constructs a GVEsriImage layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {ImageArcGISRest} olSource - The OpenLayer source.
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: ImageArcGISRest, layerConfig: EsriImageLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {ImageLayer<ImageArcGISRest>} The OpenLayers Layer
     */
    getOLLayer(): ImageLayer<ImageArcGISRest>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {ImageArcGISRest} The OpenLayers Layer Source
     */
    getOLSource(): ImageArcGISRest;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {EsriImageLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): EsriImageLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string): 'string' | 'date' | 'number';
    /**
     * Overrides the return of the domain of the specified field.
     * @param {string} fieldName - The field name for which we want to get the domain.
     * @returns {codedValueType | rangeDomainType | null} The domain of the field.
     */
    protected getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
    /**
     * Overrides the fetching of the legend for an Esri image layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    getLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides when the layer gets in loaded status.
     */
    onLoaded(): void;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
     * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(layerPath: string, filter: string, combineLegendFilter?: boolean): void;
    /**
     * Gets the bounds of the layer and returns updated bounds.
     * @returns {Extent | undefined} The layer bounding box.
     */
    getBounds(layerPath: string): Extent | undefined;
}
