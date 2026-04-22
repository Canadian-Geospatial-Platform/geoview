import type BaseLayer from 'ol/layer/Base';
import type { Projection as OLProjection } from 'ol/proj';

import {
  ConfigBaseClass,
  type LayerStatusChangedDelegate,
  type LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import type { Extent } from '@/api/types/map-schema-types';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { whenThisThen } from '@/core/utils/utilities';
import { LayerConfigNotFoundError } from '@/core/exceptions/geoview-exceptions';
import { LayerWrongTypeError, LayerNotFoundError } from '@/core/exceptions/layer-exceptions';
import type {
  AbstractBaseGVLayer,
  LayerBaseDelegate,
  LayerBaseEvent,
  LayerNameChangedDelegate,
  LayerNameChangedEvent,
  LayerOpacityChangedDelegate,
  LayerOpacityChangedEvent,
  LayerVisibleChangedDelegate,
  LayerVisibleChangedEvent,
} from '@/geo/layer/gv-layers/abstract-base-layer';
import {
  GVGroupLayer,
  type LayerGroupChildrenUpdatedDelegate,
  type LayerGroupChildrenUpdatedEvent,
} from '@/geo/layer/gv-layers/gv-group-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type {
  LayerErrorDelegate,
  LayerErrorEvent,
  LayerHoverableChangedDelegate,
  LayerHoverableChangedEvent,
  LayerItemVisibilityChangedDelegate,
  LayerItemVisibilityChangedEvent,
  LayerMessageDelegate,
  LayerMessageEvent,
  LayerQueryableChangedDelegate,
  LayerQueryableChangedEvent,
} from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import {
  GVWMS,
  type ImageLoadRescueDelegate,
  type ImageLoadRescueEvent,
  type WMSStyleChangedDelegate,
  type WMSStyleChangedEvent,
} from '@/geo/layer/gv-layers/raster/gv-wms';
import {
  GVEsriImage,
  type RasterFunctionChangedEvent,
  type RasterFunctionChangedDelegate,
  type MosaicRuleChangedEvent,
  type MosaicRuleChangedDelegate,
} from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GeoUtilities } from '@/geo/utils/utilities';

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
  #boundedHandleLayerLoading: LayerBaseDelegate;

  /** Keep a bounded reference to the handle layer first loaded */
  #boundedHandleLayerFirstLoaded: LayerBaseDelegate;

  /** Keep a bounded reference to the handle layer loaded */
  #boundedHandleLayerLoaded: LayerBaseDelegate;

  /** Keep a bounded reference to the handle layer error */
  #boundedHandleLayerError: LayerErrorDelegate;

  /** Keep a bounded reference to the handle layer message */
  #boundedHandleLayerMessage: LayerMessageDelegate;

  /** Keep a bounded reference to the handle layer hoverable changed */
  #boundedHandleLayerHoverableChanged: LayerHoverableChangedDelegate;

  /** Keep a bounded reference to the handle layer queryable changed */
  #boundedHandleLayerQueryableChanged: LayerQueryableChangedDelegate;

  /** Keep a bounded reference to the handle layer item visibility changed */
  #boundedHandleLayerItemVisibilityChanged: LayerItemVisibilityChangedDelegate;

  /** Keep a bounded reference to the handle Group Layer Added Callbacks */
  #boundedHandleLayerGroupLayerAdded: LayerGroupChildrenUpdatedDelegate;

  /** Keep a bounded reference to the handle Group Layer Removed Callbacks */
  #boundedHandleLayerGroupLayerRemoved: LayerGroupChildrenUpdatedDelegate;

  /** Keep a bounded reference to the handle WMS Layer Image Load Callbacks */
  #boundedHandleLayerWMSImageLoadRescue: ImageLoadRescueDelegate;

  /** Keep a bounded reference to the handle WMS style changed */
  #boundedHandleLayerWMSStyleChanged: WMSStyleChangedDelegate;

  /** Keep a bounded reference to the handle layer raster function changed */
  #boundedHandleLayerRasterFunctionChanged: RasterFunctionChangedDelegate;

  /** Keep a bounded reference to the handle layer mosaic rule changed */
  #boundedHandleLayerMosaicRuleChanged: MosaicRuleChangedDelegate;

  /** Callback delegates for the layer entry config registered event. */
  #onLayerEntryConfigRegisteredHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer entry config unregistered event. */
  #onLayerEntryConfigUnregisteredHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer status changed event. */
  #onLayerStatusChangedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer registered event. */
  #onLayerRegisteredHandlers: DomainLayerRegisteredDelegate[] = [];

  /** Callback delegates for the layer unregistered event. */
  #onLayerUnregisteredHandlers: DomainLayerRegisteredDelegate[] = [];

  /** Callback delegates for the all layers loaded event. */
  #onLayerAllLoadedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer name changed event. */
  #onLayerNameChangedHandlers: DomainLayerNameChangedDelegate[] = [];

  /** Callback delegates for the layer visible changed event. */
  #onLayerVisibleChangedHandlers: DomainLayerVisibleChangedDelegate[] = [];

  /** Callback delegates for the layer opacity changed event. */
  #onLayerOpacityChangedHandlers: DomainLayerOpacityChangedDelegate[] = [];

  /** Callback delegates for the layer loading event. */
  #onLayerLoadingHandlers: DomainLayerBaseDelegate[] = [];

  /** Callback delegates for the layer first loaded event. */
  #onLayerFirstLoadedHandlers: DomainLayerBaseDelegate[] = [];

  /** Callback delegates for the layer loaded event. */
  #onLayerLoadedHandlers: DomainLayerBaseDelegate[] = [];

  /** Callback delegates for the layer error event. */
  #onLayerErrorHandlers: DomainLayerErrorDelegate[] = [];

  /** Callback delegates for the layer message event. */
  #onLayerMessageHandlers: DomainLayerMessageDelegate[] = [];

  /** Callback delegates for the layer hoverable changed event. */
  #onLayerHoverableChangedHandlers: DomainLayerHoverableChangedDelegate[] = [];

  /** Callback delegates for the layer queryable changed event. */
  #onLayerQueryableChangedHandlers: DomainLayerQueryableChangedDelegate[] = [];

  /** Callback delegates for the layer item visibility changed event. */
  #onLayerItemVisibilityChangedHandlers: DomainLayerItemVisibilityChangedDelegate[] = [];

  /** Callback delegates for the group layer added event. */
  #onLayerGroupLayerAddedHandlers: DomainLayerGroupChildrenUpdatedDelegate[] = [];

  /** Callback delegates for the group layer removed event. */
  #onLayerGroupLayerRemovedHandlers: DomainLayerGroupChildrenUpdatedDelegate[] = [];

  /** Callback delegates for the WMS image load rescue event. */
  #onLayerWMSImageLoadRescueHandlers: DomainLayerWMSImageLoadRescueDelegate[] = [];

  /** Callback delegates for the WMS style changed event. */
  #onLayerWMSStyleChangedHandlers: DomainLayerWMSStyleChangedDelegate[] = [];

  /** Callback delegates for the layer raster function changed event. */
  #onLayerRasterFunctionChangedHandlers: DomainLayerRasterFunctionChangedDelegate[] = [];

  /** Callback delegates for the layer mosaic rule changed event. */
  #onLayerMosaicRuleChangedHandlers: DomainLayerMosaicRuleChangedDelegate[] = [];

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
    this.#boundedHandleLayerItemVisibilityChanged = this.#handleLayerItemVisibilityChanged.bind(this);
    this.#boundedHandleLayerGroupLayerAdded = this.#handleLayerGroupLayerAdded.bind(this);
    this.#boundedHandleLayerGroupLayerRemoved = this.#handleLayerGroupLayerRemoved.bind(this);
    this.#boundedHandleLayerWMSImageLoadRescue = this.#handleLayerWMSImageLoadRescue.bind(this);
    this.#boundedHandleLayerWMSStyleChanged = this.#handleLayerWmsStyleChanged.bind(this);
    this.#boundedHandleLayerRasterFunctionChanged = this.#handleLayerRasterFunctionChanged.bind(this);
    this.#boundedHandleLayerMosaicRuleChanged = this.#handleLayerMosaicRuleChanged.bind(this);
  }

  // #region PUBLIC LAYER GETTERS

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
    return Object.keys(this.#layerEntryConfigs);
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

  // #endregion PUBLIC LAYER GETTERS

  /**
   * Registers a layer entry configuration.
   *
   * Keeps the layer configuration by its layer path and registers an internal handler
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
    // Unregister the handler
    this.#layerEntryConfigs[layerConfig.layerPath]?.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Emit about it
    this.#emitLayerEntryConfigUnregistered({ config: layerConfig, status: layerConfig.layerStatus });

    // Delete it
    delete this.#layerEntryConfigs[layerConfig.layerPath];
  }

  /**
   * Registers a GeoView layer and its OpenLayers equivalent.
   *
   * Keeps both the GeoView layer wrapper and the underlying OpenLayers layer by path.
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

      // Register a hook when a layer style item visibility changes
      gvLayer.onLayerItemVisibilityChanged(this.#boundedHandleLayerItemVisibilityChanged);

      // For a WMS, register a hook when the image fails to load so that we can try to rescue it
      if (gvLayer instanceof GVWMS) gvLayer.onImageLoadRescue(this.#boundedHandleLayerWMSImageLoadRescue);

      // For a WMS, register a hook when the WMS style is changed so that we can update the layer accordingly
      if (gvLayer instanceof GVWMS) gvLayer.onWmsStyleChanged(this.#boundedHandleLayerWMSStyleChanged);

      // For an Esri Image, register a hook when the raster function is changed so that we can update the layer accordingly
      if (gvLayer instanceof GVEsriImage) gvLayer.onRasterFunctionChanged(this.#boundedHandleLayerRasterFunctionChanged);

      // For an Esri Image, register a hook when the mosaic rule is changed so that we can update the layer accordingly
      if (gvLayer instanceof GVEsriImage) gvLayer.onMosaicRuleChanged(this.#boundedHandleLayerMosaicRuleChanged);

      // Initialize it, attaching OpenLayers event on it
      gvLayer.init();
    } else if (gvLayer instanceof GVGroupLayer) {
      // It's a group layer

      // Register a hook when a layer is added to the group layer
      gvLayer.onLayerAdded(this.#boundedHandleLayerGroupLayerAdded);

      // Register a hook when a layer is removed from the group layer
      gvLayer.onLayerRemoved(this.#boundedHandleLayerGroupLayerRemoved);
    }

    // Emit about it
    this.#emitLayerRegistered({ layer: gvLayer });
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
      // For an Esri Image, unregister the hook when the mosaic rule is changed
      if (gvLayer instanceof GVEsriImage) gvLayer.offMosaicRuleChanged(this.#boundedHandleLayerMosaicRuleChanged);

      // For an Esri Image, unregister the hook when the raster function is changed
      if (gvLayer instanceof GVEsriImage) gvLayer.offRasterFunctionChanged(this.#boundedHandleLayerRasterFunctionChanged);

      // For a WMS, unregister the hook when the WMS style is changed
      if (gvLayer instanceof GVWMS) gvLayer.offWmsStyleChanged(this.#boundedHandleLayerWMSStyleChanged);

      // For a WMS, unregister the hook when the image fails to load
      if (gvLayer instanceof GVWMS) gvLayer.offImageLoadRescue(this.#boundedHandleLayerWMSImageLoadRescue);

      // Unregister a hook when a layer style item visibility changes
      gvLayer.offLayerItemVisibilityChanged(this.#boundedHandleLayerItemVisibilityChanged);

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

    // If the layer had a parent, make sure to remove it from said parent
    gvLayer.getParent()?.removeLayer(gvLayer);

    // Delete
    delete this.#olLayers[gvLayer.getLayerPath()];
    delete this.#gvLayers[gvLayer.getLayerPath()];

    // Emit about it
    this.#emitLayerUnregistered({ layer: gvLayer });
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

  /**
   * Checks if the layer statuses are loaded or error.
   *
   * @returns Indicates if all layers statuses are loaded or error
   */
  checkLayerStatusLoaded(): boolean {
    // Get if all layers are loaded or error
    const [allLoadedOrError] = this.checkLayerStatus('loaded');

    // Return result
    return allLoadedOrError;
  }

  /**
   * Gets the max extent of all layers on the map, or of a provided subset of layers.
   *
   * @param layerIds - Identifiers or layerPaths of layers to get max extents from.
   * @returns A promise that resolves with the overall extent or undefined when no bounds are found
   */
  async getExtentOfMultipleLayers(layerIds: string[], projection: OLProjection, stops: number): Promise<Extent | undefined> {
    const layerBoundsPromises: Promise<Extent | undefined>[] = [];
    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = this.getLayerEntryLayerPaths().filter(
        (layerPath) => layerPath.startsWith(`${layerId}/`) || layerPath === layerId
      );

      if (subLayerPaths.length) {
        // Get max extents from all selected layers.
        subLayerPaths.forEach((layerPath) => {
          // Get the GV layer and get its bounds
          const layerBoundsPromise = this.getGeoviewLayer(layerPath).getBounds(projection, stops);
          layerBoundsPromises.push(layerBoundsPromise);
        });
      }
    });

    // Once all promises resolve
    const allBounds = await Promise.all(layerBoundsPromises);

    // For each bounds found
    let boundsUnion: Extent | undefined;
    allBounds.forEach((bounds) => {
      // Union the bounds with each other
      boundsUnion = GeoUtilities.getExtentUnion(boundsUnion, bounds);
    });

    // Return the final bounds
    return boundsUnion;
  }

  // #region PRIVATE LAYER HANDLERS

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

    // If the config is a layer entry (not a group)
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      // Check if all layers are loaded/error right now
      const allLoaded = this.checkLayerStatusLoaded();
      if (allLoaded) {
        // Emit about it
        this.#emitLayerAllLoaded({ config: layerConfig, status: event.layerStatus });
      }
    }
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
    this.#emitLayerNameChanged({ layer, layerEvent: event });
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
    this.#emitLayerVisibleChanged({ layer, layerEvent: event });
  }

  /**
   * Handles layer loading events from registered layers.
   *
   * @param layer - The layer entering the loading state
   * @param event - The layer base event
   */
  #handleLayerLoading(layer: AbstractBaseGVLayer, event: LayerBaseEvent): void {
    // Emit about it
    this.#emitLayerLoading({ layer, layerEvent: event });
  }

  /**
   * Handles layer first loaded events from registered layers.
   *
   * @param layer - The layer that has been loaded for the first time
   * @param event - The layer base event
   */

  #handleLayerFirstLoaded(layer: AbstractBaseGVLayer, event: LayerBaseEvent): void {
    // Emit about it
    this.#emitLayerFirstLoaded({ layer, layerEvent: event });
  }

  /**
   * Handles layer loaded events from registered layers.
   *
   * @param layer - The layer that finished loading
   * @param event - The layer base event
   */

  #handleLayerLoaded(layer: AbstractBaseGVLayer, event: LayerBaseEvent): void {
    // Emit about it
    this.#emitLayerLoaded({ layer, layerEvent: event });
  }

  /**
   * Handles layer error events from registered layers.
   *
   * @param layer - The layer that encountered an error
   * @param event - The layer error event
   */
  #handleLayerError(layer: AbstractGVLayer, event: LayerErrorEvent): void {
    // Emit about it
    this.#emitLayerError({ layer, layerEvent: event });
  }

  /**
   * Handles layer message events from registered layers.
   *
   * @param layer - The layer that emitted a message
   * @param event - The layer message event
   */
  #handleLayerMessage(layer: AbstractGVLayer, event: LayerMessageEvent): void {
    // Emit about it
    this.#emitLayerMessage({ layer, layerEvent: event });
  }

  /**
   * Handles when a layer is added to a group layer.
   *
   * @param layer - The group layer that received the new child
   * @param event - The layer event containing the added layer
   */
  #handleLayerGroupLayerAdded(layer: GVGroupLayer, event: LayerGroupChildrenUpdatedEvent): void {
    // Emit about it
    this.#emitLayerGroupLayerAdded({ layer, layerEvent: event });
  }

  /**
   * Handles when a layer is removed from a group layer.
   *
   * @param layer - The group layer that lost a child
   * @param event - The layer event containing the removed layer
   */
  #handleLayerGroupLayerRemoved(layer: GVGroupLayer, event: LayerGroupChildrenUpdatedEvent): void {
    // Emit about it
    this.#emitLayerGroupLayerRemoved({ layer, layerEvent: event });
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
    this.#emitLayerOpacityChanged({ layer, layerEvent: event });
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
  #handleLayerHoverableChanged(layer: AbstractGVLayer, event: LayerHoverableChangedEvent): void {
    // Emit about it
    this.#emitLayerHoverableChanged({ layer, layerEvent: event });
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
  #handleLayerQueryableChanged(layer: AbstractGVLayer, event: LayerQueryableChangedEvent): void {
    // Emit about it
    this.#emitLayerQueryableChanged({ layer, layerEvent: event });
  }

  /**
   * Handles layer item visibility state changes from registered layers.
   *
   * Internal callback that is invoked when a layer's item visibility state changes.
   * Forwards the event to domain listeners via emitLayerItemVisibilityChanged.
   *
   * @param layer - The layer whose item visibility state changed
   * @param event - The layer item visibility changed event
   */
  #handleLayerItemVisibilityChanged(layer: AbstractGVLayer, event: LayerItemVisibilityChangedEvent): void {
    // Emit about it
    this.#emitLayerItemVisibilityChanged({ layer, layerEvent: event });
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
    return this.#emitLayerWMSImageLoadRescue({ layer, layerEvent: event })?.[0];
  }

  /**
   * Handles layer raster function changed events from registered layers.
   *
   * Forwards the event to domain listeners via emitLayerRasterFunctionChanged.
   *
   * @param layer - The layer whose raster function changed
   * @param event - The raster function changed event
   */
  #handleLayerRasterFunctionChanged(layer: GVEsriImage, event: RasterFunctionChangedEvent): void {
    // Emit about it
    this.#emitLayerRasterFunctionChanged({ layer, layerEvent: event });
  }

  /**
   * Handles layer mosaic rule changed events from registered layers.
   *
   * Forwards the event to domain listeners via emitLayerMosaicRuleChanged.
   *
   * @param layer - The layer whose mosaic rule changed
   * @param event - The mosaic rule changed event
   */
  #handleLayerMosaicRuleChanged(layer: GVEsriImage, event: MosaicRuleChangedEvent): void {
    // Emit about it
    this.#emitLayerMosaicRuleChanged({ layer, layerEvent: event });
  }

  /**
   * Handles layer WMS style changed events from registered layers.
   *
   * Forwards the event to domain listeners via emitLayerWmsStyleChanged.
   *
   * @param layer - The layer whose WMS style changed
   * @param event - The WMS style changed event
   */
  #handleLayerWmsStyleChanged(layer: GVWMS, event: WMSStyleChangedEvent): void {
    // Emit about it
    this.#emitLayerWmsStyleChanged({ layer, layerEvent: event });
  }

  // #endregion PRIVATE LAYER HANDLERS

  // #region EVENTS - LAYER ENTRY CONFIGS

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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * Emits layer all loaded event.
   *
   * @param event - The event to emit
   */
  #emitLayerAllLoaded(event: DomainLayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerAllLoadedHandlers, event);
  }

  /**
   * Registers a layer all loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerAllLoaded(callback: DomainLayerStatusChangedDelegate): DomainLayerStatusChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer all loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerAllLoaded(callback: DomainLayerStatusChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  // #endregion EVENTS - LAYER ENTRY CONFIGS

  // #region EVENTS - GV LAYERS

  /**
   * Emits layer registered event.
   *
   * @param event - The event to emit
   */
  #emitLayerRegistered(event: DomainLayerRegisteredEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerRegisteredHandlers, event);
  }

  /**
   * Registers a layer registered handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerRegistered(callback: DomainLayerRegisteredDelegate): DomainLayerRegisteredDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerRegisteredHandlers, callback);
  }

  /**
   * Unregisters a layer registered handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerRegistered(callback: DomainLayerRegisteredDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRegisteredHandlers, callback);
  }

  /**
   * Emits layer unregistered event.
   *
   * @param event - The event to emit
   */
  #emitLayerUnregistered(event: DomainLayerRegisteredEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerUnregisteredHandlers, event);
  }

  /**
   * Registers a layer unregistered handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerUnregistered(callback: DomainLayerRegisteredDelegate): DomainLayerRegisteredDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerUnregisteredHandlers, callback);
  }

  /**
   * Unregisters a layer unregistered handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerUnregistered(callback: DomainLayerRegisteredDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerUnregisteredHandlers, callback);
  }

  /**
   * Emits layer loading event.
   *
   * @param event - The event to emit
   */
  #emitLayerLoading(event: DomainLayerBaseEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadingHandlers, event);
  }

  /**
   * Registers a layer loading event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerLoading(callback: DomainLayerBaseDelegate): DomainLayerBaseDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Unregisters a layer loading event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoading(callback: DomainLayerBaseDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Emits layer first loaded changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerFirstLoaded(event: DomainLayerBaseEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerFirstLoadedHandlers, event);
  }

  /**
   * Registers a layer first loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerFirstLoaded(callback: DomainLayerBaseDelegate): DomainLayerBaseDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerFirstLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer first loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFirstLoaded(callback: DomainLayerBaseDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerFirstLoadedHandlers, callback);
  }

  /**
   * Emits layer loaded event.
   *
   * @param event - The event to emit
   */
  #emitLayerLoaded(event: DomainLayerBaseEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerLoadedHandlers, event);
  }

  /**
   * Registers a layer loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerLoaded(callback: DomainLayerBaseDelegate): DomainLayerBaseDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: DomainLayerBaseDelegate | undefined): void {
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * Emits layer message event.
   *
   * @param event - The event to emit
   */
  #emitLayerItemVisibilityChanged(event: DomainLayerItemVisibilityChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerItemVisibilityChangedHandlers, event);
  }

  /**
   * Registers a layer item visibility changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerItemVisibilityChanged(callback: DomainLayerItemVisibilityChangedDelegate): DomainLayerItemVisibilityChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerItemVisibilityChangedHandlers, callback);
  }

  /**
   * Unregisters a layer item visibility changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerItemVisibilityChanged(callback: DomainLayerItemVisibilityChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerItemVisibilityChangedHandlers, callback);
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
   * @returns The callback registered, for chaining or unregistration purposes
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
   * Emits layer raster function changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerRasterFunctionChanged(event: DomainLayerRasterFunctionChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerRasterFunctionChangedHandlers, event);
  }

  /**
   * Registers a layer raster function changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerRasterFunctionChanged(callback: DomainLayerRasterFunctionChangedDelegate): DomainLayerRasterFunctionChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerRasterFunctionChangedHandlers, callback);
  }

  /**
   * Unregisters a layer raster function changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerRasterFunctionChanged(callback: DomainLayerRasterFunctionChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRasterFunctionChangedHandlers, callback);
  }

  /**
   * Emits layer mosaic rule changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerMosaicRuleChanged(event: DomainLayerMosaicRuleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerMosaicRuleChangedHandlers, event);
  }

  /**
   * Registers a layer mosaic rule changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerMosaicRuleChanged(callback: DomainLayerMosaicRuleChangedDelegate): DomainLayerMosaicRuleChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerMosaicRuleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer mosaic rule changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerMosaicRuleChanged(callback: DomainLayerMosaicRuleChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerMosaicRuleChangedHandlers, callback);
  }

  /**
   * Emits layer WMS style changed event.
   *
   * @param event - The event to emit
   */
  #emitLayerWmsStyleChanged(event: DomainLayerWMSStyleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerWMSStyleChangedHandlers, event);
  }

  /**
   * Registers a layer WMS style changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerWmsStyleChanged(callback: DomainLayerWMSStyleChangedDelegate): DomainLayerWMSStyleChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerWMSStyleChangedHandlers, callback);
  }

  /**
   * Unregisters a layer WMS style changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerWmsStyleChanged(callback: DomainLayerWMSStyleChangedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerWMSStyleChangedHandlers, callback);
  }

  /**
   * Emits layer group layer added event.
   *
   * @param event - The event to emit
   */
  #emitLayerGroupLayerAdded(event: DomainLayerGroupChildrenUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGroupLayerAddedHandlers, event);
  }

  /**
   * Registers a layer group layer added event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerGroupLayerAdded(callback: DomainLayerGroupChildrenUpdatedDelegate): DomainLayerGroupChildrenUpdatedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerGroupLayerAddedHandlers, callback);
  }

  /**
   * Unregisters a layer group layer added event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerGroupLayerAdded(callback: DomainLayerGroupChildrenUpdatedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGroupLayerAddedHandlers, callback);
  }

  /**
   * Emits layer group layer removed event.
   *
   * @param event - The event to emit
   */
  #emitLayerGroupLayerRemoved(event: DomainLayerGroupChildrenUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerGroupLayerRemovedHandlers, event);
  }

  /**
   * Registers a layer group layer removed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback registered, for chaining or unregistration purposes
   */
  onLayerGroupLayerRemoved(callback: DomainLayerGroupChildrenUpdatedDelegate): DomainLayerGroupChildrenUpdatedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerGroupLayerRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer group layer removed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerGroupLayerRemoved(callback: DomainLayerGroupChildrenUpdatedDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerGroupLayerRemovedHandlers, callback);
  }

  // #endregion EVENTS - GV LAYERS
}

