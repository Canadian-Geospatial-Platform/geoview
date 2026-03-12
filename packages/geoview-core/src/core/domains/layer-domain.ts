import type BaseLayer from 'ol/layer/Base';

import {
  ConfigBaseClass,
  type LayerStatusChangedDelegate,
  type LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { whenThisThen } from '@/core/utils/utilities';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { LayerConfigNotFoundError } from '@/core/exceptions/geoview-exceptions';
import { LayerWrongTypeError, LayerNotFoundError } from '@/core/exceptions/layer-exceptions';
import type {
  AbstractBaseGVLayer,
  LayerBaseEvent,
  LayerDelegate,
  LayerEvent,
  LayerNameChangedDelegate,
  LayerNameChangedEvent,
  LayerOpacityChangedDelegate,
  LayerOpacityChangedEvent,
  LayerVisibleChangedDelegate,
  LayerVisibleChangedEvent,
} from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type {
  LayerErrorDelegate,
  LayerErrorEvent,
  LayerHoverableChangedDelegate,
  LayerHoverableChangedEvent,
  LayerMessageDelegate,
  LayerMessageEvent,
  LayerQueryableChangedDelegate,
  LayerQueryableChangedEvent,
} from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { GVWMS, type ImageLoadRescueDelegate, type ImageLoadRescueEvent } from '@/geo/layer/gv-layers/raster/gv-wms';

/**
 * Domain class responsible for managing layer registrations and lifecycle.
 *
 * Owns the registries of layer entry configurations, GeoView layers, and
 * OpenLayers layers. Emits domain events when layers are registered,
 * unregistered, or when their properties change (status, name, queryable,
 * hoverable).
 */
export class LayerDomain {
  /** Layers with valid configuration for this map. */
  #layerEntryConfigs: { [layerPath: string]: ConfigBaseClass } = {};

  /** Dictionary holding all the new GVLayers */
  #gvLayers: { [layerPath: string]: AbstractBaseGVLayer } = {};

  /** Dictionary holding all the OpenLayers layers */
  #olLayers: { [layerPath: string]: BaseLayer } = {};

  /** Keep a bounded reference to the layer status changed handler */
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  /** Keep a bounded reference to the layer name changed handler */
  #boundedHandleLayerNameChanged: LayerNameChangedDelegate;

  /** Keep a bounded reference to the layer visible changed handler */
  #boundedHandleLayerVisibleChanged: LayerVisibleChangedDelegate;

  /** Keep a bounded reference to the handle layer opacity changed */
  #boundedHandleLayerOpacityChanged: LayerOpacityChangedDelegate;

  /** Keep a bounded reference to the handle layer loading */
  #boundedHandleLayerLoading: LayerDelegate;

  /** Keep a bounded reference to the handle layer first loaded */
  #boundedHandleLayerFirstLoaded: LayerDelegate;

  /** Keep a bounded reference to the handle layer loaded */
  #boundedHandleLayerLoaded: LayerDelegate;

  /** Keep a bounded reference to the handle layer error */
  #boundedHandleLayerError: LayerErrorDelegate;

  /** Keep a bounded reference to the handle layer message */
  #boundedHandleLayerMessage: LayerMessageDelegate;

  /** Keep a bounded reference to the handle layer hoverable changed */
  #boundedHandleLayerHoverableChanged: LayerHoverableChangedDelegate;

  /** Keep a bounded reference to the handle layer queryable changed */
  #boundedHandleLayerQueryableChanged: LayerQueryableChangedDelegate;

  /** Keep a bounded reference to the handle Group Layer Added Callbacks */
  #boundedHandleLayerGroupLayerAdded: LayerDelegate;

  /** Keep a bounded reference to the handle Group Layer Removed Callbacks */
  #boundedHandleLayerGroupLayerRemoved: LayerDelegate;

  /** Keep a bounded reference to the handle WMS Layer Image Load Callbacks */
  #boundedHandleLayerWMSImageLoadRescue: ImageLoadRescueDelegate;

  /** Keep all callback delegate references */
  #onLayerEntryConfigRegisteredHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerEntryConfigUnregisteredHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerStatusChangedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerNameChangedHandlers: DomainLayerNameChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerVisibleChangedHandlers: DomainLayerVisibleChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerOpacityChangedHandlers: DomainLayerOpacityChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerLoadingHandlers: DomainLayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerFirstLoadedHandlers: DomainLayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerLoadedHandlers: DomainLayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerErrorHandlers: DomainLayerErrorDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerMessageHandlers: DomainLayerMessageDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerHoverableChangedHandlers: DomainLayerHoverableChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerQueryableChangedHandlers: DomainLayerQueryableChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerWMSImageLoadRescueHandlers: DomainLayerWMSImageLoadRescueDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerGroupLayerAddedHandlers: DomainLayerGroupLayerDelegate[] = [];

  /** Keep all callback delegate references */
  #onLayerGroupLayerRemovedHandlers: DomainLayerGroupLayerDelegate[] = [];

  /**
   * Constructor for the LayerDomain class.
   */
  constructor() {
    // Keep bounded references to the handlers
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundedHandleLayerNameChanged = this.#handleLayerNameChanged.bind(this);
    this.#boundedHandleLayerVisibleChanged = this.#handleLayerVisibleChanged.bind(this);
    this.#boundedHandleLayerOpacityChanged = this.#handleLayerOpacityChanged.bind(this);
    this.#boundedHandleLayerLoading = this.#handleLayerLoading.bind(this);
    this.#boundedHandleLayerFirstLoaded = this.#handleLayerFirstLoaded.bind(this);
    this.#boundedHandleLayerLoaded = this.#handleLayerLoaded.bind(this);
    this.#boundedHandleLayerError = this.#handleLayerError.bind(this);
    this.#boundedHandleLayerMessage = this.#handleLayerMessage.bind(this);
    this.#boundedHandleLayerHoverableChanged = this.#handleLayerHoverableChanged.bind(this);
    this.#boundedHandleLayerQueryableChanged = this.#handleLayerQueryableChanged.bind(this);
    this.#boundedHandleLayerGroupLayerAdded = this.#handleLayerGroupLayerAdded.bind(this);
    this.#boundedHandleLayerGroupLayerRemoved = this.#handleLayerGroupLayerRemoved.bind(this);
    this.#boundedHandleLayerWMSImageLoadRescue = this.#handleLayerWMSImageLoadRescue.bind(this);
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
   * Unregisters a layer entry configuration.
   *
   * Emits the layer entry config unregistered event so that controllers
   * can react to the removal.
   *
   * @param layerConfig - The layer configuration to unregister
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

    // Register a hook when a layer visibility is changed
    gvLayer.onLayerVisibleChanged(this.#boundedHandleLayerVisibleChanged);

    // Register a hook when a layer opacity is changed
    gvLayer.onLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // If registering a regular layer
    if (gvLayer instanceof AbstractGVLayer) {
      // Register a hook when a layer is going into loading state
      gvLayer.onLayerLoading(this.#boundedHandleLayerLoading);

      // Register a hook when a layer is first loaded
      gvLayer.onLayerFirstLoaded(this.#boundedHandleLayerFirstLoaded);

      // Register a hook when a layer is loaded
      gvLayer.onLayerLoaded(this.#boundedHandleLayerLoaded);

      // Register a hook when a layer encounters an error
      gvLayer.onLayerError(this.#boundedHandleLayerError);

      // Add a handler on layer's message
      gvLayer.onLayerMessage(this.#boundedHandleLayerMessage);

      // Register a hook when a layer hoverable is changed
      gvLayer.onLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);

      // Register a hook when a layer queryable is changed
      gvLayer.onLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

      // For a WMS, register a hook when the image fails to load so that we can try to rescue it
      if (gvLayer instanceof GVWMS) gvLayer.onImageLoadRescue(this.#boundedHandleLayerWMSImageLoadRescue);
    } else if (gvLayer instanceof GVGroupLayer) {
      // It's a group layer

      // Register a hook when a layer is added to the group layer
      gvLayer.onLayerAdded(this.#boundedHandleLayerGroupLayerAdded);

      // Register a hook when a layer is removed from the group layer
      gvLayer.onLayerRemoved(this.#boundedHandleLayerGroupLayerRemoved);
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
      // For a WMS, unregister the hook when the image fails to load
      if (gvLayer instanceof GVWMS) gvLayer.offImageLoadRescue(this.#boundedHandleLayerWMSImageLoadRescue);

      // Unregister handler on layer queryable changed
      gvLayer.offLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

      // Unregister handler on layer hoverable changed
      gvLayer.offLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);

      // Unregister handler on layer's message
      gvLayer.offLayerMessage(this.#boundedHandleLayerMessage);

      // Unregister a hook when a layer encounters an error
      gvLayer.offLayerError(this.#boundedHandleLayerError);

      // Unregister handler on layers loaded
      gvLayer.offLayerLoaded(this.#boundedHandleLayerLoaded);

      // Unregister a hook when a layer is loaded on the map
      gvLayer.offLayerFirstLoaded(this.#boundedHandleLayerFirstLoaded);

      // Unregister a hook when a layer is going into loading state
      gvLayer.offLayerLoading(this.#boundedHandleLayerLoading);
    } else if (gvLayer instanceof GVGroupLayer) {
      // Unregister a hook when a layer is removed from the group layer
      gvLayer.offLayerRemoved(this.#boundedHandleLayerGroupLayerRemoved);

      // Unregister a hook when a layer is added to the group layer
      gvLayer.offLayerAdded(this.#boundedHandleLayerGroupLayerAdded);
    }

    // Unregister handler on layer opacity changed
    gvLayer.offLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Unregister a hook when a layer visibility is changed
    gvLayer.offLayerVisibleChanged(this.#boundedHandleLayerVisibleChanged);

    // Unregister handler on layer name changed
    gvLayer.offLayerNameChanged(this.#boundedHandleLayerNameChanged);

    delete this.#olLayers[gvLayer.getLayerPath()];
    delete this.#gvLayers[gvLayer.getLayerPath()];
  }

  /**
   * Checks if the layer statuses are all greater than or equal to the provided status
   *
   * @returns Indicates if all layers passed the callback and how many have passed the callback
   */
  checkLayerStatus(status: TypeLayerStatus, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number] {
    // If no layer entries at all or there are layer entries and there are geoview layers to check
    let allGood = true;

    // For each layer entry config
    this.getLayerEntryConfigs().forEach((layerConfig) => {
      const layerIsGood = ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo(status, [layerConfig]);
      if (!layerIsGood) {
        // Callback about it
        callbackNotGood?.(layerConfig);
        allGood = false;
      }
    });

    // Return if all good
    return [allGood, this.getLayerEntryConfigs().length];
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
   * Handles layer name changed events from registered layers.
   *
   * Internal callback that is invoked when a layer's name changes.
   * Forwards the event to domain listeners via emitLayerNameChanged.
   *
   * @param layer - The layer whose name changed
   * @param event - The layer name changed event
   */
  #handleLayerNameChanged(layer: AbstractBaseGVLayer, event: LayerNameChangedEvent): void {
    // Emit about it
    this.#emitLayerNameChanged({ layer, name: event.layerName });
  }

  /**
   * Handles layer visible state changes from registered layers.
   *
   * Internal callback that is invoked when a layer's visible state changes.
   * Forwards the event to domain listeners via emitLayerVisibleChanged.
   *
   * @param layer - The layer whose visible state changed
   * @param event - The layer visible changed event
   */
  #handleLayerVisibleChanged(layer: AbstractBaseGVLayer, event: LayerVisibleChangedEvent): void {
    // Emit about it
    this.#emitLayerVisibleChanged({ layer, visible: event.visible });
  }

  /**
   * Handles layer loading events from registered layers.
   *
   * @param layer - The layer entering the loading state
   * @param event - The layer base event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerLoading(layer: AbstractBaseGVLayer, event: LayerBaseEvent): void {
    // Emit about it
    this.#emitLayerLoading({ layer });
  }

  /**
   * Handles layer first loaded events from registered layers.
   *
   * @param layer - The layer that has been loaded for the first time
   * @param event - The layer base event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerFirstLoaded(layer: AbstractBaseGVLayer, event: LayerBaseEvent): void {
    // Emit about it
    this.#emitLayerFirstLoaded({ layer });
  }

  /**
   * Handles layer loaded events from registered layers.
   *
   * @param layer - The layer that finished loading
   * @param event - The layer base event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerLoaded(layer: AbstractBaseGVLayer, event: LayerBaseEvent): void {
    // Emit about it
    this.#emitLayerLoaded({ layer });
  }

  /**
   * Handles layer error events from registered layers.
   *
   * @param layer - The layer that encountered an error
   * @param event - The layer error event
   */
  #handleLayerError(layer: AbstractBaseGVLayer, event: LayerErrorEvent): void {
    // Emit about it
    this.#emitLayerError({ layer, error: event.error });
  }

  /**
   * Handles layer message events from registered layers.
   *
   * @param layer - The layer that emitted a message
   * @param event - The layer message event
   */
  #handleLayerMessage(layer: AbstractBaseGVLayer, event: LayerMessageEvent): void {
    // Emit about it
    this.#emitLayerMessage({ layer, message: event });
  }

  /**
   * Handles when a layer is added to a group layer.
   *
   * @param layer - The group layer that received the new child
   * @param event - The layer event containing the added layer
   */
  #handleLayerGroupLayerAdded(layer: AbstractBaseGVLayer, event: LayerEvent): void {
    // Emit about it
    this.#emitLayerGroupLayerAdded({ groupLayer: layer as GVGroupLayer, layer: event.layer });
  }

  /**
   * Handles when a layer is removed from a group layer.
   *
   * @param layer - The group layer that lost a child
   * @param event - The layer event containing the removed layer
   */
  #handleLayerGroupLayerRemoved(layer: AbstractBaseGVLayer, event: LayerEvent): void {
    // Emit about it
    this.#emitLayerGroupLayerRemoved({ groupLayer: layer as GVGroupLayer, layer: event.layer });
  }

  /**
   * Handles layer opacity state changes from registered layers.
   *
   * Internal callback that is invoked when a layer's opacity state changes.
   * Forwards the event to domain listeners via emitLayerOpacityChanged.
   *
   * @param layer - The layer whose opacity state changed
   * @param event - The layer opacity changed event
   */
  #handleLayerOpacityChanged(layer: AbstractBaseGVLayer, event: LayerOpacityChangedEvent): void {
    // Emit about it
    this.#emitLayerOpacityChanged({ layer, opacity: event.opacity });
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
   * Handles WMS image load rescue events.
   *
   * Forwards the rescue event to domain listeners and returns the first
   * handler's result. Returns `undefined` (falsy) if no listener is
   * registered, which causes the WMS layer to fall through to its
   * default error handling.
   *
   * @param layer - The WMS layer whose image failed to load
   * @param event - The image load rescue event
   * @returns Whether the error was rescued by a listener
   */
  #handleLayerWMSImageLoadRescue(layer: GVWMS, event: ImageLoadRescueEvent): boolean {
    // Emit about it
    return this.#emitLayerWMSImageLoadRescue({ layer, event })?.[0];
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
  onLayerEntryConfigRegistered(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerEntryConfigRegisteredHandlers, callback);
  }

  /**
   * Unregisters a layer entry config registered handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerEntryConfigRegistered(callback: DomainLayerStatusChangedDelegate | undefined): void {
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
  onLayerEntryConfigUnregistered(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerEntryConfigUnregisteredHandlers, callback);
  }

  /**
   * Unregisters a layer entry config unregistered handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerEntryConfigUnregistered(callback: DomainLayerStatusChangedDelegate | undefined): void {
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
  onLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a layer status changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerStatusChanged(callback: DomainLayerStatusChangedDelegate | undefined): void {
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
  onLayerNameChanged(callback: DomainLayerNameChangedDelegate): DomainLayerNameChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Unregisters a layer name changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerNameChanged(callback: DomainLayerNameChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerNameChangedHandlers, callback);
  }

  /**
   * Emits layer visible changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerVisibleChanged(event: DomainLayerVisibleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerVisibleChangedHandlers, event);
  }

  /**
   * Registers a layer visible changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerVisibleChanged(callback: DomainLayerVisibleChangedDelegate): DomainLayerVisibleChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerVisibleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer visible changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerVisibleChanged(callback: DomainLayerVisibleChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerVisibleChangedHandlers, callback);
  }

  /**
   * Emits layer opacity changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerOpacityChanged(event: DomainLayerOpacityChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerOpacityChangedHandlers, event);
  }

  /**
   * Registers a layer opacity changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerOpacityChanged(callback: DomainLayerOpacityChangedDelegate): DomainLayerOpacityChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerOpacityChangedHandlers, callback);
  }

  /**
   * Unregisters a layer opacity changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerOpacityChanged(callback: DomainLayerOpacityChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerOpacityChangedHandlers, callback);
  }

  /**
   * Emits layer loading event.
   *
   * @param event - The event to emit
   */
  #emitLayerLoading(event: DomainLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadingHandlers, event);
  }

  /**
   * Registers a layer loading event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoading(callback: DomainLayerDelegate): DomainLayerDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Unregisters a layer loading event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoading(callback: DomainLayerDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Emits layer first loaded changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerFirstLoaded(event: DomainLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerFirstLoadedHandlers, event);
  }

  /**
   * Registers a layer first loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerFirstLoaded(callback: DomainLayerDelegate): DomainLayerDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerFirstLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer first loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFirstLoaded(callback: DomainLayerDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerFirstLoadedHandlers, callback);
  }

  /**
   * Emits layer loaded event.
   *
   * @param event - The event to emit
   */
  #emitLayerLoaded(event: DomainLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadedHandlers, event);
  }

  /**
   * Registers a layer loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoaded(callback: DomainLayerDelegate): DomainLayerDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: DomainLayerDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Emits layer error event.
   *
   * @param event - The event to emit
   */
  #emitLayerError(event: DomainLayerErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerErrorHandlers, event);
  }

  /**
   * Registers a layer error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerError(callback: DomainLayerErrorDelegate): DomainLayerErrorDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Unregisters a layer error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerError(callback: DomainLayerErrorDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Emits layer message event.
   *
   * @param event - The event to emit
   */
  #emitLayerMessage(event: DomainLayerMessageEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerMessageHandlers, event);
  }

  /**
   * Registers a layer message event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerMessage(callback: DomainLayerMessageDelegate): DomainLayerMessageDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerMessageHandlers, callback);
  }

  /**
   * Unregisters a layer message event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerMessage(callback: DomainLayerMessageDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerMessageHandlers, callback);
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
  onLayerHoverableChanged(callback: DomainLayerHoverableChangedDelegate): DomainLayerHoverableChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerHoverableChangedHandlers, callback);
  }

  /**
   * Unregisters a layer hoverable changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerHoverableChanged(callback: DomainLayerHoverableChangedDelegate | undefined): void {
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
  onLayerQueryableChanged(callback: DomainLayerQueryableChangedDelegate): DomainLayerQueryableChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerQueryableChangedHandlers, callback);
  }

  /**
   * Unregisters a layer queryable changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerQueryableChanged(callback: DomainLayerQueryableChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerQueryableChangedHandlers, callback);
  }

  /**
   * Emits layer WMS image load rescue event.
   *
   * @param event - The event to emit
   */
  #emitLayerWMSImageLoadRescue(event: DomainLayerWMSImageLoadRescueEvent): boolean[] {
    // Emit the event for all handlers
    return EventHelper.emitEvent(this, this.#onLayerWMSImageLoadRescueHandlers, event);
  }

  /**
   * Registers a layer WMS image load rescue event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerWMSImageLoadRescue(callback: DomainLayerWMSImageLoadRescueDelegate): DomainLayerWMSImageLoadRescueDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerWMSImageLoadRescueHandlers, callback);
  }

  /**
   * Unregisters a layer WMS image load rescue event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerWMSImageLoadRescue(callback: DomainLayerWMSImageLoadRescueDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerWMSImageLoadRescueHandlers, callback);
  }

  /**
   * Emits layer group layer added event.
   *
   * @param event - The event to emit
   */
  #emitLayerGroupLayerAdded(event: DomainLayerGroupLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGroupLayerAddedHandlers, event);
  }

  /**
   * Registers a layer group layer added event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerGroupLayerAdded(callback: DomainLayerGroupLayerDelegate): DomainLayerGroupLayerDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerGroupLayerAddedHandlers, callback);
  }

  /**
   * Unregisters a layer group layer added event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerGroupLayerAdded(callback: DomainLayerGroupLayerDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGroupLayerAddedHandlers, callback);
  }

  /**
   * Emits layer group layer removed event.
   *
   * @param event - The event to emit
   */
  #emitLayerGroupLayerRemoved(event: DomainLayerGroupLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGroupLayerRemovedHandlers, event);
  }

  /**
   * Registers a layer group layer removed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerGroupLayerRemoved(callback: DomainLayerGroupLayerDelegate): DomainLayerGroupLayerDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerGroupLayerRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer group layer removed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerGroupLayerRemoved(callback: DomainLayerGroupLayerDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGroupLayerRemovedHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define an event for the delegate
 */
export interface DomainLayerStatusChangedEvent {
  // The layer entry config changing its layer status
  config: ConfigBaseClass;

  // The new layer status
  status: TypeLayerStatus;
}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerStatusChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerStatusChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> {
  // The layer included in the event payload
  layer: T;
}

/** Define a delegate for the layer loading event handler function signature. */
export type DomainLayerDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerNameChangedEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new layer name
  name: string | undefined;
}

/** Define a delegate for the layer name changed event handler function signature. */
export type DomainLayerNameChangedDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerNameChangedEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerVisibleChangedEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new visibility status
  visible: boolean;
}

/** Define a delegate for the layer visible changed event handler function signature. */
export type DomainLayerVisibleChangedDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerVisibleChangedEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerOpacityChangedEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new opacity
  opacity: number;
}

/** Define a delegate for the layer opacity changed event handler function signature. */
export type DomainLayerOpacityChangedDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerOpacityChangedEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerHoverableChangedEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new hoverable status
  hoverable: boolean;
}

/** Define a delegate for the layer hoverable changed event handler function signature. */
export type DomainLayerHoverableChangedDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerHoverableChangedEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerQueryableChangedEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new queryable status
  queryable: boolean;
}

/** Define a delegate for the layer queryable changed event handler function signature. */
export type DomainLayerQueryableChangedDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerQueryableChangedEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerErrorEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new layer error event embedded in the event payload
  error: GeoViewError;
}

/** Define a delegate for the layer error event handler function signature. */
export type DomainLayerErrorDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerErrorEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerMessageEvent<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> extends DomainLayerEvent<T> {
  // The new layer message event embedded in the event payload
  message: LayerMessageEvent;
}

/** Define a delegate for the layer message event handler function signature. */
export type DomainLayerMessageDelegate<T extends AbstractBaseGVLayer = AbstractBaseGVLayer> = EventDelegateBase<
  LayerDomain,
  DomainLayerMessageEvent<T>,
  void
>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerWMSImageLoadRescueEvent extends DomainLayerEvent<GVWMS> {
  // The layer being added to the group
  event: ImageLoadRescueEvent;
}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerWMSImageLoadRescueDelegate = EventDelegateBase<LayerDomain, DomainLayerWMSImageLoadRescueEvent, boolean>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerGroupLayerEvent {
  // The layer group that had a layer added to it
  groupLayer: GVGroupLayer;

  // The layer being added to the group
  layer: AbstractBaseGVLayer;
}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerGroupLayerDelegate = EventDelegateBase<LayerDomain, DomainLayerGroupLayerEvent, void>;
