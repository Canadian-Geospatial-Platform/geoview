import type BaseLayer from 'ol/layer/Base';
import type { Projection as OLProjection } from 'ol/proj';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { Extent } from '@/api/types/map-schema-types';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { AbstractBaseGVLayer, LayerBaseEvent, LayerNameChangedEvent, LayerOpacityChangedEvent, LayerVisibleChangedEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVGroupLayer, type LayerGroupChildrenUpdatedEvent } from '@/geo/layer/gv-layers/gv-group-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { LayerErrorEvent, LayerHoverableChangedEvent, LayerItemVisibilityChangedEvent, LayerMessageEvent, LayerQueryableChangedEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { GVWMS, type ImageLoadRescueEvent } from '@/geo/layer/gv-layers/raster/gv-wms';
/**
 * Domain class responsible for managing layer registrations and lifecycle.
 *
 * Owns the registries of layer entry configurations, GeoView layers, and
 * OpenLayers layers. Emits domain events when layers are registered,
 * unregistered, or when their properties change (status, name, queryable,
 * hoverable).
 */
export declare class LayerDomain {
    #private;
    /**
     * Constructor for the LayerDomain class.
     */
    constructor();
    /**
     * Gets the GeoView Layer Ids / UUIDs.
     *
     * @returns The ids of the layers
     */
    getGeoviewLayerIds(): string[];
    /**
     * Gets the Layer Entry layer paths.
     *
     * @returns The GeoView Layer Paths
     */
    getLayerEntryLayerPaths(): string[];
    /**
     * Gets the Layer Entry Configs.
     *
     * @returns The ConfigBaseClass Layer Entry configuration.
     */
    getLayerEntryConfigs(): ConfigBaseClass[];
    /**
     * Gets the layer configuration of the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The ConfigBaseClass layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     */
    getLayerEntryConfig(layerPath: string): ConfigBaseClass;
    /**
     * Gets the layer configuration of the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The ConfigBaseClass layer configuration or undefined if not found.
     */
    getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined;
    /**
     * Gets the layer configuration of a regular layer (not a group) at the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The AbstractBaseLayerEntryConfig layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
     */
    getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig;
    /**
     * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
     *
     * @param layerPath - The layer path.
     * @returns The GroupLayerEntryConfig layer configuration.
     * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
     */
    getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig;
    /**
     * Gets the GeoView Layer Paths.
     *
     * @returns The layer paths of the GV Layers
     */
    getGeoviewLayerPaths(): string[];
    /**
     * Gets all GeoView Layers
     *
     * @returns The list of new Geoview Layers
     */
    getGeoviewLayers(): AbstractBaseGVLayer[];
    /**
     * Gets all GeoView layers that are regular layers (not groups).
     *
     * This method filters the list returned by `getGeoviewLayers()` and
     * returns only the layers that are instances of `AbstractGVLayer`.
     *
     * @returns An array containing only the regular layers from the current GeoView layer collection.
     */
    getGeoviewLayersRegulars(): AbstractGVLayer[];
    /**
     * Gets all GeoView layers that are group layers.
     *
     * This method filters the list returned by `getGeoviewLayers()` and
     * returns only the layers that are instances of `GVGroupLayer`.
     *
     * @returns An array containing only the group layers from the current GeoView layer collection.
     */
    getGeoviewLayersGroups(): GVGroupLayer[];
    /**
     * Gets all GeoView layers that are at the root.
     *
     * @returns An array containing only the layers at the root level of the registry.
     */
    getGeoviewLayersRoot(): AbstractBaseGVLayer[];
    /**
     * Returns the GeoView instance associated to the layer path.
     *
     * @param layerPath - The layer path
     * @returns The AbstractBaseGVLayer associated to the layer path
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     */
    getGeoviewLayer(layerPath: string): AbstractBaseGVLayer;
    /**
     * Returns the GeoView Layer instance associated to the layer path.
     *
     * @param layerPath - The layer path
     * @returns The AbstractBaseGVLayer or undefined when not found
     */
    getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined;
    /**
     * Returns the AbstractGVLayer instance associated to the layer path.
     *
     * This returns an actual AbstractGVLayer and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
     * An AbstractGVLayer is essentially a layer that's not a group layer.
     *
     * @param layerPath - The layer path
     * @returns The AbstractGVLayer Layer
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     */
    getGeoviewLayerRegular(layerPath: string): AbstractGVLayer;
    /**
     * Returns the GeoView Layer instance associated to the layer path, if it exists.
     *
     * This returns an actual AbstractGVLayer (or undefined) and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
     * An AbstractGVLayer is essentially a layer that's not a group layer.
     *
     * @param layerPath - The layer path
     * @returns The AbstractGVLayer or undefined when not found
     * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
     */
    getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined;
    /**
     * Asynchronously returns the OpenLayer layer associated to a specific layer path.
     *
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
     *
     * @param layerPath - The layer path to the layer's configuration.
     * @param timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
     * @returns A promise that resolves to an OpenLayer layer associated to the layer path.
     */
    getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer>;
    /**
     * Registers a layer entry configuration.
     *
     * Keeps the layer configuration by its layer path and registers an internal handler
     * to track layer status changes throughout the configuration lifecycle.
     *
     * @param layerConfig - The layer configuration to register
     */
    registerLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Unregisters a layer entry configuration.
     *
     * Emits the layer entry config unregistered event so that controllers
     * can react to the removal.
     *
     * @param layerConfig - The layer configuration to unregister
     */
    unregisterLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Registers a GeoView layer and its OpenLayers equivalent.
     *
     * Keeps both the GeoView layer wrapper and the underlying OpenLayers layer by path.
     * For regular (non-group) layers, additionally registers a handler to track queryable state changes.
     *
     * @param gvLayer - The GeoView layer to register
     */
    registerGVLayer(gvLayer: AbstractBaseGVLayer): void;
    /**
     * Deletes a GeoView layer and its OpenLayers equivalent.
     *
     * Removes the layer from internal registries. For regular (non-group) layers,
     * unregisters the queryable state change handler before deletion.
     *
     * @param gvLayer - The GeoView layer to delete
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
     */
    deleteGVLayer(gvLayer: AbstractBaseGVLayer): void;
    /**
     * Checks if the layer statuses are all greater than or equal to the provided status
     *
     * @returns Indicates if all layers passed the callback and how many have passed the callback
     */
    checkLayerStatus(status: TypeLayerStatus, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number];
    /**
     * Checks if the layer statuses are loaded or error.
     *
     * @returns Indicates if all layers statuses are loaded or error
     */
    checkLayerStatusLoaded(): boolean;
    /**
     * Gets the max extent of all layers on the map, or of a provided subset of layers.
     *
     * @param layerIds - Identifiers or layerPaths of layers to get max extents from.
     * @returns A promise that resolves with the overall extent or undefined when no bounds are found
     */
    getExtentOfMultipleLayers(layerIds: string[], projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Registers a layer entry config registered handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerEntryConfigRegistered(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate;
    /**
     * Unregisters a layer entry config registered handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerEntryConfigRegistered(callback: DomainLayerStatusChangedDelegate | undefined): void;
    /**
     * Registers a layer entry config unregistered handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerEntryConfigUnregistered(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate;
    /**
     * Unregisters a layer entry config unregistered handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerEntryConfigUnregistered(callback: DomainLayerStatusChangedDelegate | undefined): void;
    /**
     * Registers a layer status changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate;
    /**
     * Unregisters a layer status changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStatusChanged(callback: DomainLayerStatusChangedDelegate | undefined): void;
    /**
     * Registers a layer all loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerAllLoaded(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate;
    /**
     * Unregisters a layer all loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerAllLoaded(callback: DomainLayerStatusChangedDelegate | undefined): void;
    /**
     * Registers a layer registered handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerRegistered(callback: DomainLayerRegisteredDelegate): DomainLayerRegisteredDelegate;
    /**
     * Unregisters a layer registered handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerRegistered(callback: DomainLayerRegisteredDelegate | undefined): void;
    /**
     * Registers a layer unregistered handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerUnregistered(callback: DomainLayerRegisteredDelegate): DomainLayerRegisteredDelegate;
    /**
     * Unregisters a layer unregistered handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerUnregistered(callback: DomainLayerRegisteredDelegate | undefined): void;
    /**
     * Registers a layer loading event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerLoading(callback: DomainLayerBaseDelegate): DomainLayerBaseDelegate;
    /**
     * Unregisters a layer loading event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoading(callback: DomainLayerBaseDelegate | undefined): void;
    /**
     * Registers a layer first loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerFirstLoaded(callback: DomainLayerBaseDelegate): DomainLayerBaseDelegate;
    /**
     * Unregisters a layer first loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFirstLoaded(callback: DomainLayerBaseDelegate | undefined): void;
    /**
     * Registers a layer loaded event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerLoaded(callback: DomainLayerBaseDelegate): DomainLayerBaseDelegate;
    /**
     * Unregisters a layer loaded event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerLoaded(callback: DomainLayerBaseDelegate | undefined): void;
    /**
     * Registers a layer error event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerError(callback: DomainLayerErrorDelegate): DomainLayerErrorDelegate;
    /**
     * Unregisters a layer error event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerError(callback: DomainLayerErrorDelegate | undefined): void;
    /**
     * Registers a layer name changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerNameChanged(callback: DomainLayerNameChangedDelegate): DomainLayerNameChangedDelegate;
    /**
     * Unregisters a layer name changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerNameChanged(callback: DomainLayerNameChangedDelegate | undefined): void;
    /**
     * Registers a layer visible changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerVisibleChanged(callback: DomainLayerVisibleChangedDelegate): DomainLayerVisibleChangedDelegate;
    /**
     * Unregisters a layer visible changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerVisibleChanged(callback: DomainLayerVisibleChangedDelegate | undefined): void;
    /**
     * Registers a layer opacity changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerOpacityChanged(callback: DomainLayerOpacityChangedDelegate): DomainLayerOpacityChangedDelegate;
    /**
     * Unregisters a layer opacity changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerOpacityChanged(callback: DomainLayerOpacityChangedDelegate | undefined): void;
    /**
     * Registers a layer hoverable changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerHoverableChanged(callback: DomainLayerHoverableChangedDelegate): DomainLayerHoverableChangedDelegate;
    /**
     * Unregisters a layer hoverable changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerHoverableChanged(callback: DomainLayerHoverableChangedDelegate | undefined): void;
    /**
     * Registers a layer queryable changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerQueryableChanged(callback: DomainLayerQueryableChangedDelegate): DomainLayerQueryableChangedDelegate;
    /**
     * Unregisters a layer queryable changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerQueryableChanged(callback: DomainLayerQueryableChangedDelegate | undefined): void;
    /**
     * Registers a layer message event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerMessage(callback: DomainLayerMessageDelegate): DomainLayerMessageDelegate;
    /**
     * Unregisters a layer message event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerMessage(callback: DomainLayerMessageDelegate | undefined): void;
    /**
     * Registers a layer item visibility changed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerItemVisibilityChanged(callback: DomainLayerItemVisibilityChangedDelegate): DomainLayerItemVisibilityChangedDelegate;
    /**
     * Unregisters a layer item visibility changed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerItemVisibilityChanged(callback: DomainLayerItemVisibilityChangedDelegate | undefined): void;
    /**
     * Registers a layer WMS image load rescue event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerWMSImageLoadRescue(callback: DomainLayerWMSImageLoadRescueDelegate): DomainLayerWMSImageLoadRescueDelegate;
    /**
     * Unregisters a layer WMS image load rescue event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerWMSImageLoadRescue(callback: DomainLayerWMSImageLoadRescueDelegate | undefined): void;
    /**
     * Registers a layer group layer added event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerGroupLayerAdded(callback: DomainLayerGroupChildrenUpdatedDelegate): DomainLayerGroupChildrenUpdatedDelegate;
    /**
     * Unregisters a layer group layer added event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerGroupLayerAdded(callback: DomainLayerGroupChildrenUpdatedDelegate | undefined): void;
    /**
     * Registers a layer group layer removed event handler.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     * @returns The callback registered, for chaining or unregistration purposes
     */
    onLayerGroupLayerRemoved(callback: DomainLayerGroupChildrenUpdatedDelegate): DomainLayerGroupChildrenUpdatedDelegate;
    /**
     * Unregisters a layer group layer removed event handler.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offLayerGroupLayerRemoved(callback: DomainLayerGroupChildrenUpdatedDelegate | undefined): void;
}
export interface DomainLayerEntryBaseEvent<T extends ConfigBaseClass = ConfigBaseClass> {
    config: T;
}
/**
 * Define an event for the delegate
 */
export interface DomainLayerStatusChangedEvent extends DomainLayerEntryBaseEvent {
    status: TypeLayerStatus;
}
/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerStatusChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerStatusChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerRegisteredEvent {
    layer: AbstractBaseGVLayer;
}
/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerRegisteredDelegate = EventDelegateBase<LayerDomain, DomainLayerRegisteredEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerBaseEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer, U extends LayerBaseEvent = LayerBaseEvent> {
    layer: T;
    layerEvent: U;
}
/** Define a delegate for the layer loading event handler function signature. */
export type DomainLayerBaseDelegate = EventDelegateBase<LayerDomain, DomainLayerBaseEvent<AbstractBaseGVLayer, LayerBaseEvent>, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerErrorEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerErrorEvent> {
}
/** Define a delegate for the layer error event handler function signature. */
export type DomainLayerErrorDelegate = EventDelegateBase<LayerDomain, DomainLayerErrorEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerNameChangedEvent extends DomainLayerBaseEvent<AbstractBaseGVLayer, LayerNameChangedEvent> {
}
/** Define a delegate for the layer name changed event handler function signature. */
export type DomainLayerNameChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerNameChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerVisibleChangedEvent extends DomainLayerBaseEvent<AbstractBaseGVLayer, LayerVisibleChangedEvent> {
}
/** Define a delegate for the layer visible changed event handler function signature. */
export type DomainLayerVisibleChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerVisibleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerOpacityChangedEvent extends DomainLayerBaseEvent<AbstractBaseGVLayer, LayerOpacityChangedEvent> {
}
/** Define a delegate for the layer opacity changed event handler function signature. */
export type DomainLayerOpacityChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerOpacityChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerHoverableChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerHoverableChangedEvent> {
}
/** Define a delegate for the layer hoverable changed event handler function signature. */
export type DomainLayerHoverableChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerHoverableChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerQueryableChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerQueryableChangedEvent> {
}
/** Define a delegate for the layer queryable changed event handler function signature. */
export type DomainLayerQueryableChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerQueryableChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerMessageEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerMessageEvent> {
}
/** Define a delegate for the layer message event handler function signature. */
export type DomainLayerMessageDelegate = EventDelegateBase<LayerDomain, DomainLayerMessageEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerItemVisibilityChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerItemVisibilityChangedEvent> {
}
/** Define a delegate for the layer item visibility changed event handler function signature. */
export type DomainLayerItemVisibilityChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerItemVisibilityChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerWMSImageLoadRescueEvent extends DomainLayerBaseEvent<GVWMS, ImageLoadRescueEvent> {
}
/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerWMSImageLoadRescueDelegate = EventDelegateBase<LayerDomain, DomainLayerWMSImageLoadRescueEvent, boolean>;
/**
 * Define an event for the delegate
 */
export interface DomainLayerGroupChildrenUpdatedEvent extends DomainLayerBaseEvent<GVGroupLayer, LayerGroupChildrenUpdatedEvent> {
}
/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerGroupChildrenUpdatedDelegate = EventDelegateBase<LayerDomain, DomainLayerGroupChildrenUpdatedEvent, void>;
//# sourceMappingURL=layer-domain.d.ts.map