import { Options } from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import { Layer } from 'ol/layer';
import Source from 'ol/source/Source';
import { Projection as OLProjection } from 'ol/proj';
import { Map as OLMap } from 'ol';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeLayerStyleConfig, TypeFeatureInfoEntry, codedValueType, rangeDomainType, TypeLocation, QueryType, TypeOutfieldsType } from '@/api/config/types/map-schema-types';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { SnackbarType } from '@/core/utils/notifications';
/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export declare abstract class AbstractGVLayer extends AbstractBaseLayer {
    #private;
    /** The default hit tolerance the query should be using */
    static readonly DEFAULT_HIT_TOLERANCE: number;
    /** The default loading period before we show a message to the user about a layer taking a long time to render on map */
    static readonly DEFAULT_LOADING_PERIOD: number;
    /** Indicates if the layer has become in loaded status at least once already */
    loadedOnce: boolean;
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
     * Overrides the get of the OpenLayers Layer
     * @returns {Layer} The OpenLayers Layer
     */
    getOLLayer(): Layer;
    /**
     * Gets the layer configuration associated with the layer.
     * @returns {AbstractBaseLayerEntryConfig} The layer configuration
     */
    getLayerConfig(): AbstractBaseLayerEntryConfig;
    /**
     * Overrides the way the attributions are retrieved.
     * @returns {string[]} The layer attributions
     */
    onGetAttributions(): string[];
    /**
     * Overrides the refresh function to refresh the layer source.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Overridable function that gets the extent of an array of features.
     * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available
     */
    protected onGetExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
    /**
     * Initializes the GVLayer. This function checks if the source is ready and if so it calls onLoaded() to pursue initialization of the layer.
     * If the source isn't ready, it registers to the source ready event to pursue initialization of the layer once its source is ready.
     */
    init(): void;
    /**
     * Overridable method called when the layer has started to load itself on the map.
     * @param {unknown} event - The event which is being triggered.
     */
    protected onLoading(event: unknown): void;
    /**
     * Overridable method called when the layer has been loaded correctly.
     * @param {unknown} event - The event which is being triggered.
     */
    protected onLoaded(event: unknown): void;
    /**
     * Overridable method called when the layer is in error and couldn't be loaded correctly.
     * @param {unknown} event - The event which is being triggered.
     */
    protected onError(event: unknown): void;
    /**
     * Overridable method called when the layer image is in error and couldn't be loaded correctly.
     * We do not put the layer status as error, as this could be specific to a zoom level and the layer is otherwise fine.
     * @param {unknown} event - The event which is being triggered.
     */
    protected onImageLoadError(event: unknown): void;
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
     * Gets the layer style
     * @returns The layer style
     */
    getStyle(): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer style
     * @param {TypeStyleConfig | undefined} style - The layer style
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
    getTemporalDimension(): TimeDimension | undefined;
    /**
     * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
     * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default.
     */
    getIsTimeAware(): boolean;
    /**
     * Gets the external fragments order.
     * @returns {TypeDateFragments | undefined} The external fragmets order associated to the layer or undefined.
     */
    getExternalFragmentsOrder(): TypeDateFragments | undefined;
    /**
     * Gets the in visible range value
     * @param {number | undefined} currentZoom - The map current zoom
     * @returns {boolean} true if the layer is in visible range
     */
    getInVisibleRange(currentZoom: number | undefined): boolean;
    /**
     * Gets the extent of an array of features.
     * @param {string[]} objectIds - The IDs of the features to calculate the extent from.
     * @param {OLProjection} outProjection - The output projection for the extent.
     * @param {string} outfield - ID field to return for services that require a value in outfields.
     * @returns {Promise<Extent>} The extent of the features, if available
     */
    getExtentFromFeatures(objectIds: string[], outProjection: OLProjection, outfield?: string): Promise<Extent>;
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
     * Overridable function to get all feature information for all the features stored in the layer.
     * @param {AbortController?} abortController - The optional abort controller.
     * @returns {Promise<TypeFeatureInfoEntry[]>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getAllFeatureInfo(abortController?: AbortController | undefined): Promise<TypeFeatureInfoEntry[]>;
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
    protected getFieldDomain(fieldName: string): null | codedValueType | rangeDomainType;
    /**
     * Overridable function to return the type of the specified field from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     *
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected getFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Queries the legend.
     * This function raises legend querying and queried events. It calls the overridable onFetchLegend() function.
     * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
     */
    queryLegend(): Promise<TypeLegend | null>;
    /**
     * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
     * of the layerConfig object is undefined, the legend property of the object returned will be null.
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    onFetchLegend(): Promise<TypeLegend | null>;
    /**
     * Overridable function set the style according to the fetched legend information
     *
     * @param {TypeLegend} legend - The fetched legend information
     */
    onSetStyleAccordingToLegend(legend: TypeLegend): void;
    /**
     * Gets and formats the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
     * since the base date. Vector feature dates must be in ISO format.
     * @param {Feature} features - The features that hold the field values.
     * @param {string} fieldName - The field name.
     * @param {TypeOutfieldsType} fieldType - The field type.
     * @returns {string | number | Date} The formatted value of the field.
     */
    protected getFieldValue(feature: Feature, fieldName: string, fieldType: TypeOutfieldsType): string | number | Date;
    /**
     * Converts the feature information to an array of TypeFeatureInfoEntry[] | undefined | null.
     * @param {Feature[]} features - The array of features to convert.
     * @param {OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig} layerConfig - The layer configuration.
     * @returns {TypeFeatureInfoEntry[]} The Array of feature information.
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig): TypeFeatureInfoEntry[];
    /**
     * Gets the layerFilter that is associated to the layer.
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(): string | undefined;
    /**
     * Emits a layer-specific message event with localization support
     * @protected
     * @param {string} messageKey - The key used to lookup the localized message OR message
     * @param {string[]} messageParams - Array of parameters to be interpolated into the localized message
     * @param {SnackbarType} messageType - The message type
     * @param {boolean} [notification=false] - Whether to show this as a notification. Defaults to false
     * @returns {void}
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
     * Initializes common properties on a layer options.
     * @param {Options} layerOptions - The layer options to initialize
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The config to read the initial settings from
     */
    protected static initOptionsWithInitialSettings(layerOptions: Options, layerConfig: AbstractBaseLayerEntryConfig): void;
    /**
     * Registers a legend querying event handler.
     * @param {LegendQueryingDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLegendQuerying(callback: LegendQueryingDelegate): void;
    /**
     * Unregisters a legend querying event handler.
     * @param {LegendQueryingDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLegendQuerying(callback: LegendQueryingDelegate): void;
    /**
     * Registers a legend queried event handler.
     * @param {LegendQueriedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLegendQueried(callback: LegendQueriedDelegate): void;
    /**
     * Unregisters a legend queried event handler.
     * @param {LegendQueriedDelegate} callback The callback to stop being called whenever the event is emitted
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