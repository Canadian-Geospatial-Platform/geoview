import type BaseLayer from 'ol/layer/Base';

import type {
  ConfigBaseClass,
  LayerStatusChangedDelegate,
  LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { whenThisThen } from '@/core/utils/utilities';
import { LayerConfigNotFoundError } from '@/core/exceptions/geoview-exceptions';
import { LayerWrongTypeError, LayerNotFoundError } from '@/core/exceptions/layer-exceptions';
import type { AbstractBaseGVLayer, LayerNameChangedDelegate, LayerNameChangedEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type {
  LayerHoverableChangedDelegate,
  LayerHoverableChangedEvent,
  LayerQueryableChangedDelegate,
  LayerQueryableChangedEvent,
} from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';

export class LayerDomain {
  /** Layers with valid configuration for this map. */
  #layerEntryConfigs: { [layerPath: string]: ConfigBaseClass } = {};

  /** Dictionary holding all the new GVLayers */
  #gvLayers: { [layerPath: string]: AbstractBaseGVLayer } = {};

  /** Dictionary holding all the OpenLayers layers */
  #olLayers: { [layerPath: string]: BaseLayer } = {};

  /** Keep a bounded reference to the handle layer status changed */
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  /** Keep a bounded reference to the handle layer status changed */
  #boundedHandleLayerNameChanged: LayerNameChangedDelegate;

  /** Keep a bounded reference to the handle layer queryable changed */
  #boundedHandleLayerQueryableChanged: LayerQueryableChangedDelegate;

  /** Keep a bounded reference to the handle layer hoverable changed */
  #boundedHandleLayerHoverableChanged: LayerHoverableChangedDelegate;

  /** Keep all callback delegate references */
  #onLayerEntryConfigRegisteredHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerEntryConfigUnregisteredHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerStatusChangedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerNameChangedHandlers: DomainLayerNameChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerHoverableChangedHandlers: DomainLayerHoverableChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerQueryableChangedHandlers: DomainLayerQueryableChangedDelegate[] = [];

  /**
   * Constructor for the LayerDomain class.
   */
  constructor() {
    // Keep bounded references to the handles
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundedHandleLayerNameChanged = this.#handleLayerNameChanged.bind(this);
    this.#boundedHandleLayerHoverableChanged = this.#handleLayerHoverableChanged.bind(this);
    this.#boundedHandleLayerQueryableChanged = this.#handleLayerQueryableChanged.bind(this);
  }

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    const uniqueIds = new Set<string>();
    for (const layerPath of this.getLayerEntryLayerPaths()) {
      uniqueIds.add(layerPath.split('/')[0]);
    }
    return Array.from(uniqueIds);
  }

  /**
   * Gets the Layer Entry layer paths.
   *
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    return Object.keys(this.#layerEntryConfigs);
  }

  /**
   * Gets the Layer Entry Configs.
   *
   * @returns The ConfigBaseClass Layer Entry configuration.
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    return Object.values(this.#layerEntryConfigs);
  }

  /**
   * Gets the layer configuration of the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The ConfigBaseClass layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    // Get the layer config
    const layerConfig = this.#layerEntryConfigs?.[layerPath];

    // If not found
    if (!layerConfig) throw new LayerConfigNotFoundError(layerPath);

    // Return the layer config
    return layerConfig;
  }

  /**
   * Gets the layer configuration of the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The ConfigBaseClass layer configuration or undefined if not found.
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    return this.#layerEntryConfigs?.[layerPath];
  }

  /**
   * Gets the layer configuration of a regular layer (not a group) at the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The AbstractBaseLayerEntryConfig layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig {
    // Get the layer entry config
    const layerConfig = this.getLayerEntryConfig(layerPath);

    // Check if wrong type
    if (!(layerConfig instanceof AbstractBaseLayerEntryConfig)) throw new LayerWrongTypeError(layerPath, layerConfig.getLayerNameCascade());

    // Return the layer config
    return layerConfig;
  }

  /**
   * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The GroupLayerEntryConfig layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig {
    // Get the layer entry config
    const layerConfig = this.getLayerEntryConfig(layerPath);

    // Check if wrong type
    if (!(layerConfig instanceof GroupLayerEntryConfig)) throw new LayerWrongTypeError(layerPath, layerConfig.getLayerNameCascade());

    // Return the layer config
    return layerConfig;
  }

  /**
   * Gets the GeoView Layer Paths.
   *
   * @returns The layer paths of the GV Layers
   */
  getGeoviewLayerPaths(): string[] {
    return Object.keys(this.#gvLayers);
  }

  /**
   * Gets all GeoView Layers
   *
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayers(): AbstractBaseGVLayer[] {
    return Object.values(this.#gvLayers);
  }

  /**
   * Gets all GeoView layers that are regular layers (not groups).
   *
   * This method filters the list returned by `getGeoviewLayers()` and
   * returns only the layers that are instances of `AbstractGVLayer`.
   *
   * @returns An array containing only the regular layers from the current GeoView layer collection.
   */
  getGeoviewLayersRegulars(): AbstractGVLayer[] {
    return this.getGeoviewLayers().filter((l) => l instanceof AbstractGVLayer);
  }

  /**
   * Gets all GeoView layers that are group layers.
   *
   * This method filters the list returned by `getGeoviewLayers()` and
   * returns only the layers that are instances of `GVGroupLayer`.
   *
   * @returns An array containing only the group layers from the current GeoView layer collection.
   */
  getGeoviewLayersGroups(): GVGroupLayer[] {
    return this.getGeoviewLayers().filter((l) => l instanceof GVGroupLayer);
  }

  /**
   * Gets all GeoView layers that are at the root.
   *
   * @returns An array containing only the layers at the root level of the registry.
   */
  getGeoviewLayersRoot(): AbstractBaseGVLayer[] {
    return this.getGeoviewLayers().filter((layer) => !layer.getParent());
  }

  /**
   * Returns the GeoView instance associated to the layer path.
   *
   * @param layerPath - The layer path
   * @returns The AbstractBaseGVLayer associated to the layer path
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractBaseGVLayer {
    // Get the layer
    const layer = this.#gvLayers[layerPath];

    // If not found
    if (!layer) throw new LayerNotFoundError(layerPath);

    // Return the layer
    return layer;
  }

  /**
   * Returns the GeoView Layer instance associated to the layer path.
   *
   * @param layerPath - The layer path
   * @returns The AbstractBaseGVLayer or undefined when not found
   */
  getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined {
    return this.#gvLayers[layerPath];
  }

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
  getGeoviewLayerRegular(layerPath: string): AbstractGVLayer {
    // Get the layer
    const layer = this.getGeoviewLayer(layerPath);

    // If wrong type
    if (!(layer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

    // Return the layer
    return layer;
  }

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
  getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined {
    // Get the layer if any
    const layer = this.getGeoviewLayerIfExists(layerPath);

    // If found, check if the right type
    if (layer) {
      // If wrong type
      if (!(layer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());
    }

    // Return the layer or undefined
    return layer;
  }

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
  getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer> {
    // Make sure the open layer has been created, sometimes it can still be in the process of being created
    return whenThisThen(
      () => {
        // Get the ol layer if it exists yet
        return this.getGeoviewLayerIfExists(layerPath)?.getOLLayer()!;
      },
      timeout,
      checkFrequency
    );
  }

  /**
   * Registers a layer entry configuration.
   *
   * Stores the layer configuration by its layer path and registers an internal handler
   * to track layer status changes throughout the configuration lifecycle.
   *
   * @param layerConfig - The layer configuration to register
   */
  registerLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Keep it
    this.#layerEntryConfigs[layerConfig.layerPath] = layerConfig;

    // Register a handler when the config layer status changes (this allows catching the status >= registered, all the way to loaded/error)
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Emit about it
    this.#emitLayerEntryConfigRegistered({ config: layerConfig, status: layerConfig.layerStatus });
  }

  /**
   * TODO: JSDOC THIS
   *
   * @param layerConfig
   */
  unregisterLayerEntryConfig(layerConfig: ConfigBaseClass): void {
    // Emit about it
    this.#emitLayerEntryConfigUnregistered({ config: layerConfig, status: layerConfig.layerStatus });
  }

  /**
   * Deletes a layer entry configuration.
   *
   * Unregisters the layer status change handler and removes the configuration
   * from the registry.
   *
   * @param layerPath - The layer path of the configuration to delete
   */
  deleteLayerEntryConfig(layerPath: string): void {
    // Unregister the handler
    this.#layerEntryConfigs[layerPath]?.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Delete it
    delete this.#layerEntryConfigs[layerPath];
  }

  /**
   * Registers a GeoView layer and its OpenLayers equivalent.
   *
   * Stores both the GeoView layer wrapper and the underlying OpenLayers layer by path.
   * For regular (non-group) layers, additionally registers a handler to track queryable state changes.
   *
   * @param gvLayer - The GeoView layer to register
   */
  registerGVLayer(gvLayer: AbstractBaseGVLayer): void {
    // Keep it
    this.#gvLayers[gvLayer.getLayerPath()] = gvLayer;
    this.#olLayers[gvLayer.getLayerPath()] = gvLayer.getOLLayer();

    // Register a hook when a layer name is changed
    gvLayer.onLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // If registering a regular layer
    if (gvLayer instanceof AbstractGVLayer) {
      // Register a hook when a layer queryable is changed
      gvLayer.onLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

      // Register a hook when a layer hoverable is changed
      gvLayer.onLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);
    }
  }

  /**
   * Deletes a GeoView layer and its OpenLayers equivalent.
   *
   * Removes the layer from internal registries. For regular (non-group) layers,
   * unregisters the queryable state change handler before deletion.
   *
   * @param gvLayer - The GeoView layer to delete
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  deleteGVLayer(gvLayer: AbstractBaseGVLayer): void {
    // Unregister handler on layer name changed
    gvLayer.offLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // If deleting a regular layer
    if (gvLayer instanceof AbstractGVLayer) {
      // Unregister handler on layer queryable changed
      gvLayer.offLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);
    }

    delete this.#gvLayers[gvLayer.getLayerPath()];
    delete this.#olLayers[gvLayer.getLayerPath()];
  }

  // #region PRIVATE HANDLERS

  /**
   * Handles layer status changed events from registered configurations.
   *
   * Internal callback that is invoked when a layer configuration's status changes.
   * Forwards the event to domain listeners via emitLayerStatusChanged.
   *
   * @param layerConfig - The layer configuration whose status changed
   * @param event - The layer status changed event
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, event: LayerStatusChangedEvent): void {
    // Emit about it
    this.#emitLayerStatusChanged({ config: layerConfig, status: event.layerStatus });
  }

  /**
   * TODO JSDOC THIS
   *
   * @param layer
   * @param event
   */
  #handleLayerNameChanged(layer: AbstractBaseGVLayer, event: LayerNameChangedEvent): void {
    // Emit about it
    this.#emitLayerNameChanged({ layer, name: event.layerName });
  }

  /**
   * Handles layer queryable state changes from registered layers.
   *
   * Internal callback that is invoked when a layer's queryable state changes.
   * Forwards the event to domain listeners via emitLayerQueryableChanged.
   *
   * @param layer - The layer whose queryable state changed
   * @param event - The layer queryable changed event
   */
  #handleLayerQueryableChanged(layer: AbstractBaseGVLayer, event: LayerQueryableChangedEvent): void {
    // Emit about it
    this.#emitLayerQueryableChanged({ layer, queryable: event.queryable });
  }

  /**
   * Handles layer hoverable state changes from registered layers.
   *
   * Internal callback that is invoked when a layer's hoverable state changes.
   * Forwards the event to domain listeners via emitLayerHoverableChanged.
   *
   * @param layer - The layer whose hoverable state changed
   * @param event - The layer hoverable changed event
   */
  #handleLayerHoverableChanged(layer: AbstractBaseGVLayer, event: LayerHoverableChangedEvent): void {
    // Emit about it
    this.#emitLayerHoverableChanged({ layer, hoverable: event.hoverable });
  }

  // #endregion PRIVATE HANDLERS

  // #region EVENTS

  /**
   * Emits layer entry config registered event.
   *
   * @param event - The event to emit
   */
  #emitLayerEntryConfigRegistered(event: DomainLayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryConfigRegisteredHandlers, event);
  }

  /**
   * Registers a layer entry config registered handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerEntryConfigRegistered(callback: DomainLayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryConfigRegisteredHandlers, callback);
  }

  /**
   * Unregisters a layer entry config registered handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerEntryConfigRegistered(callback: DomainLayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryConfigRegisteredHandlers, callback);
  }

  /**
   * Emits layer entry config unregistered event.
   *
   * @param event - The event to emit
   */
  #emitLayerEntryConfigUnregistered(event: DomainLayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerEntryConfigUnregisteredHandlers, event);
  }

  /**
   * Registers a layer entry config unregistered handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerEntryConfigUnregistered(callback: DomainLayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerEntryConfigUnregisteredHandlers, callback);
  }

  /**
   * Unregisters a layer entry config unregistered handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerEntryConfigUnregistered(callback: DomainLayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerEntryConfigUnregisteredHandlers, callback);
  }

  /**
   * Emits layer status changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerStatusChanged(event: DomainLayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a layer status changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a layer status changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Emits layer name changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerNameChanged(event: DomainLayerNameChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerNameChangedHandlers, event);
  }

  /**
   * Registers a layer name changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerNameChanged(callback: DomainLayerNameChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Unregisters a layer name changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerNameChanged(callback: DomainLayerNameChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Emits layer hoverable changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerHoverableChanged(event: DomainLayerHoverableChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerHoverableChangedHandlers, event);
  }

  /**
   * Registers a layer hoverable changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerHoverableChanged(callback: DomainLayerHoverableChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerHoverableChangedHandlers, callback);
  }

  /**
   * Unregisters a layer hoverable changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerHoverableChanged(callback: DomainLayerHoverableChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerHoverableChangedHandlers, callback);
  }

  /**
   * Emits layer queryable changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerQueryableChanged(event: DomainLayerQueryableChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerQueryableChangedHandlers, event);
  }

  /**
   * Registers a layer queryable changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerQueryableChanged(callback: DomainLayerQueryableChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerQueryableChangedHandlers, callback);
  }

  /**
   * Unregisters a layer queryable changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerQueryableChanged(callback: DomainLayerQueryableChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerQueryableChangedHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define an event for the delegate
 */
export type DomainLayerStatusChangedEvent = {
  // The layer entry config changing its layer status
  config: ConfigBaseClass;

  // The new layer status
  status: TypeLayerStatus;
};

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerStatusChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerStatusChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type DomainLayerNameChangedEvent = {
  // The layer entry config changing its name
  layer: AbstractBaseGVLayer;

  // The new layer name
  name: string | undefined;
};

export type DomainLayerNameChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerNameChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type DomainLayerQueryableChangedEvent = {
  // The layer changing its queryable status
  layer: AbstractBaseGVLayer;

  // The new queryable status
  queryable: boolean;
};

export type DomainLayerQueryableChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerQueryableChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type DomainLayerHoverableChangedEvent = {
  // The layer changing its hoverable status
  layer: AbstractBaseGVLayer;

  // The new hoverable status
  hoverable: boolean;
};

export type DomainLayerHoverableChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerHoverableChangedEvent, void>;
