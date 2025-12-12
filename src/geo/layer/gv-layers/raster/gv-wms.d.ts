import ImageLayer from 'ol/layer/Image';
import type { Coordinate } from 'ol/coordinate';
import type { ImageArcGISRest, ImageWMS } from 'ol/source';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import type { TypeFeatureInfoEntry, TypeLayerStyleConfig } from '@/api/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { type TypeDateFragments } from '@/core/utils/date-mgt';
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
     * @param {Event} event - The event which is being triggered.
     */
    protected onImageLoadError(event: Event): void;
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
     * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
     * @override
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     * This function performs a WFS 'GetFeature' query operation using the WFS layer configuration embedded in the WMS layer configuration.
     * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {NetworkError} When a network issue happened.
     */
    protected getAllFeatureInfo(map: OLMap, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overrides the fetching of the legend for a WMS layer.
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     * @override
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     * @override
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Sends a query to get feature and calculates an extent from them.
     * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string?} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available.
     * @throws {LayerConfigWFSMissingError} If no WFS layer configuration is defined for this WMS layer.
     * @throws {NoPrimaryKeyFieldError} When the no outfields has the type 'oid'.
     * @throws {NoExtentError} When the extent couldn't be computed.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {NetworkError} When a network issue happened.
     * @override
     */
    onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
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
     * Sets the style id to be used by the WMS layer.
     * @param {string} wmsStyleId - The style identifier to be used.
     */
    setWmsStyle(wmsStyleId: string): void;
    /**
     * Fetches feature data from a WFS GetFeature request URL (expected to return GeoJSON),
     * parses the response into OpenLayers features, and converts them into GeoView
     * Feature Info entries with appropriate attribute formatting.
     * This method:
     * - Performs an HTTP request to a WFS GetFeature endpoint.
     * - Parses the returned GeoJSON into OL features.
     * - Applies WFS/WMS configuration (schema, outfields, styles, filters).
     * - Formats fields according to WFS metadata, including date parsing rules.
     * - Returns an array of standardized `TypeFeatureInfoEntry` objects.
     * @param {string} urlWithOutputJson - The full WFS GetFeature request URL. Must specify an output format compatible
     *   with GeoJSON (e.g., `outputFormat=application/json`).
     * @param {OgcWmsLayerEntryConfig} wmsLayerConfig - The associated WMS layer configuration. Styling and filter settings from this
     *   config are applied when formatting the Feature Info results.
     * @param {OgcWfsLayerEntryConfig} wfsLayerConfig - The WFS layer configuration used for schema tags, outfields, metadata, and
     *   date formatting.
     * @param {AbortController} [abortController] - Optional `AbortController` used to cancel the fetch request.
     * @returns {Promise<TypeFeatureInfoEntry[]>}
     *   A promise resolving to an array of GeoView Feature Info entries representing
     *   the parsed and formatted features from the WFS response.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {NetworkError} When a network issue happened.
     * @static
     */
    static fetchAndParseFeaturesFromWFSUrl(urlWithOutputJson: string, wmsLayerConfig: OgcWmsLayerEntryConfig, wfsLayerConfig: OgcWfsLayerEntryConfig, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Applies a view filter to the layer. When the combineLegendFilter flag is false, the filter parameter is used alone to display
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
    static applyViewFilterOnSource(layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig, source: ImageWMS | ImageArcGISRest, style: TypeLayerStyleConfig | undefined, externalDateFragments: TypeDateFragments | undefined, layer: GVWMS | GVEsriImage | undefined, filter?: string | undefined, callbackWhenUpdated?: ((filterToUse: string) => void) | undefined): void;
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