import ImageLayer from 'ol/layer/Image';
import { Coordinate } from 'ol/coordinate';
import { ImageWMS } from 'ol/source';
import { Extent } from 'ol/extent';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';
import { TypeWmsLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
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
     * Overrides when the layer gets in loaded status.
     */
    protected onLoaded(): void;
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
     * @param {boolean} combineLegendFilter - Flag used to combine the legend filter and the filter together (default: true)
     */
    applyViewFilter(filter: string, combineLegendFilter?: boolean): void;
}
