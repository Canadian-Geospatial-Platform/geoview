import ImageLayer from 'ol/layer/Image';
import type { Coordinate } from 'ol/coordinate';
import type { ImageArcGISRest, ImageWMS } from 'ol/source';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeWmsLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import type { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { TypeDateFragments } from '@/core/utils/date-mgt';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
/**
 * Manages a WMS layer.
 *
 * @exports
 * @class GVWMS
 */
export declare class GVWMS extends AbstractGVRaster {
    #private;
    /** The max feature count returned by the GetFeatureInfo */
    static readonly DEFAULT_MAX_FEATURE_COUNT: number;
    /** The default Get Feature Info tolerance to use for QGIS Server services which are more picky by default (really needs to be zoomed in to get results, by default) */
    static readonly DEFAULT_GET_FEATURE_INFO_TOLERANCE: number;
    /**
     * Constructs a GVWMS layer to manage an OpenLayer layer.
     * @param {ImageWMS} olSource - The OpenLayer source.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @returns {ImageLayer<ImageWMS>} The strongly-typed OpenLayers type.
     * @override
     */
    getOLLayer(): ImageLayer<ImageWMS>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @returns {ImageWMS} The ImageWMS source instance associated with this layer.
     * @override
     */
    getOLSource(): ImageWMS;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @returns {OgcWmsLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     * @override
     */
    getLayerConfig(): OgcWmsLayerEntryConfig;
    /**
     * Overrides when the layer image is in error and couldn't be loaded correctly.
     * @param {unknown} event - The event which is being triggered.
     */
    protected onImageLoadError(event: unknown): void;
    /**
     * Gets if the CRS is to be overridden, because the layer struggles with the current map projection.
     * @returns {CRSOverride | undefined} The CRS Override properties if any.
     */
    getOverrideCRS(): CRSOverride | undefined;
    /**
     * Sets if the CRS is to be overridden, because the layer struggles with the current map projection.
     * @param {CRSOverride | undefined} value - The CRS Override properties or undefined.
     */
    setOverrideCRS(value: CRSOverride | undefined): void;
    /**
     * Gets the feature count used for GetFeatureInfo requests.
     * @returns {number} The current GetFeatureInfo feature count.
     */
    getGetFeatureInfoFeatureCount(): number;
    /**
     * Sets the feature count used for GetFeatureInfo requests.
     * @param {number} value - The new GetFeatureInfo feature count.
     */
    setGetFeatureInfoFeatureCount(value: number): void;
    /**
     * Gets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
     * @returns {number} The current GetFeatureInfo pixel tolerance.
     */
    getGetFeatureInfoTolerance(): number;
    /**
     * Sets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
     * @param {number} value - The new GetFeatureInfo pixel tolerance.
     */
    setGetFeatureInfoTolerance(value: number): void;
    /**
     * Overrides the return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     * @override
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
     * @param {Coordinate} lonlat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     * @override
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the fetching of the legend for a WMS layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     * @override
     */
    onFetchLegend(): Promise<TypeWmsLegend | null>;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     * @override
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
     * @static
     */
    static applyViewFilterOnSource(layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig, source: ImageWMS | ImageArcGISRest, externalDateFragments: TypeDateFragments | undefined, layer: GVWMS | GVEsriImage | undefined, filter?: string | undefined, callbackWhenUpdated?: ((filterToUse: string) => void) | undefined): void;
    /**
     * Registers an image load callback event handler.
     * @param {ImageLoadRescueDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onImageLoadRescue(callback: ImageLoadRescueDelegate): void;
    /**
     * Unregisters an image load callback event handler.
     * @param {ImageLoadRescueDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offImageLoadRescue(callback: ImageLoadRescueDelegate): void;
}
export type CRSOverride = {
    layerProjection: string;
    mapProjection: string;
};
/**
 * Define an event for the delegate
 */
export type ImageLoadRescueEvent = {
    imageLoadErrorEvent: unknown;
};
/**
 * Define a delegate for the event handler function signature
 */
export type ImageLoadRescueDelegate = EventDelegateBase<GVWMS, ImageLoadRescueEvent, boolean>;
//# sourceMappingURL=gv-wms.d.ts.map