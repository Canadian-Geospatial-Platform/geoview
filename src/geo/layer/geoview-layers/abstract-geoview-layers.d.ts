import BaseLayer from 'ol/layer/Base';
import LayerGroup from 'ol/layer/Group';
import Source from 'ol/source/Source';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeLayerStyleConfig, TypeLayerInitialSettings, TypeLayerStatus, TypeStyleGeometry, CONST_LAYER_ENTRY_TYPES } from '@/api/config/types/map-schema-types';
import { GeoViewLayerLoadedFailedError } from '@/core/exceptions/layer-exceptions';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { SnackbarType } from '@/core/utils/notifications';
/**
 * The AbstractGeoViewLayer class is the abstraction class of all GeoView Layers classes.
 * It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
export declare abstract class AbstractGeoViewLayer {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /** The map id on which the GeoView layer will be drawn. */
    mapId: string;
    /** The type of GeoView layer that is instantiated. */
    type: TypeGeoviewLayerType;
    /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
     * If its value is undefined, a unique value is generated.
     */
    geoviewLayerId: string;
    /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
     * undefined, a default value is generated.
     */
    geoviewLayerName: string;
    /** The GeoView layer metadataAccessPath. The name attribute is optional */
    metadataAccessPath: string;
    /**
     * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
     * configuration does not provide a value, we use an empty array instead of an undefined attribute.
     */
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
    /** Initial settings to apply to the GeoView layer at creation time. This attribute is allowed only if listOfLayerEntryConfig.length > 1. */
    initialSettings?: TypeLayerInitialSettings;
    /** List of errors for the layers that did not load. */
    layerLoadError: GeoViewLayerLoadedFailedError[];
    /** The OpenLayer root layer representing this GeoView Layer. */
    olRootLayer?: BaseLayer;
    /** The service metadata. */
    metadata: TypeJsonObject | null;
    /** Date format object used to translate server to ISO format and ISO to server format */
    serverDateFragmentsOrder?: TypeDateFragments;
    /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
    externalFragmentsOrder: TypeDateFragments;
    /**
     * Constructor
     * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
     * @param {string} mapId - The unique identifier of the map on which the GeoView layer will be drawn.
     */
    constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig, mapId: string);
    /**
     * A quick getter to help identify which layer class the current instance is coming from.
     */
    getClassName(): string;
    /**
     * Gets the MapViewer where the layer resides
     * @returns {MapViewer} The MapViewer
     */
    getMapViewer(): MapViewer;
    /**
     * Gets the Geoview layer id.
     * @returns {string} The geoview layer id
     */
    getGeoviewLayerId(): string;
    /**
     * Gets the layer configuration of the specified layer path.
     *
     * @param {string} layerPath The layer path.
     *
     * @returns {ConfigBaseClass | undefined} The layer configuration or undefined if not found.
     */
    getLayerConfig(layerPath: string): ConfigBaseClass | undefined;
    /**
     * Gets the OpenLayer of the specified layer path.
     *
     * @param {string} layerPath The layer path.
     *
     * @returns {BaseLayer | undefined} The layer configuration or undefined if not found.
     */
    getOLLayer(layerPath: string): BaseLayer | undefined;
    /**
     * Gets the layer status
     * @returns The layer status
     */
    getLayerStatus(layerPath: string): TypeLayerStatus;
    /**
     * Gets the layer style
     * @returns The layer style
     */
    getStyle(layerPath: string): TypeLayerStyleConfig | undefined;
    /**
     * Sets the layer style
     * @param {TypeLayerStyleConfig | undefined} style - The layer style
     */
    setStyle(layerPath: string, style: TypeLayerStyleConfig): void;
    /**
     * Gets the layer attributions
     * @returns {string[]} The layer attributions
     */
    getAttributions(): string[];
    /**
     * Sets the layer attributions
     * @param {string[]} attributions - The layer attributions
     */
    setAttributions(attributions: string[]): void;
    /**
     * Get the layer metadata that is associated to the layer.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {TypeJsonObject} The layer metadata.
     */
    getLayerMetadata(layerPath: string): TypeJsonObject;
    /**
     * Set the layer metadata for the layer identified by specified layerPath.
     *
     * @param {string} layerPath The layer path to the layer's configuration affected by the change.
     * @param {TypeJsonObject} layerMetadata The value to assign to the layer metadata property.
     */
    setLayerMetadata(layerPath: string, layerMetadata: TypeJsonObject): void;
    /**
     * Get the temporal dimension that is associated to the layer. Returns undefined when the layer config can't be found using the layer
     * path.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {TimeDimension} The temporal dimension associated to the layer or undefined.
     */
    getTemporalDimension(layerPath: string): TimeDimension;
    /**
     * Set the layerTemporalDimension for the layer identified by specified layerPath.
     *
     * @param {string} layerPath The layer path to the layer's configuration affected by the change.
     * @param {TimeDimension} temporalDimension The value to assign to the layer temporal dimension property.
     */
    setTemporalDimension(layerPath: string, temporalDimension: TimeDimension): void;
    /**
     * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
     * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default..
     */
    getIsTimeAware(): boolean;
    /**
     * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
     * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
     * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
     * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
     * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
     * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
     * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
     * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
     * the method processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not
     * have a service definition, the getAdditionalServiceDefinition method does nothing.
     *
     * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
     * attribute. This method will also register the layers to all layer sets that offer this possibility. For example, if a layer
     * is queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
     * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
     * the details-panel.
     */
    createGeoViewLayers(): Promise<void>;
    /**
     * This method reads the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
     * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
     */
    fetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Overridable method to read the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
     * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /**
     * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /**
     * Validates the configuration of the layer entries to ensure that each layer is correctly defined.
     * @param layerConfig - The layer entry config to validate
     */
    validateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
    /**
     * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
     */
    protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
    /**
     * Recursively processes the metadata of each layer in the "layer list" configuration.
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig - The list of layers to process.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: ConfigBaseClass[]): Promise<void>;
    /**
     * Processes the layer metadata. It will fill the empty outfields and aliasFields properties of the
     * layer configuration when applicable.
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /**
     * Overridable method to process a layer entry and return a Promise of an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - Information needed to create the GeoView layer.
     * @returns {Promise<AbstractBaseLayerEntryConfig>} The Promise that the config metadata has been processed.
     */
    protected onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /**
     * Must override method to process a layer entry and return a Promise of an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
     */
    protected abstract onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer>;
    /**
     * Creates a layer group.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
     * @returns {LayerGroup} A new layer group.
     */
    protected createLayerGroup(layerConfig: TypeLayerEntryConfig, initialSettings: TypeLayerInitialSettings): LayerGroup;
    /**
     * Emits a layer-specific message event with localization support
     * @protected
     * @param {string} messageKey - The key used to lookup the localized message OR message
     * @param {string[] | undefined} messageParams - Array of parameters to be interpolated into the localized message
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
    protected emitMessage(messageKey: string, messageParams?: string[] | undefined, messageType?: SnackbarType, notification?: boolean): void;
    /**
     * Overridable function called when the layer gets in error status.
     * @param layerConfig - The layer configuration
     */
    protected onError(layerConfig: AbstractBaseLayerEntryConfig): void;
    /**
     * Adds an Error in the internal list of errors for a layer being loaded.
     * If the Error is already a GeoViewLayerLoadedFailedError, that Error is added as-is.
     * Otherwise, a new GeoViewLayerLoadedFailedError will be added in the internal list.
     * The layerConfig also gets its status set to error in the process.
     */
    addLayerLoadErrorError(layerConfig: TypeLayerEntryConfig, error: unknown): void;
    /**
     * Adds an new GeoViewLayerLoadedFailedError with the given message in the internal list of errors for a layer being loaded.
     * The layerConfig also gets its status set to error in the process.
     */
    addLayerLoadError(layerConfig: TypeLayerEntryConfig, message: string): void;
    /**
     * Throws an aggregate error based on the 'layerLoadError' list, if any.
     */
    throwAggregatedLayerLoadErrors(): void;
    /**
     * Sets the layerStatus code of all layers in the listOfLayerEntryConfig and the children.
     * If the error status of the layer entry is already 'error' the new status isn't applied.
     * If the new status is error, compile the error in the 'layerLoadError' using 'errorMessage' as the text.
     * @param {TypeLayerStatus} newStatus - The new status to assign to the layers.
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer's configuration.
     * @param {string} errorMessage - The error message.
     */
    setAllLayerStatusTo(newStatus: TypeLayerStatus, listOfLayerEntryConfig: TypeLayerEntryConfig[], errorMessage?: string): void;
    /**
     * Recursively processes the list of layer entries to see if all of them are greater than or equal to the provided layer status.
     * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
     * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
     */
    allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean;
    /**
     * Returns a Promise that will be resolved once the given layer is in a processed phase.
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * @param {AbstractGeoViewLayer} geoviewLayerConfig - The layer object
     * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
     * @returns {Promise<void>} A promise when done waiting
     * @throws An exception when the layer failed to become in processed phase before the timeout expired
     */
    waitForAllLayerStatusAreGreaterThanOrEqualTo(timeout?: number, checkFrequency?: number): Promise<void>;
    /**
     * Recursively gets all layer entry configs in the GeoView Layer.
     * @returns {ConfigBaseClass[]} The list of layer entry configs
     */
    getAllLayerEntryConfigs(): ConfigBaseClass[];
    /**
     * Registers a layer entry config processed event handler.
     * @param {LayerEntryProcessedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void;
    /**
     * Unregisters a layer entry config processed event handler.
     * @param {LayerEntryProcessedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void;
    /**
     * Emits an event to all handlers.
     * @param {LayerRequestingEvent} event The event to emit
     * @private
     */
    protected emitLayerRequesting(event: LayerRequestingEvent): BaseLayer[];
    /**
     * Registers a layer creation event handler.
     * @param {LayerRequestingDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerRequesting(callback: LayerRequestingDelegate): void;
    /**
     * Unregisters a layer creation event handler.
     * @param {LayerRequestingDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerRequesting(callback: LayerRequestingDelegate): void;
    /**
     * Emits an event to all handlers.
     * @param {LayerCreationEvent} event The event to emit
     * @private
     */
    protected emitLayerCreation(event: LayerCreationEvent): void;
    /**
     * Registers a layer creation event handler.
     * @param {LayerCreationDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerCreation(callback: LayerCreationDelegate): void;
    /**
     * Unregisters a layer creation event handler.
     * @param {LayerCreationDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerCreation(callback: LayerCreationDelegate): void;
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
    /**
     * Registers an individual layer message event handler.
     * @param {LayerMessageEventDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerMessage(callback: LayerMessageDelegate): void;
    /**
     * Unregisters an individual layer message event handler.
     * @param {LayerMessageEventDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerMessage(callback: LayerMessageDelegate): void;
}
/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = {
    layerPath: string;
};
/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
    layerPath: string;
    legend: TypeLegend;
};
/**
 * Define an event for the delegate
 */
