import type { Options } from 'ol/layer/Base';
import type { Coordinate } from 'ol/coordinate';
import type { Pixel } from 'ol/pixel';
import type { Extent } from 'ol/extent';
import type Feature from 'ol/Feature';
import type { Layer } from 'ol/layer';
import type Source from 'ol/source/Source';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import type { TemporalMode, TimeDimension, TimeIANA } from '@/core/utils/date-mgt';
import type { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStyleConfig, TypeFeatureInfoEntry, TypeLocation, QueryType, TypeStyleGeometry, TypeOutfieldsType, TypeOutfields, TypeLayerStyleSettings, TypeFeatureInfoResult, codedValueType, rangeDomainType, TypeDisplayLanguage, TypeFieldEntry } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataFields, TypeGeoviewLayerType, TypeLegend } from '@/api/types/layer-schema-types';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { AbstractBaseGVLayer, type LayerBaseDelegate, type LayerBaseEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { SnackbarType } from '@/core/utils/notifications';
import { LayerFilters, type FilterCategory } from '@/geo/layer/gv-layers/layer-filters';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export declare abstract class AbstractGVLayer extends AbstractBaseGVLayer {
    #private;
    /** The default hit tolerance the query should be using. */
    static readonly DEFAULT_HIT_TOLERANCE: number;
    /** The default loading period before we show a message to the user about a layer taking a long time to render on map. */
    static readonly DEFAULT_LOADING_PERIOD: number;
    /** Quiescence period after a tile source change with no tile-load activity before remaining in-flight tiles are treated as orphans and force-closed. */
    static readonly TILE_LOADING_QUIESCENCE_PERIOD: number;
    /** Keywords used to identify name fields in the layer's outfields when none specified. */
    static readonly NAME_FIELD_KEYWORDS: string[];
    /**
     * Constructs a GeoView layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer Source
     * @param layerConfig - The layer configuration
     */
    protected constructor(olSource: Source, layerConfig: AbstractBaseLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The OpenLayers generic type.
     */
    getOLLayer(): Layer;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): AbstractBaseLayerEntryConfig;
    /**
     * Overrides the way the attributions are retrieved.
     *
     * @returns The layer attributions
     */
    onGetAttributions(): string[];
    /**
     * Overrides the refresh function to refresh the layer source.
     *
     * @param projection - Optional projection to refresh to
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Overridable function that gets the extent of an array of features.
     *
     * @param objectIds - The IDs of the features to calculate the extent from
     * @param outProjection - The output projection for the extent
     * @param outfield - Optional ID field to return for services that require a value in outfields
     * @returns A promise that resolves with the extent of the features
     * @throws {NotImplementedError} When the function isn't overridden by the children class
     */
    protected onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Overridable function returning the legend of the layer.
     *
     * Returns null when the layerPath specified is not found. If the style property
     * of the layerConfig object is undefined, the legend property of the object returned will be null.
     *
     * @returns A promise that resolves with the legend of the layer or null
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overridable method called when the layer has started to load itself on the map.
     */
    protected onLoading(): void;
    /**
     * Overridable method called when the layer has been loaded correctly.
     *
     * Fired only on the wave-terminating `*loadend` (i.e. when the in-flight counter transitions back to 0). Intermediate
     * `*loadend` events while other loads are still in flight are absorbed by the counter and do not call this method.
     */
    protected onLoaded(): void;
    /**
     * Overridable method called when the layer is in error and couldn't be loaded correctly.
     *
     * @param error - The error which is being raised
     */
    protected onSourceError(error: GeoViewError): void;
    /**
     * Overridable method called when the layer is in error and couldn't be loaded correctly.
     *
     * Fired only on the wave-terminating `featuresloaderror` (i.e. when the in-flight counter transitions back to 0).
     * Errors arriving while other loads are still in flight are absorbed by the counter and do not reach this method,
     * which naturally suppresses superseded errors.
     *
     * @param error - The error which is being raised
     */
    protected onFeaturesLoadError(error: GeoViewError): void;
    /**
     * Overridable method called when the layer tile image is in error and couldn't be loaded correctly.
     *
     * Fired only on the wave-terminating `tileloaderror` (i.e. when the in-flight counter transitions back to 0). Tile
     * errors arriving mid-burst, while other tiles are still loading, are absorbed by the counter and do not reach this
     * method - only the error that closes out the wave is reported.
     *
     * @param error - The error which is being raised
     */
    protected onImageTileLoadError(error: GeoViewError): void;
    /**
     * Overridable method called when the layer image is in error and couldn't be loaded correctly.
     *
     * Fired only on the wave-terminating `imageloaderror` (i.e. when the in-flight counter transitions back to 0).
     * Errors arriving while other loads are still in flight are absorbed by the counter and do not reach this method,
     * which naturally suppresses superseded errors.
     *
     * @param error - The error which is being raised
     */
    protected onImageLoadError(error: GeoViewError): void;
    /**
     * Overridable method called to get a more specific error code for all errors.
     *
     * @param event - The event which is being triggered
     * @returns A LayerFailedToLoadError error
     */
    protected onErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overridable method called to get a more specific error code for image load errors.
     *
     * @param event - The event which is being triggered
     * @returns A LayerImageFailedToLoadError error
     */
    protected onImageLoadErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overridable function to get all feature information for all the features stored in the layer.
     *
     * @param map - The Map so that we can grab the resolution/projection we want to get features on
     * @param layerFilters - The layer filters to apply when querying the features
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotImplementedError} When the function isn't overridden by the children class
     */
    protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at a given pixel location.
     *
     * @param map - The Map where to get Feature Info At Pixel from
     * @param location - The pixel coordinate that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotImplementedError} When the subclass does not override `getFeatureInfoAtCoordinate` (propagated from `getFeatureInfoAtCoordinate()`)
     */
    protected getFeatureInfoAtPixel(map: OLMap, location: Pixel, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at a given coordinate.
     *
     * @param map - The Map where to get Feature Info At Coordinate from
     * @param location - The coordinate that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotImplementedError} When the function isn't overridden by the children class
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at the provided long lat coordinate.
     *
     * @param map - The Map where to get Feature Info At LonLat from
     * @param lonlat - The coordinate that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotImplementedError} When the function isn't overridden by the children class
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at the provided bounding box.
     *
     * @param map - The Map where to get Feature using BBox from
     * @param location - The bounding box that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotImplementedError} When the function isn't overridden by the children class
     */
    protected getFeatureInfoUsingBBox(map: OLMap, location: Coordinate[], queryGeometry: boolean | undefined, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at the provided polygon.
     *
     * @param map - The Map where to get Feature Info using Polygon from
     * @param location - The polygon that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotImplementedError} When the function isn't overridden by the children class
     */
    protected getFeatureInfoUsingPolygon(map: OLMap, location: Coordinate[], queryGeometry: boolean | undefined, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function set the style according to the fetched legend information.
     *
     * @param legend - The fetched legend information
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overridable function to apply a view filter on the current layer.
     *
     * @param filter - Optional elaborate layer filters to be used
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
    /**
     * Initializes the GVLayer.
     *
     * Applies the initial layer filters, wires the OpenLayers source event listeners that drive the loading lifecycle
     * (start/end shared across features/image/tile families plus one handler per error family), registers the source
     * `change` listener to surface fatal source errors, and patches the renderer to guard against null-context errors.
     */
    init(): void;
    /**
     * Gets the OpenLayers Layer Source.
     *
     * @returns The OpenLayers Layer Source
     */
    getOLSource(): Source;
    /**
     * Gets the hit tolerance associated with the layer.
     *
     * @returns The hit tolerance
     */
    getHitTolerance(): number;
    /**
     * Gets the legend associated with the layer.
     *
     * @returns The layer legend
     */
    getLegend(): TypeLegend | undefined;
    /**
     * Sets the legend associated with the layer.
     *
     * @param legend - The layer legend
     */
    setLegend(legend: TypeLegend): void;
    /**
     * Gets the layer style.
     *
     * @returns The layer style
     */
    getStyle(): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer style.
     *
     * @param style - The layer style
     */
    setStyle(style: TypeLayerStyleConfig): void;
    /**
     * Gets the style item visibility on the layer.
     *
     * @param item - The style item whose visibility to retrieve
     * @returns The visibility of the style item
     */
    getStyleItemVisibility(item: TypeLegendItem): boolean;
    /**
     * Updates the visibility of a style item on the layer and triggers a re-render.
     *
     * This method mutates the layer's style configuration for the specified legend
     * item, calls `changed()` on the underlying OpenLayers layer to schedule a new
     * render, and optionally waits for the next render cycle to complete.
     *
     * @param item - The legend/style item whose visibility will be updated
     * @param visible - Whether the style item should be visible
     * @param waitForRender - When `true`, waits for the next layer render to complete before resolving
     * @returns A promise that resolves after the visibility has been
     * updated and, if requested, the layer has finished rendering
     * @throws {LayerStyleGeometryNotFoundError} When the geometry type of the item doesn't match any geometry type in the layer style configuration
     */
    setStyleItemVisibility(item: TypeLegendItem, visible: boolean, waitForRender: boolean): Promise<void>;
    /**
     * Builds and returns a filter expression derived from the layer's style configuration.
     *
     * This method delegates the filter extraction logic to {@link GeoviewRenderer.getFilterFromStyle},
     * using the current layer configuration (outfields, style, and style settings).
     *
     * @returns A filter expression string if one can be derived from the style,
     * or `undefined` if no filter applies.
     */
    getFilterFromStyle(): string | undefined;
    /**
     * Gets the temporal dimension that is associated to the layer.
     *
     * @returns The temporal dimension associated to the layer or undefined.
     */
    getTimeDimension(): TimeDimension | undefined;
    /**
     * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider.
     *
     * @returns The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
     */
    getIsTimeAware(): boolean;
    /**
     * Indicates if the layer is currently queryable.
     *
     * @returns The currently queryable flag.
     */
    getQueryable(): boolean;
    /**
     * Sets if the layer is currently queryable.
     *
     * @param queryable - The queryable value
     * @throws {LayerNotQueryableError} When the underlying source is not queryable
     */
    setQueryable(queryable: boolean): void;
    /**
     * Indicates if the layer is currently hoverable.
     *
     * @returns The currently hoverable flag.
     */
    getHoverable(): boolean;
    /**
     * Sets if the layer is currently hoverable.
     *
     * @param hoverable - The hoverable value
     */
    setHoverable(hoverable: boolean): void;
    /**
     * Gets the extent of an array of features.
     *
     * @param objectIds - The IDs of the features to calculate the extent from
     * @param outProjection - The output projection for the extent
     * @param outfield - Optional ID field to return for services that require a value in outfields
     * @returns A promise that resolves to the extent of the features, if available
     * @throws {NotImplementedError} When the subclass does not override `onGetExtentFromFeatures` (propagated from `onGetExtentFromFeatures()`)
     */
    getExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Gets the layer filters associated to the layer.
     *
     * @returns The layer filters associated to the layer.
     */
    getLayerFilters(): LayerFilters;
    /**
     * Sets the data filter on the layer.
     *
     * This function only updates the data filter query string inside the layer filters object.
     * The active filter applied on the layer will update accordingly, however, the UI component elements themselves won't update.
     *
     * @param dataFilterQueryString - Optional data filter expression to apply
     */
    setLayerFiltersData(dataFilterQueryString: string | undefined): void;
    /**
     * Sets the time filter on the layer.
     *
     * This function only updates the time filter query string inside the layer filters object.
     * The active filter applied on the layer will update accordingly, however, the UI component elements themselves won't update.
     *
     * @param timeFilterQueryString - Optional time filter expression to apply
     */
    setLayerFiltersTime(timeFilterQueryString: string | undefined): void;
    /**
     * Applies a time filter on a date range.
     *
     * This function only updates the time filter query string inside the layer filters object.
     * The active filter applied on the layer will update accordingly, however, the UI component elements themselves won't update.
     *
     * @param date1 - The start date
     * @param date2 - The end date
     * @deprecated This method should be removed in favor of setLayerFiltersTime so that future enhancements regarding time filtering
     * and UI synchronization can be made.
     */
    setLayerFiltersDate(date1: string, date2: string): void;
    /**
     * Returns feature information for the layer specified.
     *
     * @param map - The Map to get feature info from
     * @param queryType - The type of query to perform
     * @param location - A pixel, coordinate or polygon that will be used by the query
     * @param queryGeometry - Whether to include geometry in the query, default is true
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param abortController - Optional {@link AbortController} to cancel the operation
     * @returns A promise that resolves with the feature info result
     * @throws {NotSupportedError} When `queryType` is not one of the supported query types
     * @throws {NotImplementedError} When the subclass does not override the underlying `get*FeatureInfo*` method for the requested `queryType` (propagated from the dispatched method)
     */
    getFeatureInfo(map: OLMap, queryType: QueryType, location: TypeLocation, queryGeometry: boolean | undefined, language: TypeDisplayLanguage, // Used if we have to guess the field name for the 'nameField'
    abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Queries the legend.
     *
     * This function raises legend querying and queried events. It calls the overridable onFetchLegend() function.
     *
     * @returns A promise that resolves with the legend or null
     */
    queryLegend(): Promise<TypeLegend | null>;
    /**
     * Waits until the underlying OpenLayers source reaches the `ready` state.
     *
     * If the source is already ready, the returned promise resolves immediately.
     * If the source enters the `error` state, the promise is rejected.
     *
     * @returns A promise that resolves when the source state becomes
     * `ready`, or rejects if the source enters the `error` state
     */
    waitForSourceReady(): Promise<void>;
    /**
     * Waits for the next render cycle of the underlying OpenLayers layer to complete.
     *
     * Resolves the returned promise after the layer emits a `postrender` event,
     * indicating that it has finished rendering for a frame.
     *
     * @returns A promise that resolves after the layer has rendered at least once
     */
    waitForRender(): Promise<void>;
    /**
     * Utility function allowing to wait for the layer to be loaded at least once.
     *
     * @param timeout - A timeout for the period to wait for. Defaults to 30,000 ms
     * @returns A promise that resolves when the layer has been loaded at least once
     * @throws {LayerStatusErrorError} When the layer enters the `error` state before being loaded
     */
    waitLoadedOnce(timeout?: number): Promise<boolean>;
    /**
     * Utility function allowing to wait for the layer status to become `loaded`.
     *
     * @param timeout - A timeout for the period to wait for. Defaults to 30,000 ms
     * @returns A promise that resolves when the layer status is `loaded`
     * @throws {LayerStatusErrorError} When the layer enters the `error` state before reaching `loaded`
     */
    waitLoadedStatus(timeout?: number): Promise<boolean>;
    /**
     * Utility function allowing to wait for the layer legend to be fetched.
     *
     * @param timeout - A timeout for the period to wait for. Defaults to 30,000 ms
     * @returns A promise that resolves when the layer legend has been fetched
     * @throws {LayerStatusErrorError} When the layer enters the `error` state before the legend is fetched
     */
    waitLegendFetched(timeout?: number): Promise<TypeLegend>;
    /**
     * Utility function allowing to wait for the layer style to be applied.
     *
     * @param timeout - A timeout for the period to wait for. Defaults to 30,000 ms
     * @returns A promise that resolves when the layer style has been applied
     * @throws {LayerStatusErrorError} When the layer enters the `error` state before the style is applied
     */
    waitStyleApplied(timeout?: number): Promise<TypeLayerStyleConfig>;
    /**
     * Formats a list of features into an array of TypeFeatureInfoEntry, including icons, field values, domains, and metadata.
     *
     * @param features - Array of features to format
     * @param layerConfig - Configuration of the associated layer
     * @param language - The display language, used to guess the best name field if `nameField` is not provided
     * @param serviceDateFormat - Optional date format used by the service
     * @param serviceDateIANA - Optional IANA time zone identifier used by the service
     * @param serviceDateTemporalMode - Optional temporal mode for date handling
     * @returns An array of TypeFeatureInfoEntry objects
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig | VectorLayerEntryConfig, language: TypeDisplayLanguage, serviceDateFormat: string | undefined, serviceDateIANA: string | undefined, serviceDateTemporalMode: TemporalMode | undefined): TypeFeatureInfoEntry[];
    /**
     * Emits a layer-specific message event with localization support.
     *
     * @param messageKey - The key used to lookup the localized message OR message
     * @param messageParams - Array of parameters to be interpolated into the localized message
     * @param messageType - The message type
     *
     * @example
     * this.emitMessage(
     *   'layers.fetchProgress',
     *   ['50', '100'],
     *   'error',
     * );
     */
    protected emitMessage(messageKey: string, messageParams: Record<string, unknown> | undefined, messageType?: SnackbarType): void;
    /**
     * Registers a legend querying event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLegendQuerying(callback: LegendQueryingDelegate): LegendQueryingDelegate;
    /**
     * Unregisters a legend querying event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLegendQuerying(callback: LegendQueryingDelegate | undefined): void;
    /**
     * Registers a legend queried event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLegendQueried(callback: LegendQueriedDelegate): LegendQueriedDelegate;
    /**
     * Unregisters a legend queried event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLegendQueried(callback: LegendQueriedDelegate | undefined): void;
    /**
     * Emits filter applied event.
     *
     * @param event - The event to emit
     */
    protected emitLayerFilterApplied(event: LayerFilterAppliedEvent): void;
    /**
     * Registers a filter applied event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerFilterApplied(callback: LayerFilterAppliedDelegate): LayerFilterAppliedDelegate;
    /**
     * Unregisters a filter applied event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFilterApplied(callback: LayerFilterAppliedDelegate | undefined): void;
    /**
     * Registers a layer style changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerStyleChanged(callback: StyleChangedDelegate): StyleChangedDelegate;
    /**
     * Unregisters a layer style changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStyleChanged(callback: StyleChangedDelegate | undefined): void;
    /**
     * Registers when a layer have been first loaded on the map event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerFirstLoaded(callback: LayerBaseDelegate): LayerBaseDelegate;
    /**
     * Unregisters when a layer have been first loaded on the map event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFirstLoaded(callback: LayerBaseDelegate | undefined): void;
    /**
     * Registers when a layer is turning into a loading stage event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerLoading(callback: LayerBaseDelegate): LayerBaseDelegate;
    /**
     * Unregisters when a layer is turning into a loading stage event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoading(callback: LayerBaseDelegate | undefined): void;
    /**
     * Registers when a layer is turning into a loaded stage event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerLoaded(callback: LayerBaseDelegate): LayerBaseDelegate;
    /**
     * Unregisters when a layer is turning into a loaded stage event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: LayerBaseDelegate | undefined): void;
    /**
     * Registers when a layer is turning into a error stage event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerError(callback: LayerErrorDelegate): LayerErrorDelegate;
    /**
     * Unregisters when a layer is turning into a error stage event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerError(callback: LayerErrorDelegate | undefined): void;
    /**
     * Registers a layer message event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerMessage(callback: LayerMessageDelegate): LayerMessageDelegate;
    /**
     * Unregisters a layer message event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerMessage(callback: LayerMessageDelegate | undefined): void;
    /**
     * Registers an queryable changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerQueryableChanged(callback: LayerQueryableChangedDelegate): LayerQueryableChangedDelegate;
    /**
     * Unregisters an queryable changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerQueryableChanged(callback: LayerQueryableChangedDelegate | undefined): void;
    /**
     * Registers an hoverable changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerHoverableChanged(callback: LayerHoverableChangedDelegate): LayerHoverableChangedDelegate;
    /**
     * Unregisters an hoverable changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerHoverableChanged(callback: LayerHoverableChangedDelegate | undefined): void;
    /**
     * Registers a layer item visibility toggled event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The registered callback for potential unregistration
     */
    onLayerItemVisibilityChanged(callback: LayerItemVisibilityChangedDelegate): LayerItemVisibilityChangedDelegate;
    /**
     * Unregisters a layer item visibility changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerItemVisibilityChanged(callback: LayerItemVisibilityChangedDelegate | undefined): void;
    /**
     * Initializes common properties on a layer options.
     *
     * @param layerOptions - The layer options to initialize
     * @param layerConfig - The config to read the initial settings from
     */
    protected static initOptionsWithInitialSettings(layerOptions: Options, layerConfig: AbstractBaseLayerEntryConfig): void;
    /**
     * Finds the best field to use as a name field by searching for common name-like field patterns.
     *
     * Searches field names for predefined keywords (name, title, label) in priority order.
     * Supports both outfields arrays and field info dictionaries keyed by field name.
     * If no keyword match is found, returns the first available field name as a fallback.
     *
     * @param nameField - Optional provided name field to validate and use first
     * @param outfields - Outfields array or field info dictionary to search
     * @param lang - The display language used to resolve `_lang` placeholders in keyword patterns
     * @returns The name of the best matching field, or undefined if no fields available
     */
    static findBestNameField(nameField: string | undefined, outfields?: TypeOutfields[] | Partial<Record<string, TypeFieldEntry>> | undefined, lang?: TypeDisplayLanguage): string | undefined;
    /**
     * Creates a legend object based on a given GeoView layer type and style configuration.
     *
     * This method builds a legend representation by combining the provided style settings
     * with the computed legend symbols retrieved from the renderer. It is asynchronous
     * because it waits for `GeoviewRenderer.getLegendStyles` to generate the legend items.
     *
     * @param schemaTag - The GeoView layer type identifier (e.g., vector, raster, etc.)
     * @param style - Optional style configuration mapping geometry types to their style settings
     * @returns A promise that resolves with a legend object containing type, styleConfig, and legend entries
     */
    static createLegendFromStyle(schemaTag: TypeGeoviewLayerType, style: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined): Promise<TypeLegend>;
    /**
     * Retrieves or generates an image source (data URI or path) representing the visual style of a feature.
     *
     * Caches results in the `imageSourceDict` to avoid redundant processing.
     *
     * @param feature - The feature whose visual representation is to be retrieved
     * @param layerStyle - Style configuration grouped by geometry type (e.g., Point, LineString, Polygon)
     * @param domainsLookup - Optional domain information for interpreting coded values
     * @param aliasLookup - A mapping of original field names to their aliases
     * @param imageSourceDict - A dictionary used to cache and reuse image sources by style key
     * @returns The image source string representing the feature's style, or undefined when generation fails
     */
    static getFeatureIconSource(feature: Feature, layerStyle: TypeLayerStyleConfig, domainsLookup: TypeLayerMetadataFields[] | undefined, aliasLookup: Record<string, string>, imageSourceDict: Record<string, string | undefined>): string | undefined;
    /**
     * Formats a set of OpenLayers features into a structured array of feature info entries.
     *
     * Each feature is enriched with geometry, extent, field information, and optional styling.
     * Will not throw; errors are caught and logged. Returns an empty array if processing fails.
     *
     * @param features - Array of OpenLayers features to process
     * @param layerPath - Path of the layer these features belong to
     * @param schemaTag - The Geoview layer type for the features
     * @param nameField - Optional field name to use as the display name for features
     * @param outFields - Optional array of output fields to include in the feature info
     * @param supportZoomTo - Whether zoom-to functionality is supported for these features
     * @param domainsLookup - Optional array of field metadata for domain lookups
     * @param layerStyle - Optional mapping of geometry type to style settings for icons
     * @param inputFormat - Optional format(s) to prioritize for string inputs
     * @param inputTimezone - Optional IANA timezone the dates are in
     * @param inputTemporalMode - Optional temporal mode for date handling
     * @param callbackGetFieldValue - Callback that returns the value of a field for a feature, in the correct type
     * @returns Array of feature info entries representing each feature with enriched metadata
     */
    static helperFormatFeatureInfoResult(features: Feature[], layerPath: string, schemaTag: TypeGeoviewLayerType, nameField: string | undefined, outFields: TypeOutfields[] | undefined, supportZoomTo: boolean, domainsLookup: TypeLayerMetadataFields[] | undefined, layerStyle: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined, inputFormat: string | string[] | undefined, inputTimezone: TimeIANA | undefined, inputTemporalMode: TemporalMode | undefined, callbackGetFieldValue: GetFieldValueDelegate): TypeFeatureInfoEntry[];
    /**
     * Retrieves and formats the value of a field from an OpenLayers feature.
     * - For `date` fields, the raw value (epoch ms or date string) is normalized
     *   via the date management utilities.
     * - For fields with a `codedValue` domain, the raw code is resolved to its
     *   human-readable name. If no matching code is found, the raw value is returned.
     * - For all other fields, the raw value is returned as-is.
     *
     * @param feature - The OpenLayers feature containing the field values.
     * @param fieldName - The name of the field to retrieve.
     * @param fieldType - The data type of the field (e.g. `'string'`, `'number'`, `'date'`, `'oid'`).
     * @param fieldDomain - Optional domain metadata. When present and of type `codedValue`,
     * the raw field value is mapped to the corresponding coded-value name.
     * @param inputFormat - Optional format(s) to prioritize when parsing date string inputs.
     * @param inputTimezone - Optional IANA timezone to assume when interpreting date values.
     * @param inputTemporalMode - Optional temporal mode. `'calendar'` treats dates as
     * timezone-agnostic calendar dates; `'instant'` treats them as timezone-aware moments.
     * @returns The processed field value: a formatted date for date fields, the decoded
     * name for coded-value domains, or the raw value otherwise.
     */
    static helperGetFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType, fieldDomain: codedValueType | rangeDomainType | undefined, inputFormat: string | string[] | undefined, inputTimezone: TimeIANA | undefined, inputTemporalMode: TemporalMode | undefined): unknown;
}
/** Callback signature used to extract and format the value of a single feature field. */
export type GetFieldValueDelegate = (feature: Feature, fieldName: string, fieldType: TypeOutfieldsType, fieldDomain: codedValueType | rangeDomainType | undefined, inputFormat: string | string[] | undefined, inputTimezone: TimeIANA | undefined, inputTemporalMode: TemporalMode | undefined) => unknown;
/** Event payload emitted when the layer style changes. */
export interface StyleChangedEvent extends LayerBaseEvent {
    /** The newly applied layer style. */
    style: TypeLayerStyleConfig;
}
/** Delegate for the {@link StyleChangedEvent} handler. */
export type StyleChangedDelegate = EventDelegateBase<AbstractGVLayer, StyleChangedEvent, void>;
/** Event payload emitted when a legend query starts. */
export interface LegendQueryingEvent extends LayerBaseEvent {
}
/** Delegate for the {@link LegendQueryingEvent} handler. */
export type LegendQueryingDelegate = EventDelegateBase<AbstractGVLayer, LegendQueryingEvent, void>;
/** Event payload emitted when a legend query completes. */
export interface LegendQueriedEvent extends LayerBaseEvent {
    /** The legend returned by the query. */
    legend: TypeLegend;
}
/** Delegate for the {@link LegendQueriedEvent} handler. */
export type LegendQueriedDelegate = EventDelegateBase<AbstractGVLayer, LegendQueriedEvent, void>;
/** Event payload emitted when a layer filter is applied. */
export interface LayerFilterAppliedEvent extends LayerBaseEvent {
    /** The filter currently applied on the layer. */
    filter: LayerFilters;
    /** The filter category that changed and triggered this event. */
    filterCategory: FilterCategory;
}
/** Delegate for the {@link LayerFilterAppliedEvent} handler. */
export type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGVLayer, LayerFilterAppliedEvent, void>;
/** Event payload emitted when the layer enters an error state. */
export interface LayerErrorEvent extends LayerBaseEvent {
    /** The deciphered error that triggered this event. */
    error: GeoViewError;
}
/** Delegate for the {@link LayerErrorEvent} handler. */
export type LayerErrorDelegate = EventDelegateBase<AbstractGVLayer, LayerErrorEvent, void>;
/** Event payload emitted when the layer surfaces a user-facing message. */
export interface LayerMessageEvent extends LayerBaseEvent {
    /** The i18n key used to look up the localized message (or the literal message). */
    messageKey: string;
    /** Parameters interpolated into the localized message. */
    messageParams: Record<string, unknown> | undefined;
    /** The severity / category of the message. */
    messageType: SnackbarType;
}
/** Delegate for the {@link LayerMessageEvent} handler. */
export type LayerMessageDelegate = EventDelegateBase<AbstractGVLayer, LayerMessageEvent, void>;
/** Event payload emitted when the layer's queryable flag changes. */
export interface LayerQueryableChangedEvent extends LayerBaseEvent {
    /** The new queryable value. */
    queryable: boolean;
}
/** Delegate for the {@link LayerQueryableChangedEvent} handler. */
export type LayerQueryableChangedDelegate = EventDelegateBase<AbstractGVLayer, LayerQueryableChangedEvent, void>;
/** Event payload emitted when the layer's hoverable flag changes. */
export interface LayerHoverableChangedEvent extends LayerBaseEvent {
    /** The new hoverable value. */
    hoverable: boolean;
}
/** Delegate for the {@link LayerHoverableChangedEvent} handler. */
export type LayerHoverableChangedDelegate = EventDelegateBase<AbstractGVLayer, LayerHoverableChangedEvent, void>;
/** Event payload emitted when a style item's visibility is toggled. */
export interface LayerItemVisibilityChangedEvent extends LayerBaseEvent {
    /** The legend item being toggled. */
    item: TypeLegendItem;
    /** The new visibility of the item. */
    visible: boolean;
}
/** Delegate for the {@link LayerItemVisibilityChangedEvent} handler. */
export type LayerItemVisibilityChangedDelegate = EventDelegateBase<AbstractGVLayer, LayerItemVisibilityChangedEvent, void>;
//# sourceMappingURL=abstract-gv-layer.d.ts.map