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
import type { TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import type { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
/**
 * Manages a WMS layer.
 */
export declare class GVWMS extends AbstractGVRaster {
    #private;
    /** The max feature count returned by the GetFeatureInfo */
    static readonly DEFAULT_MAX_FEATURE_COUNT: number;
    /** The default Get Feature Info tolerance to use for QGIS Server services which are more picky by default (really needs to be zoomed in to get results, by default) */
    static readonly DEFAULT_GET_FEATURE_INFO_TOLERANCE: number;
    /**
     * Constructs a GVWMS layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: ImageWMS, layerConfig: OgcWmsLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): ImageLayer<ImageWMS>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The ImageWMS source instance associated with this layer.
     */
    getOLSource(): ImageWMS;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): OgcWmsLayerEntryConfig;
    /**
     * Overrides when the layer image is in error and couldn't be loaded correctly.
     *
     * @param error - The error which has been triggered.
     */
    protected onImageLoadError(error: GeoViewError): void;
    /**
     * Deciphers an image load error event and returns a corresponding
     * localized error message key.
     *
     * This override inspects the failed image request to detect more specific
     * failure scenarios before falling back to a generic error message.
     * The method currently checks for:
     * - Image size exceeding the service-defined `MaxWidth` or `MaxHeight`
     *   constraints (if available in service metadata).
     * - An empty image response (zero width or height).
     * If none of the specific conditions are met, a generic image load error
     * message key is returned.
     *
     * @param event - The image load error event triggered by the image source.
     * @returns A GeoView Error representing the error.
     */
    protected onImageLoadErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overrides the return of feature information at a given coordinate.
     *
     * @param map - The Map where to get Feature Info At Coordinate from.
     * @param location - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @param abortController - Optional {@link AbortController} to cancel the operation.
     * @returns A promise that resolves with the feature info result
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the return of feature information at the provided long lat coordinate.
     *
     * @param map - The Map where to get Feature Info At LonLat from.
     * @param lonlat - The coordinate that will be used by the query.
     * @param queryGeometry - Whether to include geometry in the query, default is true.
     * @param abortController - Optional {@link AbortController} to cancel the operation.
     * @returns A promise that resolves with the feature info result
     * @throws {LayerConfigWFSMissingError} When no WFS layer configuration is defined for this WMS layer.
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the get all feature information for all the features stored in the layer.
     *
     * This function performs a WFS 'GetFeature' query operation using the WFS layer configuration embedded in the WMS layer configuration.
     *
     * @param map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param layerFilters - The layer filters to apply when querying the features.
     * @param abortController - Optional {@link AbortController} to cancel the operation.
     * @returns A promise that resolves with the feature info result
     * @throws {LayerConfigWFSMissingError} When no WFS layer configuration is defined for this WMS layer.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {NetworkError} When a network issue happened.
     */
    protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overrides the fetching of the legend for a WMS layer.
     *
     * @returns A promise that resolves with the legend of the layer or null
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overrides the way to get the bounds for this layer type.
     *
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise that resolves with the layer bounding box or undefined when not found
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Sends a query to get feature and calculates an extent from them.
     *
     * @param objectIds - The IDs of the features to calculate the extent from.
     * @param outProjection - The output projection for the extent.
     * @param outfield - Optional ID field to return for services that require a value in outfields.
     * @returns A promise that resolves with the extent of the features
     * @throws {LayerConfigWFSMissingError} When no WFS layer configuration is defined for this WMS layer.
     * @throws {NoPrimaryKeyFieldError} When the no outfields has the type 'oid'.
     * @throws {NoExtentError} When the extent couldn't be computed.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {NetworkError} When a network issue happened.
     */
    onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Overrides the way a WMS layer applies a view filter. It does so by updating the source FILTER and TIME parameters.
     *
     * @param filter - An optional filter to be used in place of the getViewFilter value.
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
    /**
     * Gets if the CRS is to be overridden, because the layer struggles with the current map projection.
     *
     * @returns The CRS Override properties or undefined when not set
     */
    getOverrideCRS(): CRSOverride | undefined;
    /**
     * Sets if the CRS is to be overridden, because the layer struggles with the current map projection.
     *
     * @param value - The CRS Override properties or undefined.
     */
    setOverrideCRS(value: CRSOverride | undefined): void;
    /**
     * Gets the feature count used for GetFeatureInfo requests.
     *
     * @returns The current GetFeatureInfo feature count
     */
    getGetFeatureInfoFeatureCount(): number;
    /**
     * Sets the feature count used for GetFeatureInfo requests.
     *
     * @param value - The new GetFeatureInfo feature count.
     */
    setGetFeatureInfoFeatureCount(value: number): void;
    /**
     * Gets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
     *
     * @returns The current GetFeatureInfo pixel tolerance
     */
    getGetFeatureInfoTolerance(): number;
    /**
     * Sets the current pixel tolerance used for GetFeatureInfo requests for QGIS Server Services.
     *
     * @param value - The new GetFeatureInfo pixel tolerance.
     */
    setGetFeatureInfoTolerance(value: number): void;
    /**
     * Gets the currently active WMS style identifier.
     *
     * @returns The active WMS style name, or undefined if none is set.
     */
    getWmsStyle(): string | undefined;
    /**
     * Sets the style id to be used by the WMS layer.
     *
     * @param wmsStyleId - The style identifier to be used.
     */
    setWmsStyle(wmsStyleId: string): void;
    /**
     * Fetches feature data from a WFS GetFeature request URL (expected to return GeoJSON),
     * parses the response into OpenLayers features, and converts them into GeoView
     * Feature Info entries with appropriate attribute formatting.
     *
     * This method:
     * - Performs an HTTP request to a WFS GetFeature endpoint.
     * - Parses the returned GeoJSON into OL features.
     * - Applies WFS/WMS configuration (schema, outfields, styles, filters).
     * - Formats fields according to WFS metadata, including date parsing rules.
     * - Returns an array of standardized `TypeFeatureInfoEntry` objects.
     *
     * @param urlWithOutputJson - The full WFS GetFeature request URL. Must specify an output format compatible
     *   with GeoJSON (e.g., `outputFormat=application/json`).
     * @param wmsLayerConfig - The associated WMS layer configuration. Styling and filter settings from this
     *   config are applied when formatting the Feature Info results.
     * @param wfsLayerConfig - The WFS layer configuration used for schema tags, outfields, metadata, and
     *   date formatting.
     * @param abortController - Optional {@link AbortController} used to cancel the fetch request.
     * @returns A promise that resolves with the feature info result
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {NetworkError} When a network issue happened.
     */
    static fetchAndParseFeaturesFromWFSUrl(urlWithOutputJson: string, wmsLayerConfig: OgcWmsLayerEntryConfig, wfsLayerConfig: OgcWfsLayerEntryConfig, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Applies a view filter to a WMS or an Esri Image layer's source by updating the source parameters.
     *
     * This function is responsible for generating the appropriate filter expression based on the layer configuration,
     * optional style, and time-based fragments. It ensures the filter is only applied if it has changed or needs to be reset.
     *
     * @param layerConfig - The configuration object for the WMS or Esri Image layer.
     * @param source - The OpenLayers `ImageWMS` or `ImageArcGISRest` source instance to which the filter will be applied.
     * @param filter - The raw filter string input (defaults to an empty string if not provided).
     * @throws {LayerInvalidLayerFilterError} When the filter expression fails to parse or cannot be applied.
     */
    static applyViewFilterOnSource(layerConfig: OgcWmsLayerEntryConfig | EsriImageLayerEntryConfig, source: ImageWMS | ImageArcGISRest, filter: LayerFilters | undefined): void;
    /**
     * Registers an image load callback event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns A function that can be called to unregister the event handler
     */
    onImageLoadRescue(callback: ImageLoadRescueDelegate): ImageLoadRescueDelegate;
    /**
     * Unregisters an image load callback event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offImageLoadRescue(callback: ImageLoadRescueDelegate | undefined): void;
}
export type CRSOverride = {
    layerProjection: string;
    mapProjection: string;
};
/**
 * Define an event for the delegate
 */
export type ImageLoadRescueEvent = {
    imageLoadErrorEvent: Error;
};
/**
 * Define a delegate for the event handler function signature
 */
export type ImageLoadRescueDelegate = EventDelegateBase<GVWMS, ImageLoadRescueEvent, boolean>;
//# sourceMappingURL=gv-wms.d.ts.map