/** Define a base event for layer entry events. */
export interface DomainLayerEntryBaseEvent<T extends ConfigBaseClass = ConfigBaseClass> {
  /** The layer entry configuration. */
  config: T;
}

/**
 * Define an event for the delegate
 */
export interface DomainLayerStatusChangedEvent extends DomainLayerEntryBaseEvent {
  /** The new layer status. */
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
  /** The registered layer. */
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
  /** The layer included in the event payload. */
  layer: T;

  /** The layer event itself being redirected. */
  layerEvent: U;
}

/** Define a delegate for the layer loading event handler function signature. */
export type DomainLayerBaseDelegate = EventDelegateBase<LayerDomain, DomainLayerBaseEvent<AbstractBaseGVLayer, LayerBaseEvent>, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerErrorEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerErrorEvent> {}

/** Define a delegate for the layer error event handler function signature. */
export type DomainLayerErrorDelegate = EventDelegateBase<LayerDomain, DomainLayerErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerNameChangedEvent extends DomainLayerBaseEvent<AbstractBaseGVLayer, LayerNameChangedEvent> {}

/** Define a delegate for the layer name changed event handler function signature. */
export type DomainLayerNameChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerNameChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerVisibleChangedEvent extends DomainLayerBaseEvent<AbstractBaseGVLayer, LayerVisibleChangedEvent> {}

