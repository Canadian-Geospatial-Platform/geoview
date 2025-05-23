import ImageLayer from 'ol/layer/Image';
import { Coordinate } from 'ol/coordinate';
import { ImageArcGISRest, ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';
import { TypeWmsLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { TypeDateFragments } from '@/core/utils/date-mgt';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export declare class GVWMS extends AbstractGVRaster {
    #private;
    /**
     * Constructs a GVWMS layer to manage an OpenLayer layer.
     * @param {ImageWMS} olSource - The OpenLayer source.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig);
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {ImageLayer<ImageWMS>} The OpenLayers Layer
     */
    getOLLayer(): ImageLayer<ImageWMS>;
    /**
     * Overrides the get of the OpenLayers Layer Source
     * @returns {ImageWMS} The OpenLayers Layer Source
     */
    getOLSource(): ImageWMS;
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {OgcWmsLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): OgcWmsLayerEntryConfig;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LongLat from.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(map: OLMap, lnglat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the fetching of the legend for a WMS layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    onFetchLegend(): Promise<TypeWmsLegend | null>;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Sets the style to be used by the wms layer. This methode does nothing if the layer path can't be found.
     * @param {string} wmsStyleId - The style identifier that will be used.
     */
    setWmsStyle(wmsStyleId: string): void;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter paramater is used alone to display
     * the features. Otherwise, the legend filter and the filter parameter are combined together to define the view filter. The
     * legend filters are derived from the uniqueValue or classBreaks style of the layer. When the layer config is invalid, nothing
     * is done.
     * TODO ! The combination of the legend filter and the dimension filter probably does not apply to WMS. The code can be simplified.
     * @param {string} filter - An optional filter to be used in place of the getViewFilter value.
     */
    applyViewFilter(filter?: string | undefined): void;
    /**
     * Applies a view filter to a WMS or an Esri Image layer's source by updating the source parameters.
     * This function is responsible for generating the appropriate filter expression based on the layer configuration,
     * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
     * @param {OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig} layerConfig - The configuration object for the WMS or Esri Image layer.
     * @param {ImageWMS | ImageArcGISRest} source - The OpenLayers `ImageWMS` or `ImageArcGISRest` source instance to which the filter will be applied.
     * @param {TypeDateFragments | undefined} externalDateFragments - Optional external date fragments used to assist in formatting time-based filters.
     * @param {GVWMS | GVEsriImage | undefined} layer - Optional GeoView layer containing the source (if exists) in order to trigger a redraw.
     * @param {string | undefined} filter - The raw filter string input (defaults to an empty string if not provided).
     * @param {Function?} callbackWhenUpdated - Optional callback that is invoked with the final filter string if the layer was updated.
     * @throws {LayerInvalidLayerFilterError} If the filter expression fails to parse or cannot be applied.
     */
    static applyViewFilterOnSource(layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig, source: ImageWMS | ImageArcGISRest, externalDateFragments: TypeDateFragments | undefined, layer: GVWMS | GVEsriImage | undefined, filter?: string | undefined, callbackWhenUpdated?: ((filterToUse: string) => void) | undefined): void;
}
