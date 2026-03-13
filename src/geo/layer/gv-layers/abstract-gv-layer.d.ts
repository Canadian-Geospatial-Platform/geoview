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
import type { TypeLayerStyleConfig, TypeFeatureInfoEntry, codedValueType, rangeDomainType, TypeLocation, QueryType, TypeStyleGeometry, TypeOutfieldsType, TypeOutfields, TypeLayerStyleSettings, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { type TypeLayerMetadataFields, type TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import type { TypeLegendItem } from '@/core/components/layers/types';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { SnackbarType } from '@/core/utils/notifications';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import type { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export declare abstract class AbstractGVLayer extends AbstractBaseGVLayer {
    #private;
    /** The default hit tolerance the query should be using */
    static readonly DEFAULT_HIT_TOLERANCE: number;
    /** The default loading period before we show a message to the user about a layer taking a long time to render on map */
    static readonly DEFAULT_LOADING_PERIOD: number;
    /** Counts the number of times the loading happened. */
    loadingCounter: number;
    /** Marks the latest loading count for the layer.
     * This useful to know when the put the layer loaded status back correctly with parallel processing happening */
    loadingMarker: number;
    /**
     * Constructs a GeoView layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer Source.
     * @param layerConfig - The layer configuration.
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
     * @returns {string[]} The layer attributions
     * @override
     */
    onGetAttributions(): string[];
    /**
     * Overrides the refresh function to refresh the layer source.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     * @returns {void}
     * @override
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Overridable function that gets the extent of an array of features.
     * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available
     * @throws {NotImplementedError} When the function isn't overridden by the children class.
     */
    protected onGetExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
     * of the layerConfig object is undefined, the legend property of the object returned will be null.
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overridable method called when the layer has started to load itself on the map.
     */
    protected onLoading(): void;
    /**
     * Overridable method called when the layer has been loaded correctly.
     * @returns {void}
     */
    protected onLoaded(): void;
    /**
     * Overridable method called when the layer is in error and couldn't be loaded correctly.
     * @param error - The error which is being raised.
     */
    protected onError(error: GeoViewError): void;
    /**
     * Overridable method called when the layer image is in error and couldn't be loaded correctly.
     * @param error - The error which is being raised.
     * @returns {void}
     */
    protected onImageLoadError(error: GeoViewError): void;
    /**
     * Overridable method called to get a more specific error code for all errors.
     * @param event - The event which is being triggered.
     * @returns A LayerFailedToLoadError error.
     */
    protected onErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overridable method called to get a more specific error code for image load errors.
     * @param event - The event which is being triggered.
     * @returns A LayerImageFailedToLoadError error.
     */
    protected onImageLoadErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overridable function to get all feature information for all the features stored in the layer.
     * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param {LayerFilters} layerFilters - The layer filters to apply when querying the features.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of TypeFeatureInfoResult.
     * @throws {NotImplementedError} When the function isn't overridden by the children class.
     * @protected
     */
    protected getAllFeatureInfo(map: OLMap, layerFilters: LayerFilters, abortController?: AbortController): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at a given pixel location.
     * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
     * @param {Pixel} location - The pixel coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of TypeFeatureInfoResult.
     */
    protected getFeatureInfoAtPixel(map: OLMap, location: Pixel, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of TypeFeatureInfoResult.
     * @throws {NotImplementedError} When the function isn't overridden by the children class.
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
     * @param {Coordinate} lonlat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @throws {NotImplementedError} When the function isn't overridden by the children class.
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at the provided bounding box.
     * @param {OLMap} map - The Map where to get Feature using BBox from.
     * @param {Coordinate} location - The bounding box that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @throws {NotImplementedError} When the function isn't overridden by the children class.
     */
    protected getFeatureInfoUsingBBox(map: OLMap, location: Coordinate[], queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return of feature information at the provided polygon.
     * @param {OLMap} map - The Map where to get Feature Info using Polygon from.
     * @param {Coordinate} location - The polygon that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} A promise of a TypeFeatureInfoResult.
     * @throws {NotImplementedError} When the function isn't overridden by the children class.
     */
    protected getFeatureInfoUsingPolygon(map: OLMap, location: Coordinate[], queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Overridable function to return the domain of the specified field or null if the field has no domain.
     * @param {string} fieldName - The field name for which we want to get the domain.
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected onGetFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
    /**
     * Overridable function to return the type of the specified field from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overridable function set the style according to the fetched legend information
     * @param {TypeLegend} legend - The fetched legend information
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Overridable function to apply a view filter on the current layer.
     * @param {LayerFilters} [filter] - The elaborate layer filters to be used.
     * @returns {void}
     */
    protected onSetLayerFilters(filter?: LayerFilters): void;
    /**
     * Initializes the GVLayer. This function checks if the source is ready and if so it calls onLoaded() to pursue initialization of the layer.
     * If the source isn't ready, it registers to the source ready event to pursue initialization of the layer once its source is ready.
     */
    init(): void;
    /**
     * Gets the OpenLayers Layer Source
     * @returns The OpenLayers Layer Source
     */
    getOLSource(): Source;
    /**
     * Gets the hit tolerance associated with the layer.
     * @returns {number} The hit tolerance
     */
    getHitTolerance(): number;
    /**
     * Gets the legend associated with the layer.
     * @returns The layer legend
     */
    getLegend(): TypeLegend | undefined;
    /**
     * Sets the legend associated with the layer.
     * @param {TypeLegend} legend - The layer legend
     */
    setLegend(legend: TypeLegend): void;
    /**
     * Gets the layer style
     * @returns The layer style
     */
    getStyle(): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer style
     * @param {TypeStyleConfig} style - The layer style
     */
    setStyle(style: TypeLayerStyleConfig): void;
    /**
     * Gets the style item visibility on the layer.
     * @param {TypeLegendItem} item - The style item to toggle visibility on
     * @returns {boolean} The visibility of the style item
     */
    getStyleItemVisibility(item: TypeLegendItem): boolean;
    /**
     * Updates the visibility of a style item on the layer and triggers a re-render.
     * This method mutates the layer's style configuration for the specified legend
     * item, calls `changed()` on the underlying OpenLayers layer to schedule a new
     * render, and optionally waits for the next render cycle to complete.
     * @param {TypeLegendItem} item - The legend/style item whose visibility will be updated.
     * @param {boolean} visibility - Whether the style item should be visible.
     * @param {boolean} waitForRender - When `true`, waits for the next layer render to complete before resolving.
     * @returns {Promise<void>} A promise that resolves after the visibility has been
     * updated and, if requested, the layer has finished rendering.
     */
    setStyleItemVisibility(item: TypeLegendItem, visibility: boolean, waitForRender: boolean): Promise<void>;
    /**
     * Builds and returns a filter expression derived from the layer's style configuration.
     * This method delegates the filter extraction logic to {@link GeoviewRenderer.getFilterFromStyle},
     * using the current layer configuration (outfields, style, and style settings).
     * @returns {string | undefined} A filter expression string if one can be derived from the style,
     * or `undefined` if no filter applies.
     */
    getFilterFromStyle(): string | undefined;
    /**
     * Gets the temporal dimension that is associated to the layer.
     * @returns The temporal dimension associated to the layer or undefined.
     */
    getTimeDimension(): TimeDimension | undefined;
    /**
     * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
     * @returns The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
     */
    getIsTimeAware(): boolean;
    /**
     * Gets the in visible range value
     * @param currentZoom - Optional. The map current zoom
     * @returns True if the layer is in visible range
     */
    getInVisibleRange(currentZoom: number | undefined): boolean;
    /**
     * Indicates if the layer is currently queryable.
     * @returns The currently queryable flag.
     */
    getQueryable(): boolean;
    /**
     * Sets if the layer is currently queryable.
     * @param queryable - The queryable value.
     */
    setQueryable(queryable: boolean): void;
    /**
     * Indicates if the layer is currently hoverable.
     * @returns The currently hoverable flag.
     */
    getHoverable(): boolean;
    /**
     * Sets if the layer is currently hoverable.
     * @param hoverable - The hoverable value.
     */
    setHoverable(hoverable: boolean): void;
    /**
     * Gets the extent of an array of features.
     * @param objectIds - The IDs of the features to calculate the extent from.
     * @param outProjection - The output projection for the extent.
     * @param outfield - Optional. ID field to return for services that require a value in outfields.
     * @returns The extent of the features, if available
     */
    getExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Gets the field type for the given field name.
     * @param fieldName - The field name
     * @returns The field type.
     */
    getFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Gets the layer filters associated to the layer.
     * @returns The filter associated to the layer or undefined.
     */
    getLayerFilters(): LayerFilters;
    /**
     * Sets the layer filters associated to the layer.
     * @param {LayerFilters | undefined} layerFilters - The filter layers associated to the layer or undefined.
     * @returns {void}
     */
    setLayerFilters(layerFilters: LayerFilters, refresh: boolean | undefined): void;
    /**
     * Applies a time filter on a date range.
     * @param {string} date1 - The start date
     * @param {string} date2 - The end date
     */
    setLayerFiltersDate(date1: string, date2: string): void;
    /**
     * Returns feature information for the layer specified.
     * @param {OLMap} map - The Map to get feature info from.
     * @param {QueryType} queryType - The type of query to perform.
     * @param {TypeLocation} location - An pixel, coordinate or polygon that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} [abortController] - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    getFeatureInfo(map: OLMap, queryType: QueryType, location: TypeLocation, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoResult>;
    /**
     * Queries the legend.
     * This function raises legend querying and queried events. It calls the overridable onFetchLegend() function.
     * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received.
     */
    queryLegend(): Promise<TypeLegend | null>;
    /**
     * Waits until the underlying OpenLayers source reaches the `ready` state.
     * If the source is already ready, the returned promise resolves immediately.
     * If the source enters the `error` state, the promise is rejected.
     * @returns {Promise<void>} A promise that resolves when the source state becomes
     * `ready`, or rejects if the source enters the `error` state.
     */
    waitForSourceReady(): Promise<void>;
    /**
     * Waits for the next render cycle of the underlying OpenLayers layer to complete.
     * Resolves the returned promise after the layer emits a `postrender` event,
     * indicating that it has finished rendering for a frame.
     * @returns {Promise<void>} A promise that resolves after the layer has rendered
     * at least once.
     */
    waitForRender(): Promise<void>;
    /**
     * Utility function allowing to wait for the layer to be loaded at least once.
     * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
     * @returns {Promise<boolean>} A Promise that resolves when the layer has been loaded at least once.
     */
    waitLoadedOnce(timeout?: number): Promise<boolean>;
    /**
     * Utility function allowing to wait for the layer to be loaded at least once.
     * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
     * @returns {Promise<boolean>} A Promise that resolves when the layer has been loaded at least once.
     */
    waitLoadedStatus(timeout?: number): Promise<boolean>;
    /**
     * Utility function allowing to wait for the layer legend to be fetched.
     * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
     * @returns {Promise<TypeLegend>} A Promise that resolves when the layer legend has been fetched.
     */
    waitLegendFetched(timeout?: number): Promise<TypeLegend>;
    /**
     * Utility function allowing to wait for the layer style to be applied.
     * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
     * @returns {Promise<void>} A Promise that resolves when the layer style has been applied.
     */
    waitStyleApplied(timeout?: number): Promise<TypeLayerStyleConfig>;
    /**
     * Formats a list of features into an array of TypeFeatureInfoEntry, including icons, field values, domains, and metadata.
     * @param {Feature[]} features - Array of features to format.
     * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - Configuration of the associated layer.
     * @param {string | undefined} [serviceDateFormat] - The date format used by the service, if applicable.
     * @param {string | undefined} [serviceDateIANA] - The IANA time zone identifier used by the service, if applicable.
     * @param {TemporalMode | undefined} [serviceDateTemporalMode] - When `calendar`, treats the input as a calendar-date-only value (no timezones). When 'instant', treats the input as moment in time (timezones aware).
     * @returns {TypeFeatureInfoEntry[]} An array of TypeFeatureInfoEntry objects.
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | EsriImageLayerEntryConfig | VectorLayerEntryConfig, serviceDateFormat: string | undefined, serviceDateIANA: string | undefined, serviceDateTemporalMode: TemporalMode | undefined): TypeFeatureInfoEntry[];
    /**
     * Emits a layer-specific message event with localization support
     * @param {string} messageKey - The key used to lookup the localized message OR message
     * @param {string[]} messageParams - Array of parameters to be interpolated into the localized message
     * @param {SnackbarType} messageType - The message type
     * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
     *
     * @example
     * this.emitMessage(
     *   'layers.fetchProgress',
     *   ['50', '100'],
     *   messageType: 'error',
     *   true
     * );
     *
     * @fires LayerMessageEvent
     * @protected
     */
    protected emitMessage(messageKey: string, messageParams: unknown[] | undefined, messageType?: SnackbarType, notification?: boolean): void;
    /**
     * Registers a legend querying event handler.
     * @param {LegendQueryingDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLegendQuerying(callback: LegendQueryingDelegate): void;
    /**
     * Unregisters a legend querying event handler.
     * @param {LegendQueryingDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLegendQuerying(callback: LegendQueryingDelegate): void;
    /**
     * Registers a legend queried event handler.
     * @param {LegendQueriedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLegendQueried(callback: LegendQueriedDelegate): void;
    /**
     * Unregisters a legend queried event handler.
     * @param {LegendQueriedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLegendQueried(callback: LegendQueriedDelegate): void;
    /**
     * Emits filter applied event.
     * @param {FilterAppliedEvent} event - The event to emit
     * @private
     */
    protected emitLayerFilterApplied(event: LayerFilterAppliedEvent): void;
    /**
     * Registers a filter applied event handler.
     * @param {FilterAppliedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerFilterApplied(callback: LayerFilterAppliedDelegate): void;
    /**
     * Unregisters a filter applied event handler.
     * @param {FilterAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFilterApplied(callback: LayerFilterAppliedDelegate): void;
    /**
     * Registers a layer style changed event handler.
     * @param {StyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerStyleChanged(callback: StyleChangedDelegate): void;
    /**
     * Unregisters a layer style changed event handler.
     * @param {StyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStyleChanged(callback: StyleChangedDelegate): void;
    /**
     * Registers when a layer have been first loaded on the map event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerFirstLoaded(callback: LayerDelegate): void;
    /**
     * Unregisters when a layer have been first loaded on the map event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFirstLoaded(callback: LayerDelegate): void;
    /**
     * Registers when a layer is turning into a loading stage event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoading(callback: LayerDelegate): void;
    /**
     * Unregisters when a layer is turning into a loading stage event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoading(callback: LayerDelegate): void;
    /**
     * Registers when a layer is turning into a loaded stage event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerLoaded(callback: LayerDelegate): void;
    /**
     * Unregisters when a layer is turning into a loaded stage event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: LayerDelegate): void;
    /**
     * Registers when a layer is turning into a error stage event handler.
     * @param {LayerDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerError(callback: LayerErrorDelegate): void;
    /**
     * Unregisters when a layer is turning into a error stage event handler.
     * @param {LayerDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerError(callback: LayerErrorDelegate): void;
    /**
     * Registers a layer message event handler.
     * @param {LayerMessageEventDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerMessage(callback: LayerMessageDelegate): void;
    /**
     * Unregisters a layer message event handler.
     * @param {LayerMessageEventDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerMessage(callback: LayerMessageDelegate): void;
    /**
     * Registers an queryable changed event handler.
     * @param {LayerQueryableChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerQueryableChanged(callback: LayerQueryableChangedDelegate): void;
    /**
     * Unregisters an queryable changed event handler.
     * @param {LayerQueryableChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerQueryableChanged(callback: LayerQueryableChangedDelegate): void;
    /**
     * Registers an hoverable changed event handler.
     * @param {LayerHoverableChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerHoverableChanged(callback: LayerHoverableChangedDelegate): void;
    /**
     * Unregisters an hoverable changed event handler.
     * @param {LayerHoverableChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerHoverableChanged(callback: LayerHoverableChangedDelegate): void;
    /**
     * Initializes common properties on a layer options.
     * @param {Options} layerOptions - The layer options to initialize
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The config to read the initial settings from
     */
    protected static initOptionsWithInitialSettings(layerOptions: Options, layerConfig: AbstractBaseLayerEntryConfig): void;
    /**
     * Creates a legend object based on a given GeoView layer type and style configuration.
     * This method builds a legend representation by combining the provided style settings
     * with the computed legend symbols retrieved from the renderer. It is asynchronous
     * because it waits for `GeoviewRenderer.getLegendStyles` to generate the legend items.
     * @param {TypeGeoviewLayerType} schemaTag - The GeoView layer type identifier (e.g., vector, raster, etc.).
     * @param {Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>>} [style] -
     *   Optional style configuration mapping geometry types to their style settings.
     * @returns {Promise<TypeLegend>} A promise that resolves to a legend object containing:
     * - `type`: the layer type.
     * - `styleConfig`: the provided style configuration.
     * - `legend`: the legend entries generated from the style.
     * @async
     * @static
     */
    static createLegendFromStyle(schemaTag: TypeGeoviewLayerType, style: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined): Promise<TypeLegend>;
    /**
     * Retrieves or generates an image source (data URI or path) representing the visual style of a feature.
     * Caches results in the `imageSourceDict` to avoid redundant processing.
     * @param {Feature} feature - The feature whose visual representation is to be retrieved.
     * @param {TypeLayerStyleConfig} layerStyle - Style configuration grouped by geometry type (e.g., Point, LineString, Polygon).
     * @param {TypeLayerMetadataFields[]?} domainsLookup - Optional domain information for interpreting coded values.
     * @param {Record<string, string>} aliasLookup - A mapping of original field names to their aliases.
     * @param {Record<string, string | undefined>} imageSourceDict - A dictionary used to cache and reuse image sources by style key.
     * @returns {string | undefined} The image source string representing the feature's style, or `undefined` if generation fails.
     */
    static getFeatureIconSource(feature: Feature, layerStyle: TypeLayerStyleConfig, domainsLookup: TypeLayerMetadataFields[] | undefined, aliasLookup: Record<string, string>, imageSourceDict: Record<string, string | undefined>): string | undefined;
    /**
     * Formats a set of OpenLayers features into a structured array of feature info entries.
     * Each feature is enriched with geometry, extent, field information, and optional styling.
     * @param {Feature[]} features - Array of OpenLayers features to process.
     * @param {string} layerPath - Path of the layer these features belong to.
     * @param {TypeGeoviewLayerType} schemaTag - The Geoview layer type for the features.
     * @param {string | undefined} nameField - Optional field name to use as the display name for features.
     * @param {TypeOutfields[] | undefined} outFields - Optional array of output fields to include in the feature info.
     * @param {boolean} supportZoomTo - Whether zoom-to functionality is supported for these features.
     * @param {TypeLayerMetadataFields[] | undefined} domainsLookup - Optional array of field metadata for domain lookups.
     * @param {Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined} layerStyle - Optional mapping of geometry type to style settings for icons.
     * @param {string | string[] | undefined} [inputFormat] - The format(s) to prioritize for string inputs. Defaults to an ISO-like format.
     * @param {TimeIANA | undefined} [inputTimezone] - The timezone IANA the dates are in.
     * @param {TemporalMode | undefined} [inputTemporalMode] - When `calendar`, treats the input as a calendar-date-only value (no timezones). When 'instant', treats the input as moment in time (timezones aware).
     * @param {(fieldName: string) => TypeOutfieldsType} callbackGetFieldType - Callback that returns the field type for a given field name.
     * @param {(fieldName: string) => codedValueType | rangeDomainType | null} callbackGetFieldDomain - Callback that returns the coded value or range domain for a given field name.
     * @param {GetFieldValueDelegate} callbackGetFieldValue - Callback that returns the value of a field for a feature, in the correct type.
     * @returns {TypeFeatureInfoEntry[]} Array of feature info entries representing each feature with enriched metadata.
     * @description
     * Will not throw; errors are caught and logged. Returns an empty array if processing fails.
     */
    static helperFormatFeatureInfoResult(features: Feature[], layerPath: string, schemaTag: TypeGeoviewLayerType, nameField: string | undefined, outFields: TypeOutfields[] | undefined, supportZoomTo: boolean, domainsLookup: TypeLayerMetadataFields[] | undefined, layerStyle: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined, inputFormat: string | string[] | undefined, inputTimezone: TimeIANA | undefined, inputTemporalMode: TemporalMode | undefined, callbackGetFieldType: (fieldName: string) => TypeOutfieldsType, callbackGetFieldDomain: (fieldName: string) => codedValueType | rangeDomainType | null, callbackGetFieldValue: GetFieldValueDelegate): TypeFeatureInfoEntry[];
    /**
     * Retrieves and formats the value of a field from an OpenLayers feature.
     * For fields of type `date`, the value is normalized and formatted using the
     * date management utilities. Date values may be provided as epoch milliseconds
     * or as date strings and are converted to a short ISO-like string.
     * @param {Feature} feature - The OpenLayers feature containing the field values.
     * @param {string} fieldName - The name of the field to retrieve.
     * @param {TypeOutfieldsType} fieldType - The type of the field (e.g. `'string'`, `'number'`, `'date'`).
     * @param {string | string[] | undefined} [inputFormat] - The format(s) to prioritize for string inputs. Defaults to an ISO-like format.
     * @param {TimeIANA | undefined} [inputTimezone] - The IANA timezone to assume when interpreting input date values.
     * @param {TemporalMode | undefined} [inputTemporalMode] - When `calendar`, treats the input as a calendar-date-only value (no timezones). When 'instant', treats the input as moment in time (timezones aware).
     * @returns {unknown} The formatted field value. For date fields, this is a
     * formatted date string; for other field types, the raw field value is returned.
     */
    static helperGetFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType, inputFormat: string | string[] | undefined, inputTimezone: TimeIANA | undefined, inputTemporalMode: TemporalMode | undefined): unknown;
}
export type GetFieldValueDelegate = (feature: Feature, fieldName: string, fieldType: TypeOutfieldsType, inputFormat: string | string[] | undefined, inputTimezone: TimeIANA | undefined, inputTemporalMode: TemporalMode | undefined) => unknown;
/**
 * Define an event for the delegate
 */
export type StyleChangedEvent = {
    style: TypeLayerStyleConfig;
};
/**
 * Define a delegate for the event handler function signature
 */
export type StyleChangedDelegate = EventDelegateBase<AbstractGVLayer, StyleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = unknown;
/**
 * Define a delegate for the event handler function signature
 */
export type LegendQueryingDelegate = EventDelegateBase<AbstractGVLayer, LegendQueryingEvent, void>;
/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
    legend: TypeLegend;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LegendQueriedDelegate = EventDelegateBase<AbstractGVLayer, LegendQueriedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerFilterAppliedEvent = {
    filter: LayerFilters;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGVLayer, LayerFilterAppliedEvent, void>;
/**
 * Define a delegate for the event handler function signature
 */
export type LayerDelegate = EventDelegateBase<AbstractGVLayer, undefined, void>;
/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
    error: GeoViewError;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerErrorDelegate = EventDelegateBase<AbstractGVLayer, LayerErrorEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerMessageEvent = {
    messageKey: string;
    messageParams: unknown[] | undefined;
    messageType: SnackbarType;
    notification: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerMessageDelegate = EventDelegateBase<AbstractGVLayer, LayerMessageEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerQueryableChangedEvent = {
    queryable: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerQueryableChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerQueryableChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerHoverableChangedEvent = {
    hoverable: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerHoverableChangedDelegate = EventDelegateBase<AbstractBaseGVLayer, LayerHoverableChangedEvent, void>;
//# sourceMappingURL=abstract-gv-layer.d.ts.map