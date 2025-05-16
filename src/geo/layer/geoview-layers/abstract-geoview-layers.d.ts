import BaseLayer from 'ol/layer/Base';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeDateFragments } from '@/core/utils/date-mgt';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeLayerInitialSettings, TypeLayerStatus, TypeStyleGeometry, TypeGeoviewLayerType } from '@/api/config/types/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { SnackbarType } from '@/core/utils/notifications';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
/**
 * The AbstractGeoViewLayer class is the abstraction class of all GeoView Layers classes.
 * It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 *
 * The general order of the overridable methods in the processing is:
 * 1. onFetchAndSetServiceMetadata
 * 2. onValidateListOfLayerEntryConfig
 * 3. onValidateLayerEntryConfig
 * 4. onProcessLayerMetadata
 * 5. onProcessOneLayerEntry
 * 6. onCreateGVLayer
 *
 */
export declare abstract class AbstractGeoViewLayer {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
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
    /** List of errors for the layers that did not load. */
    layerLoadError: Error[];
    /** The OpenLayer root layer representing this GeoView Layer. */
    olRootLayer?: BaseLayer;
    /** The service metadata. */
    metadata: TypeJsonObject | null;
    /** Date format object used to translate server to ISO format and ISO to server format */
    serverDateFragmentsOrder?: TypeDateFragments;
    /**
     * Constructor
     * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
     */
    constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig);
    /**
     * A quick getter to help identify which layer class the current instance is coming from.
     */
    getClassName(): string;
    /**
     * Gets the Geoview layer id.
     * @returns {string} The geoview layer id
     */
    getGeoviewLayerId(): string;
    /**
     * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
     * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
     * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
     * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
     * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
     * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
     * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
     * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
     * the method #processListOfLayerMetadata, priority being given to the first of the two. When the GeoView layer does not
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
     * Must override method to read the service metadata from the metadataAccessPath and stores it in the 'metadata' property.
     * @returns {Promise<void>} A promise resolved once the metadata has been fetched and assigned to the 'metadata' property.
     */
    protected abstract onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entries configuration to validate.
     */
    validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /**
     * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entries configuration to validate.
     */
    protected onValidateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /**
     * Validates the configuration of the layer entries to ensure that each layer is correctly defined.
     * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate
     */
    validateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
    /**
     * Overridable method to validate the configuration of the layer entries to ensure that each layer is correctly defined.
     */
    protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
    /**
     * Must override method to process a layer entry and return a Promise of an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - Information needed to create the GeoView layer.
     * @returns {Promise<AbstractBaseLayerEntryConfig>} The Promise that the config metadata has been processed.
     */
    protected abstract onProcessLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /**
     * Overridable method to process a layer entry and return a Promise of an Open Layer Base Layer object.
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @returns {Promise<BaseLayer>} The Open Layer Base Layer that has been created.
     */
    protected onProcessOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayer>;
    /**
     * Creates a GV Layer from a layer configuration.
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @returns {AbstractGVLayer} The GV Layer that has been created.
     */
    protected createGVLayer(layerConfig: AbstractBaseLayerEntryConfig): AbstractGVLayer;
    /**
     * Must override method to create a GV Layer from a layer configuration.
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     * @returns {AbstractGVLayer} The GV Layer that has been created.
     */
    protected abstract onCreateGVLayer(layerConfig: AbstractBaseLayerEntryConfig): AbstractGVLayer;
    /**
     * Creates a layer group.
     * @param {GroupLayerEntryConfig} layerConfig The layer group configuration.
     * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
     * @returns {LayerGroup} A new layer group.
     */
    protected createLayerGroup(layerConfig: GroupLayerEntryConfig, initialSettings: TypeLayerInitialSettings): GVGroupLayer;
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
     * Adds a GeoViewLayerLoadedFailedError in the internal list of errors for a layer being loaded.
     * It also sets the layer status to error.
     */
    addLayerLoadError(error: Error, layerConfig: TypeLayerEntryConfig | undefined): void;
    /**
     * Aggregates the errors that might have happened during processing and that are stored in layerLoadError, if any.
     */
    aggregateLayerLoadErrors(): AggregateError | undefined;
    /**
     * Throws an aggregate error based on the 'layerLoadError' list, if any.
     */
    throwAggregatedLayerLoadErrors(): void;
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
     * Emits an event to all handlers.
     * @param {LayerEntryRegisterInitEvent} event The event to emit
     */
    emitLayerEntryRegisterInit(event: LayerEntryRegisterInitEvent): void;
    /**
     * Registers a layer entry config processed event handler.
     * @param {LayerEntryRegisterInitDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerEntryRegisterInit(callback: LayerEntryRegisterInitDelegate): void;
    /**
     * Unregisters a layer entry config processed event handler.
     * @param {LayerEntryRegisterInitDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerEntryRegisterInit(callback: LayerEntryRegisterInitDelegate): void;
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
     * @param {LayerConfigCreatedEvent} event The event to emit
     * @private
     */
    protected emitLayerConfigCreated(event: LayerConfigCreatedEvent): void;
    /**
     * Registers a config created event handler.
     * @param {LayerConfigCreatedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerConfigCreated(callback: LayerConfigCreatedDelegate): void;
    /**
     * Unregisters a config created event handler.
     * @param {LayerConfigCreatedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerConfigCreated(callback: LayerConfigCreatedDelegate): void;
    /**
     * Emits an event to all handlers.
     * @param {LayerGVCreatedEvent} event The event to emit
     * @private
     */
    protected emitLayerGVCreated(event: LayerGVCreatedEvent): void;
    /**
     * Registers a config created event handler.
     * @param {LayerGVCreatedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerGVCreated(callback: LayerGVCreatedDelegate): void;
    /**
     * Unregisters a config created event handler.
     * @param {LayerGVCreatedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerGVCreated(callback: LayerGVCreatedDelegate): void;
    /**
     * Emits an event to all handlers.
     * @param {LayerGroupCreatedEvent} event The event to emit
     * @private
     */
    protected emitLayerGroupCreated(event: LayerGroupCreatedEvent): void;
    /**
     * Registers a layer creation event handler.
     * @param {LayerGroupCreatedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerGroupCreated(callback: LayerGroupCreatedDelegate): void;
    /**
     * Unregisters a layer creation event handler.
     * @param {LayerGroupCreatedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerGroupCreated(callback: LayerGroupCreatedDelegate): void;
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
export type LayerEntryRegisterInitEvent = {
    config: ConfigBaseClass;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryRegisterInitDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryRegisterInitEvent, void>;
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
export type LayerConfigCreatedEvent = {
    config: ConfigBaseClass;
    errors: Error[];
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerConfigCreatedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerConfigCreatedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerGVCreatedEvent = {
    layer: AbstractGVLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerGVCreatedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerGVCreatedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerGroupCreatedEvent = {
    layer: GVGroupLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerGroupCreatedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerGroupCreatedEvent, void>;
export interface TypeWmsLegendStyle {
    name: string;
    legend: HTMLCanvasElement | null;
}
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