export type VisibleChangedEvent = {
    layerPath: string;
    visible: boolean;
};
/**
 * Define an event for the delegate
 */
export type LayerEntryProcessedEvent = {
    config: ConfigBaseClass;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryProcessedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryProcessedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerRequestingEvent = {
    config: ConfigBaseClass;
    source: Source;
    extraConfig?: unknown;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerRequestingDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerRequestingEvent, BaseLayer>;
/**
 * Define an event for the delegate
 */
export type LayerCreationEvent = {
    config: ConfigBaseClass;
    layer: BaseLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerCreationDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerCreationEvent, void>;
export interface TypeWmsLegendStyle {
    name: string;
    legend: HTMLCanvasElement | null;
}
/**
 * Define a delegate for the event handler function signature
 */
type LayerStyleChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerStyleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerStyleChangedEvent = {
    style: TypeLayerStyleConfig;
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type IndividualLayerLoadedDelegate = EventDelegateBase<AbstractGeoViewLayer, IndividualLayerLoadedEvent, void>;
/**
 * Define an event for the delegate
 */
export type IndividualLayerLoadedEvent = {
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerMessageDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerMessageEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerMessageEvent = {
    messageKey: string;
    messageParams: string[];
    messageType: SnackbarType;
    notification: boolean;
};
export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement | null;
    styles?: TypeWmsLegendStyle[];
}
export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement | null;
}
export interface TypeVectorLegend extends TypeLegend {
    legend: TypeVectorLayerStyles;
}
export type TypeStyleRepresentation = {
    /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
     * break styles.
     */
    defaultCanvas?: HTMLCanvasElement | null;
    /** The arrayOfCanvas property is used by unique value and class break styles. */
    arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;
/**
 * GeoViewAbstractLayers types
 */
type LayerTypesKey = 'CSV' | 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'ESRI_IMAGE' | 'IMAGE_STATIC' | 'GEOJSON' | 'GEOPACKAGE' | 'XYZ_TILES' | 'VECTOR_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';
/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType = 'CSV' | 'esriDynamic' | 'esriFeature' | 'esriImage' | 'imageStatic' | 'GeoJSON' | 'GeoPackage' | 'xyzTiles' | 'vectorTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';
/**
 * This type is created to only be used when validating the configuration schema types.
 * Indeed, GeoCore is not an official Abstract Geoview Layer, but it can be used in schema types.
 */
export type TypeGeoviewLayerTypeWithGeoCore = TypeGeoviewLayerType | typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;
/**
 * Definition of the GeoView layer constants
 */
export declare const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType>;
/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export declare const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string>;
/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isVectorLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeVectorLegend;
/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isWmsLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeWmsLegend;
/**
 * type guard function that redefines a TypeLegend as a TypeImageStaticLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isImageStaticLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeImageStaticLegend;
export {};
