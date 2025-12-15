import type { Options } from 'ol/layer/Base';
import type { Coordinate } from 'ol/coordinate';
import type { Pixel } from 'ol/pixel';
import type { Extent } from 'ol/extent';
import type Feature from 'ol/Feature';
import type { Layer } from 'ol/layer';
import type Source from 'ol/source/Source';
import type { Projection as OLProjection } from 'ol/proj';
import type { Map as OLMap } from 'ol';
import type { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import type { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import type { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStyleConfig, TypeFeatureInfoEntry, codedValueType, rangeDomainType, TypeLocation, QueryType, TypeStyleGeometry, TypeOutfieldsType, TypeOutfields, TypeLayerStyleSettings } from '@/api/types/map-schema-types';
import type { TypeLayerMetadataFields, TypeGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { FilterNodeType } from '@/geo/utils/renderer/geoview-renderer-types';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { SnackbarType } from '@/core/utils/notifications';
/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export declare abstract class AbstractGVLayer extends AbstractBaseLayer {
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
     * @param {Source} olSource - The OpenLayer Source.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
     */
    protected constructor(olSource: Source, layerConfig: AbstractBaseLayerEntryConfig);
    /**
     * Must override method to return the bounds of a layer in the given projection.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent} The layer bounding box.
     */
    abstract onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {Layer} The strongly-typed OpenLayers type.
     */
    getOLLayer(): Layer;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {AbstractBaseLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): AbstractBaseLayerEntryConfig;
    /**
     * Overrides the way the attributions are retrieved.
     * @override
     * @returns {string[]} The layer attributions
     */
    onGetAttributions(): string[];
    /**
     * Overrides the refresh function to refresh the layer source.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     * @override
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Overridable function that gets the extent of an array of features.
     * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available
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
     * @param {Event} event - The event which is being triggered.
     */
    protected onLoading(event: Event): void;
    /**
     * Overridable method called when the layer has been loaded correctly.
     * @param {Event} event - The event which is being triggered.
     */
    protected onLoaded(event: Event): void;
    /**
     * Overridable method called when the layer is in error and couldn't be loaded correctly.
     * @param {Event} event - The event which is being triggered.
     */
    protected onError(event: Event): void;
    /**
     * Overridable method called when the layer image is in error and couldn't be loaded correctly.
     * @param {Event} event - The event which is being triggered.
     */
    protected onImageLoadError(event: Event): void;
    /**
     * Method called when the layer source changes to check for errors.
     * @param {Event} event - The event which is being triggered.
     */
    protected onSourceChange(event: Event): void;
    /**
     * Overridable function to get all feature information for all the features stored in the layer.
     * @param {OLMap} map - The Map so that we can grab the resolution/projection we want to get features on.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getAllFeatureInfo(map: OLMap, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overridable function to return of feature information at a given pixel location.
     * @param {OLMap} map - The Map where to get Feature Info At Pixel from.
     * @param {Pixel} location - The pixel coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(map: OLMap, location: Pixel, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overridable function to return of feature information at a given coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At Coordinate from.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(map: OLMap, location: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overridable function to return of feature information at the provided long lat coordinate.
     * @param {OLMap} map - The Map where to get Feature Info At LonLat from.
     * @param {Coordinate} lonlat - The coordinate that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLonLat(map: OLMap, lonlat: Coordinate, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overridable function to return of feature information at the provided bounding box.
     * @param {OLMap} map - The Map where to get Feature using BBox from.
     * @param {Coordinate} location - The bounding box that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoUsingBBox(map: OLMap, location: Coordinate[], queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Overridable function to return of feature information at the provided polygon.
     * @param {OLMap} map - The Map where to get Feature Info using Polygon from.
     * @param {Coordinate} location - The polygon that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoUsingPolygon(map: OLMap, location: Coordinate[], queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
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
     * Gets the bounds for the layer in the given projection.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    getBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Gets the temporal dimension that is associated to the layer.
     * @returns {TimeDimension | undefined} The temporal dimension associated to the layer or undefined.
     */
    getTimeDimension(): TimeDimension | undefined;
    /**
     * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
     * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
     */
    getIsTimeAware(): boolean;
    /**
     * Gets the in visible range value
     * @param {number | undefined} currentZoom - The map current zoom
     * @returns {boolean} true if the layer is in visible range
     */
    getInVisibleRange(currentZoom: number | undefined): boolean;
    /**
     * Gets the extent of an array of features.
     * @param {number[] | string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available
     */
    getExtentFromFeatures(objectIds: number[] | string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Gets the field type for the given field name.
     * @param {string} fieldName  - The field name
     * @returns {TypeOutfieldsType} The field type.
     */
    getFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Gets the layerFilter that is associated to the layer.
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(): string | undefined;
    /**
     * Returns feature information for the layer specified.
     * @param {OLMap} map - The Map to get feature info from.
     * @param {QueryType} queryType - The type of query to perform.
     * @param {TypeLocation} location - An pixel, coordinate or polygon that will be used by the query.
     * @param {boolean} queryGeometry - Whether to include geometry in the query, default is true.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} The feature info table.
     */
    getFeatureInfo(map: OLMap, queryType: QueryType, location: TypeLocation, queryGeometry?: boolean, abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
    /**
     * Queries the legend.
     * This function raises legend querying and queried events. It calls the overridable onFetchLegend() function.
     * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
     */
    queryLegend(): Promise<TypeLegend | null>;
    /**
     * Utility function allowing to wait for the layer to be loaded at least once.
     * @param {number} timeout - A timeout for the period to wait for. Defaults to 30,000 ms.
     * @returns {Promise<boolean>} A Promise that resolves when the layer has been loaded at least once.
     */
    waitLoadedOnce(timeout?: number): Promise<boolean>;
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
    waitStyleApplied(timeout?: number): Promise<TypeLayerStyleConfig | undefined>;
    /**
     * Gets and formats the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
     * since the base date. Vector feature dates must be in ISO format.
     * @param {Feature} feature - The feature that hold the field values.
     * @param {string} fieldName - The field name.
     * @param {TypeOutfieldsType} fieldType - The field type.
     * @returns {string | number | Date} The formatted value of the field.
     */
    protected getFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType): string | number | Date;
    /**
     * Formats a list of features into an array of TypeFeatureInfoEntry, including icons, field values, domains, and metadata.
     * @param {Feature[]} features - Array of features to format.
     * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - Configuration of the associated layer.
     * @returns {TypeFeatureInfoEntry[]} An array of TypeFeatureInfoEntry objects.
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig): TypeFeatureInfoEntry[];
    /**
     * Emits a layer-specific message event with localization support
     * @protected
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
     */
    protected emitMessage(messageKey: string, messageParams: string[], messageType?: SnackbarType, notification?: boolean): void;
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
     * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - The configuration for the layer containing the feature.
     * @param {TypeLayerMetadataFields[]?} domainsLookup - Optional domain information for interpreting coded values.
     * @param {Record<string, string>} aliasLookup - A mapping of original field names to their aliases.
     * @param {Record<string, string | undefined>} imageSourceDict - A dictionary used to cache and reuse image sources by style key.
     * @returns {string | undefined} The image source string representing the feature's style, or `undefined` if generation fails.
     */
    static getImageSource(feature: Feature, layerPath: string, layerStyle: TypeLayerStyleConfig, filterEquation: FilterNodeType[] | undefined, domainsLookup: TypeLayerMetadataFields[] | undefined, aliasLookup: Record<string, string>, imageSourceDict: Record<string, string | undefined>): string | undefined;
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
     * @param {FilterNodeType[] | undefined} filterEquation - Optional array of filters applied to the layer.
     * @param {(fieldName: string) => TypeOutfieldsType} callbackGetFieldType - Callback that returns the field type for a given field name.
     * @param {(fieldName: string) => codedValueType | rangeDomainType | null} callbackGetFieldDomain - Callback that returns the coded value or range domain for a given field name.
     * @param {(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType) => string | number | Date} callbackGetFieldValue - Callback that returns the value of a field for a feature, in the correct type.
     * @returns {TypeFeatureInfoEntry[]} Array of feature info entries representing each feature with enriched metadata.
     * @description
     * Will not throw; errors are caught and logged. Returns an empty array if processing fails.
     */
    static helperFormatFeatureInfoResult(features: Feature[], layerPath: string, schemaTag: TypeGeoviewLayerType, nameField: string | undefined, outFields: TypeOutfields[] | undefined, supportZoomTo: boolean, domainsLookup: TypeLayerMetadataFields[] | undefined, layerStyle: Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>> | undefined, filterEquation: FilterNodeType[] | undefined, callbackGetFieldType: (fieldName: string) => TypeOutfieldsType, callbackGetFieldDomain: (fieldName: string) => codedValueType | rangeDomainType | null, callbackGetFieldValue: (feature: Feature, fieldName: string, fieldType: TypeOutfieldsType) => string | number | Date): TypeFeatureInfoEntry[];
    /**
     * Gets and formats the value of a field from a feature.
     * For vector GeoView layers, dates are converted from milliseconds since the base date.
     * Vector feature dates must be in ISO format if stored as strings.
     * @param {Feature} feature - The OpenLayers feature that holds the field values.
     * @param {string} fieldName - The name of the field to retrieve.
     * @param {TypeOutfieldsType} fieldType - The type of the field ('string', 'number', 'date', etc.).
     * @param {TypeDateFragments | undefined} serverDateFragmentsOrder - Optional order of date fragments as expected from the server.
     *   If undefined, the server format will be deduced from the field value.
     * @param {TypeDateFragments | undefined} externalFragmentsOrder - Optional order of date fragments for external display formatting.
     * @returns {string | number | Date} The formatted field value.
     *   Returns a string, number, or Date depending on the field type.
     */
    static helperGetFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType, serverDateFragmentsOrder: TypeDateFragments | undefined, externalFragmentsOrder: TypeDateFragments | undefined): string | number | Date;
}
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
    filter: string;
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
    error: unknown;
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
    messageParams: string[];
    messageType: SnackbarType;
    notification: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
export type LayerMessageDelegate = EventDelegateBase<AbstractGVLayer, LayerMessageEvent, void>;
//# sourceMappingURL=abstract-gv-layer.d.ts.map