/** Define a delegate for the layer visible changed event handler function signature. */
export type DomainLayerVisibleChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerVisibleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerOpacityChangedEvent extends DomainLayerBaseEvent<AbstractBaseGVLayer, LayerOpacityChangedEvent> {}

/** Define a delegate for the layer opacity changed event handler function signature. */
export type DomainLayerOpacityChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerOpacityChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerHoverableChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerHoverableChangedEvent> {}

/** Define a delegate for the layer hoverable changed event handler function signature. */
export type DomainLayerHoverableChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerHoverableChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerQueryableChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerQueryableChangedEvent> {}

/** Define a delegate for the layer queryable changed event handler function signature. */
export type DomainLayerQueryableChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerQueryableChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerMessageEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerMessageEvent> {}

/** Define a delegate for the layer message event handler function signature. */
export type DomainLayerMessageDelegate = EventDelegateBase<LayerDomain, DomainLayerMessageEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerItemVisibilityChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, LayerItemVisibilityChangedEvent> {}

/** Define a delegate for the layer item visibility changed event handler function signature. */
export type DomainLayerItemVisibilityChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerItemVisibilityChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerWMSImageLoadRescueEvent extends DomainLayerBaseEvent<GVWMS, ImageLoadRescueEvent> {}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerWMSImageLoadRescueDelegate = EventDelegateBase<LayerDomain, DomainLayerWMSImageLoadRescueEvent, boolean>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerWMSStyleChangedEvent extends DomainLayerBaseEvent<GVWMS, WMSStyleChangedEvent> {}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerWMSStyleChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerWMSStyleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerRasterFunctionChangedEvent extends DomainLayerBaseEvent<AbstractGVLayer, RasterFunctionChangedEvent> {}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerRasterFunctionChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerRasterFunctionChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerMosaicRuleChangedEvent extends DomainLayerBaseEvent<GVEsriImage, MosaicRuleChangedEvent> {}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerMosaicRuleChangedDelegate = EventDelegateBase<LayerDomain, DomainLayerMosaicRuleChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface DomainLayerGroupChildrenUpdatedEvent extends DomainLayerBaseEvent<GVGroupLayer, LayerGroupChildrenUpdatedEvent> {}

/**
 * Define a delegate for the event handler function signature
 */
export type DomainLayerGroupChildrenUpdatedDelegate = EventDelegateBase<LayerDomain, DomainLayerGroupChildrenUpdatedEvent, void>;
