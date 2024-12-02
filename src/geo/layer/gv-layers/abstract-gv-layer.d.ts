import { Options } from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import Feature from 'ol/Feature';
import { Layer } from 'ol/layer';
import Source from 'ol/source/Source';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeLayerStyleConfig, TypeFeatureInfoEntry, codedValueType, rangeDomainType, TypeLocation, QueryType } from '@/geo/map/map-schema-types';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractBaseLayer } from './abstract-base-layer';
import { TypeOutfieldsType } from '@/api/config/types/map-schema-types';
/**
 * Abstract Geoview Layer managing an OpenLayer layer.
 */
export declare abstract class AbstractGVLayer extends AbstractBaseLayer {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /**
     * Constructs a GeoView layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {BaseLayer} olLayer - The OpenLayer layer.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration.
     */
    protected constructor(mapId: string, olSource: Source, layerConfig: AbstractBaseLayerEntryConfig);
    /**
     * Gets the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds.
     * @returns {Extent} The layer bounding box.
     */
    abstract getBounds(layerPath: string): Extent | undefined;
    /**
     * Initializes the GVLayer. This function checks if the source is ready and if so it calls onLoaded() to pursue initialization of the layer.
     * If the source isn't ready, it registers to the source ready event to pursue initialization of the layer once its source is ready.
     */
    init(): void;
    /**
     * Gets the MapViewer where the layer resides
     * @returns {MapViewer} The MapViewer
     */
    getMapViewer(): MapViewer;
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {Layer} The OpenLayers Layer
     */
    getOLLayer(): Layer;
    /**
     * Gets the OpenLayers Layer Source
     * @returns The OpenLayers Layer Source
     */
    getOLSource(): Source;
    /**
     * Gets the layer configuration associated with the layer.
     * @returns {AbstractBaseLayerEntryConfig} The layer configuration
     */
    getLayerConfig(): AbstractBaseLayerEntryConfig;
    /**
     * Gets the layer style
     * @returns The layer style
     */
    getStyle(layerPath: string): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer style
     * @param {TypeStyleConfig | undefined} style - The layer style
     */
    setStyle(layerPath: string, style: TypeLayerStyleConfig): void;
    /**
     * Gets the layer attributions
     * @returns {string[]} The layer attributions
     */
    getAttributions(): string[];
    /**
     * Gets the temporal dimension that is associated to the layer.
     * @returns {TimeDimension | undefined} The temporal dimension associated to the layer or undefined.
     */
    getTemporalDimension(): TimeDimension | undefined;
    /**
     * Sets the temporal dimension for the layer.
     * @param {TimeDimension} temporalDimension - The value to assign to the layer temporal dimension property.
     */
    setTemporalDimension(temporalDimension: TimeDimension): void;
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
     * Overridable method called when the layer has been loaded correctly
     */
    protected onLoaded(): void;
    /**
     * Overridable method called when the layer is in error and couldn't be loaded correctly
     */
    protected onError(): void;
    /**
     * Returns feature information for the layer specified.
     * @param {QueryType} queryType - The type of query to perform.
     * @param {TypeLocation} location - An optionsl pixel, coordinate or polygon that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    getFeatureInfo(queryType: QueryType, layerPath: string, location?: TypeLocation): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overridable function to get all feature information for all the features stored in the layer.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getAllFeatureInfo(): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overridable function to return of feature information at a given pixel location.
     * @param {Coordinate} location - The pixel coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtPixel(location: Pixel): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overridable function to return of feature information at a given coordinate.
     * @param {Coordinate} location - The coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overridable function to return of feature information at the provided long lat coordinate.
     * @param {Coordinate} lnglat - The coordinate that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoAtLongLat(location: Coordinate): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overridable function to return of feature information at the provided bounding box.
     * @param {Coordinate} location - The bounding box that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[]): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Overridable function to return of feature information at the provided polygon.
     * @param {Coordinate} location - The polygon that will be used by the query.
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise of an array of TypeFeatureInfoEntry[].
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[]): Promise<TypeFeatureInfoEntry[] | undefined | null>;
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
     * This function raises legend querying and queried events. It calls the overridable getLegend() function.
     * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
     */
    queryLegend(): Promise<TypeLegend | null>;
    /**
     * Update the size of the icon image list based on styles.
     * @param {TypeLegend} legend - The legend to check.
     */
    updateIconImageCache(legend: TypeLegend): void;
    /**
     * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
     * of the layerConfig object is undefined, the legend property of the object returned will be null.
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(): Promise<TypeLegend | null>;
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
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The Array of feature information.
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Gets the layerFilter that is associated to the layer.
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(layerPath: string): string | undefined;
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
     * @param {LayerStyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerStyleChanged(callback: LayerStyleChangedDelegate): void;
    /**
     * Unregisters a layer style changed event handler.
     * @param {LayerStyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStyleChanged(callback: LayerStyleChangedDelegate): void;
    /**
     * Registers an individual layer loaded event handler.
     * @param {IndividualLayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void;
    /**
     * Unregisters an individual layer loaded event handler.
     * @param {IndividualLayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type LayerStyleChangedDelegate = EventDelegateBase<AbstractGVLayer, LayerStyleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerStyleChangedEvent = {
    style: TypeLayerStyleConfig;
    layerPath: string;
};
/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = unknown;
/**
 * Define a delegate for the event handler function signature
 */
type LegendQueryingDelegate = EventDelegateBase<AbstractGVLayer, LegendQueryingEvent, void>;
/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
    legend: TypeLegend;
};
/**
 * Define a delegate for the event handler function signature
 */
type LegendQueriedDelegate = EventDelegateBase<AbstractGVLayer, LegendQueriedEvent, void>;
/**
 * Define a delegate for the event handler function signature
 */
type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGVLayer, LayerFilterAppliedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerFilterAppliedEvent = {
    layerPath: string;
    filter: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type IndividualLayerLoadedDelegate = EventDelegateBase<AbstractGVLayer, IndividualLayerLoadedEvent, void>;
/**
 * Define an event for the delegate
 */
export type IndividualLayerLoadedEvent = {
    layerPath: string;
};
export {};
