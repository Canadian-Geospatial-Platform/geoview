import type BaseLayer from 'ol/layer/Base';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { FitOptions } from 'ol/View';

import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeMosaicRule } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { LayerDifferingFieldLengthsError, LayerNotQueryableError } from '@/core/exceptions/layer-exceptions';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeLegendItem } from '@/core/components/layers/types';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type {
  ControllerLayerItemVisibilityChangedDelegate,
  ControllerLayerItemVisibilityChangedEvent,
  LayerController,
} from '@/core/controllers/layer-controller';
import type {
  DomainLayerBaseDelegate,
  DomainLayerBaseEvent,
  DomainLayerStatusChangedDelegate,
  DomainLayerStatusChangedEvent,
  LayerDomain,
} from '@/core/domains/layer-domain';
import type {
  GeoViewLayerAddedResult,
  LayerBuilderDelegate,
  LayerBuilderEvent,
  LayerConfigErrorDelegate,
  LayerConfigErrorEvent,
  LayerCreatorController,
  LayerDelegate,
  LayerEvent,
  LayerPathDelegate,
  LayerPathEvent,
} from '@/core/controllers/layer-creator-controller';

import type { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import type { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import type { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';

/**
 * Public API facade for layer operations.
 *
 * Provides external consumers with a stable entry point for layer management,
 * querying, and event subscription. Internally delegates to controllers and
 * domains, re-emitting domain events so that external code can subscribe
 * without depending on internal architecture.
 */
export class LayerApi {
  /** Reference on the controller registry */
  #controllers: ControllerRegistry;

  /** Reference on the layer domain. */
  #layerDomain: LayerDomain;

  /** Used to access geometry API to create and manage geometries */
  // TODO: REFACTOR (would be breaking change) - Remove this reference and favor using mapViewer.geometry instead
  geometry: GeometryApi;

  /** Used to access feature and bounding box highlighting */
  // TODO: REFACTOR (would be breaking change) - Remove this reference and favor using mapViewer.geometry instead
  featureHighlight: FeatureHighlight;

  /** Legends layer set associated to the map */
  legendsLayerSet: LegendsLayerSet;

  /** Hover feature info layer set associated to the map */
  hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;

  /** All feature info layer set associated to the map */
  allFeatureInfoLayerSet: AllFeatureInfoLayerSet;

  /** Feature info layer set associated to the map */
  featureInfoLayerSet: FeatureInfoLayerSet;

  /** Callback delegates for the layer config added event */
  #onLayerConfigAddedHandlers: LayerBuilderDelegate[] = [];

  /** Callback delegates for the layer config error event */
  #onLayerConfigErrorHandlers: LayerConfigErrorDelegate[] = [];

  /** Callback delegates for the layer config removed event */
  #onLayerConfigRemovedHandlers: LayerPathDelegate[] = [];

  /** Callback delegates for the layer created event */
  #onLayerCreatedHandlers: LayerDelegate[] = [];

  /** Callback delegates for the layer loading event */
  #onLayerLoadingHandlers: DomainLayerBaseDelegate[] = [];

  /** Callback delegates for the layer first loaded event */
  #onLayerLoadedFirstHandlers: DomainLayerBaseDelegate[] = [];

  /** Callback delegates for the layer loaded event */
  #onLayerLoadedHandlers: DomainLayerBaseDelegate[] = [];

  /** Callback delegates for the layer error event */
  #onLayerErrorHandlers: LayerApiLayerErrorDelegate[] = [];

  /** Callback delegates for the all layers loaded event */
  #onLayerAllLoadedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer status changed event */
  #onLayerStatusChangedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer visibility toggled event */
  #onLayerVisibilityToggledHandlers: LayerApiLayerVisibleChangedDelegate[] = [];

  /** Callback delegates for the layer item visibility toggled event */
  #onLayerItemVisibilityToggledHandlers: ControllerLayerItemVisibilityChangedDelegate[] = [];

  /**
   * Initializes the layer API and subscribes to domain and controller events.
   *
   * @param controllerRegistry - The controller registry for accessing controllers
   * @param layerDomain - The layer domain for event subscriptions
   * @param geometryApi - The geometry API for creating and managing geometries
   * @param featureHighlight - The feature highlight utility for feature and bounding box highlighting
   */
  constructor(
    controllerRegistry: ControllerRegistry,
    layerDomain: LayerDomain,
    geometryApi: GeometryApi,
    featureHighlight: FeatureHighlight
  ) {
    this.#controllers = controllerRegistry;

    // Keep a reference on the layer sets
    // GV These assignations references of the layer sets are for legacy support. They could be removed eventually.
    // TODO: CLEANUP LEGACY - Remove the legacy support for this?
    this.legendsLayerSet = controllerRegistry.layerSetController.legendsLayerSet;
    this.hoverFeatureInfoLayerSet = controllerRegistry.layerSetController.hoverFeatureInfoLayerSet;
    this.allFeatureInfoLayerSet = controllerRegistry.layerSetController.allFeatureInfoLayerSet;
    this.featureInfoLayerSet = controllerRegistry.layerSetController.featureInfoLayerSet;

    // Keep a reference on the geometry api and feature highlight
    // GV These assignations references of the layer sets are for legacy support. They could be removed eventually.
    // TODO: CLEANUP LEGACY - Remove the legacy support for this?
    this.geometry = geometryApi;
    this.featureHighlight = featureHighlight;

    // Initialize events on domain for the events relay
    this.#layerDomain = layerDomain;
    this.initEventsOnDomain(layerDomain);
    this.initEventsOnLayerControllers(controllerRegistry.layerCreatorController, controllerRegistry.layerController);
  }

  /**
   * Initializes the events on the domain to listen to changes and re-emit the events higher.
   * This is a shortcut to not have the event from the domain have to go through the controller
   * to be caught by the layer api.
   *
   * @param layerDomain - The layer domain to listen on
   */
  initEventsOnDomain(layerDomain: LayerDomain): void {
    // Listen on the domain layer status changed
    layerDomain.onLayerStatusChanged((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerStatusChanged(event);
    });

    // Listeon on the domain layer all loaded event
    layerDomain.onLayerAllLoaded((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerAllLoaded(event);
    });

    // Listen on the domain layer visibility changed
    layerDomain.onLayerVisibleChanged((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerVisibilityToggled({ layer: event.layer, visible: event.layerEvent.visible });
    });

    // Listen on the domain layer loading
    layerDomain.onLayerLoading((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerLoading(event);
    });

    // Listen on the domain layer loading
    layerDomain.onLayerFirstLoaded((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerFirstLoaded(event);
    });

    // Listen on the domain layer loaded
    layerDomain.onLayerLoaded((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerLoaded(event);
    });

    // Listen on the domain layer error
    layerDomain.onLayerError((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerError({ layer: event.layer, error: event.layerEvent.error });
    });

    // Listen on the domain layer message
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layerDomain.onLayerMessage((sender, event) => {
      // Do something? Wasn't doing anything before..
    });
  }

  /**
   * Initializes events on the layer creator controller to relay layer lifecycle events.
   *
   * Subscribes to layer config added, config error, config removed, and layer created
   * events from the controller and re-emits them for external consumers.
   *
   * @param layerCreatorController - The layer creator controller to listen on
   * @param layerController - The layer controller to listen on
   */
  initEventsOnLayerControllers(layerCreatorController: LayerCreatorController, layerController: LayerController): void {
    // Listen on the layer creator controller config added
    layerCreatorController.onLayerConfigAdded((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerConfigAdded(event);
    });

    // Listen on the layer creator controller layer created
    layerCreatorController.onLayerConfigError((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerConfigError(event);
    });

    // Listen on the layer creator controller layer removed
    layerCreatorController.onLayerConfigRemoved((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerConfigRemoved(event);
    });

    // Listen on the layer creator controller layer created
    layerCreatorController.onLayerCreated((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerCreated(event);
    });

    // Listen on the layer controller for a item visiblity change event
    layerController.onLayerItemVisibilityChanged((sender, event) => {
      // Re-emit so the layer api can alert external devs
      this.#emitLayerItemVisibilityToggled(event);
    });
  }

  // #region PUBLIC METHODS - LAYER CONTROLLER SIMPLE GETTER REDIRECTIONS

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayerIds();
  }

  /**
   * Gets the Layer Entry layer paths.
   *
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    // Redirect to controller
    return this.#controllers.layerController.getLayerEntryLayerPaths();
  }

  /**
   * Gets the Layer Entry Configs.
   *
   * @returns The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    // Redirect to controller
    return this.#controllers.layerController.getLayerEntryConfigs();
  }

  /**
   * Gets the layer configuration of the specified layer path.
   *
   * @param layerPath - The layer path
   * @returns The layer configuration
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    // Redirect to controller
    return this.#controllers.layerController.getLayerEntryConfig(layerPath);
  }

  /**
   * Gets the layer configuration of a regular layer (not a group) at the specified layer path.
   *
   * @param layerPath - The layer path
   * @returns The layer configuration
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
   */
  getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig {
    // Redirect to controller
    return this.#controllers.layerController.getLayerEntryConfigRegular(layerPath);
  }

  /**
   * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
   *
   * @param layerPath - The layer path
   * @returns The layer configuration
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
   */
  getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig {
    // Redirect to controller
    return this.#controllers.layerController.getLayerEntryConfigGroup(layerPath);
  }

  /**
   * Gets the layer configuration of the specified layer path.
   *
   * @param layerPath - The layer path
   * @returns The layer configuration or undefined if not found
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    // Redirect to controller
    return this.#controllers.layerController.getLayerEntryConfigIfExists(layerPath);
  }

  /**
   * Gets the GeoView Layer Paths.
   *
   * @returns The layer paths of the GV Layers
   */
  getGeoviewLayerPaths(): string[] {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayerPaths();
  }

  /**
   * Gets all GeoView layers.
   *
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayers(): AbstractBaseGVLayer[] {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayers();
  }

  /**
   * Gets all GeoView layers that are regular layers (not groups).
   *
   * This method filters the list returned by `getGeoviewLayers()` and
   * returns only the layers that are instances of `AbstractGVLayer`.
   *
   * @returns An array containing only the regular layers from the current GeoView layer collection
   */
  getGeoviewLayersRegulars(): AbstractGVLayer[] {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayersRegulars();
  }

  /**
   * Gets all GeoView layers that are group layers.
   *
   * This method filters the list returned by `getGeoviewLayers()` and
   * returns only the layers that are instances of `GVGroupLayer`.
   *
   * @returns An array containing only the group layers from the current GeoView layer collection
   */
  getGeoviewLayersGroups(): GVGroupLayer[] {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayersGroups();
  }

  /**
   * Gets all GeoView layers that are at the root.
   *
   * @returns An array containing only the layers at the root level of the registry
   */
  getGeoviewLayersRoot(): AbstractBaseGVLayer[] {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayersRoot();
  }

  /**
   * Returns the GeoView instance associated to the layer path.
   *
   * @param layerPath - The layer path
   * @returns The new Geoview Layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  getGeoviewLayer(layerPath: string): AbstractBaseGVLayer {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayer(layerPath);
  }

  /**
   * Returns the AbstractGVLayer instance associated to the layer path.
   *
   * This returns an actual AbstractGVLayer and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
   * An AbstractGVLayer is essentially a layer that's not a group layer.
   *
   * @param layerPath - The layer path
   * @returns The new Geoview Layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   */
  getGeoviewLayerRegular(layerPath: string): AbstractGVLayer {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayerRegular(layerPath);
  }

  /**
   * Returns the GeoView Layer instance associated to the layer path.
   *
   * This returns an actual AbstractGVLayer (or undefined) and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
   * An AbstractGVLayer is essentially a layer that's not a group layer.
   *
   * @param layerPath - The layer path
   * @returns The AbstractGVLayer or undefined when not found
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   */
  getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayerRegularIfExists(layerPath);
  }

  /**
   * Returns the GeoView Layer instance associated to the layer path.
   *
   * @param layerPath - The layer path
   * @returns The AbstractBaseGVLayer or undefined when not found
   */
  getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined {
    // Redirect to controller
    return this.#controllers.layerController.getGeoviewLayerIfExists(layerPath);
  }

  /**
   * Asynchronously returns the OpenLayer layer associated to a specific layer path.
   *
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
   *
   * @param layerPath - The layer path to the layer's configuration
   * @param timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param checkFrequency - Optionally indicate the frequency at which to check for the condition on the layer
   * @returns A promise that resolves to an OpenLayer layer associated to the layer path
   */
  getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer> {
    // Redirect to controller
    return this.#controllers.layerController.getOLLayerAsync(layerPath, timeout, checkFrequency);
  }

  // #endregion LAYER CONTROLLER GETTERS REDIRECTIONS

  // #region PUBLIC METHODS - LAYER CONTROLLER GENERAL REDIRECTIONS

  /**
   * Adds a layer to the map.
   *
   * This is the main method to add a GeoView Layer on the map. It handles all the processing, including the validations,
   * and makes sure to inform the layer sets about the layer. The result contains the instanciated GeoViewLayer along
   * with a promise that will resolve when the layer will be officially on the map.
   *
   * @param geoviewLayerConfig - The geoview layer configuration to add
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
   * @returns The result of the addition of the geoview layer
   * @throws {LayerCreatedTwiceError} When there already is a layer on the map with the provided geoviewLayerId
   */
  addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult {
    // Redirect to controller
    return this.#controllers.layerCreatorController.addGeoviewLayer(geoviewLayerConfig, abortSignal);
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   *
   * @param uuid - The GeoCore UUID to add to the map
   * @param layerEntryConfig - The optional layer configuration
   * @returns A promise that resolves with the added layer result or undefined when an error occurs
   */
  addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<GeoViewLayerAddedResult | undefined> {
    // Redirect to controller
    return this.#controllers.layerCreatorController.addGeoviewLayerByGeoCoreUUID(uuid, layerEntryConfig);
  }

  /**
   * Removes all GeoView layers from the map.
   */
  removeAllGeoviewLayers(): void {
    // Redirect to controller
    return this.#controllers.layerCreatorController.removeAllGeoviewLayers();
  }

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param layerPath - The path or ID of the layer to be removed
   */
  removeLayerUsingPath(layerPath: string): void {
    // Redirect to controller
    return this.#controllers.layerCreatorController.removeLayerUsingPath(layerPath);
  }

  /**
   * Renames a layer.
   *
   * @param layerPath - The path of the layer
   * @param name - The new name to use
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  setLayerName(layerPath: string, name: string): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerName(layerPath, name);
  }

  /**
   * Sets the opacity of a layer.
   *
   * @param layerPath - The path of the layer
   * @param opacity - The new opacity value for the layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  setLayerOpacity(layerPath: string, opacity: number): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerOpacity(layerPath, opacity);
  }

  /**
   * Sets queryable state for a layer.
   *
   * @param layerPath - The path of the layer
   * @param queryable - The new queryable state for the layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer was of wrong type
   */
  setLayerQueryable(layerPath: string, queryable: boolean): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerQueryable(layerPath, queryable);
  }

  /**
   * Sets hoverable state for a layer.
   *
   * @param layerPath - The path of the layer
   * @param hoverable - The new hoverable state for the layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer was of wrong type
   */
  setLayerHoverable(layerPath: string, hoverable: boolean): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerHoverable(layerPath, hoverable);
  }

  /**
   * Updates the raster function for an ESRI Image layer.
   *
   * @param layerPath - The path of the layer
   * @param rasterFunctionId - The raster function ID to apply or undefined to remove it
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is not an ESRI Image layer
   */
  setLayerRasterFunction(layerPath: string, rasterFunctionId: string | undefined): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerRasterFunction(layerPath, rasterFunctionId);
  }

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   */
  refreshLayers(): void {
    // Redirect to controller
    this.#controllers.layerController.refreshLayers();
  }

  /**
   * Highlights all features of a layer on the map.
   *
   * @param layerPath - The path of the layer to highlight
   */
  highlightLayer(layerPath: string): void {
    // Redirect to controller
    this.#controllers.layerController.highlightLayer(layerPath);
  }

  /**
   * Removes highlights for a specific layer.
   *
   * @param layerPath - The path of the layer whose highlights to remove
   */
  removeLayerHighlights(layerPath: string): void {
    // Redirect to controller
    this.#controllers.layerController.removeLayerHighlights(layerPath);
  }

  /**
   * Removes all layer highlights from the map.
   */
  removeHighlightLayer(): void {
    // Redirect to controller
    this.#controllers.layerController.removeHighlightLayer();
  }

  /**
   * Sets the date temporal mode for the specific layer.
   *
   * This updates the layer-level configuration used to control how date values
   * are interpreted.
   * The value is stored in the application state via the layerController.
   *
   * @param layerPath - The unique path identifying the layer
   * @param temporalMode - The temporal mode to apply for interpreting date values associated with this layer
   */
  setLayerDateTemporalMode(layerPath: string, temporalMode: TemporalMode): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerDateTemporalMode(layerPath, temporalMode);
  }

  /**
   * Sets the date display format for a specific layer.
   *
   * This updates the layer-level configuration used to control how date values
   * are formatted when displayed (e.g., in legends, tooltips, or UI components).
   * The value is stored in the application state via the layerController.
   *
   * @param layerPath - The unique path identifying the layer
   * @param displayDateFormat - The date format to apply for displaying date values associated with this layer
   */
  setLayerDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerDisplayDateFormat(layerPath, displayDateFormat);
  }

  /**
   * Sets the date display format (short) for a specific layer.
   *
   * Short means the date should be displayed in a more compact format.
   * This updates the layer-level configuration used to control how date values
   * are formatted when displayed (e.g., in legends, tooltips, or UI components).
   * The value is stored in the application state via the layerController.
   *
   * @param layerPath - The unique path identifying the layer
   * @param displayDateFormat - The date format to apply for displaying date values associated with this layer
   */
  setLayerDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerDisplayDateFormatShort(layerPath, displayDateFormat);
  }

  /**
   * Sets the mosaic rule for an ESRI Image layer.
   *
   * @param layerPath - The layer path
   * @param mosaicRule - The mosaic rule to apply or undefined to remove it
   */
  setLayerMosaicRule(layerPath: string, mosaicRule: TypeMosaicRule | undefined): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerMosaicRule(layerPath, mosaicRule);
  }

  /**
   * Sets the WMS style for a WMS layer.
   *
   * @param layerPath - The layer path
   * @param wmsStyle - The WMS style to apply
   */
  setLayerWmsStyle(layerPath: string, wmsStyle: string): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerWmsStyle(layerPath, wmsStyle);
  }

  /**
   * Changes a GeoJson Source of a GeoJSON layer at the given layer path.
   *
   * @param layerPath - The path of the layer
   * @param geojson - The new geoJSON
   * @returns A promise that resolves when the geojson source has been set
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path
   * @throws {LayerNotGeoJsonError} When the layer is not a GeoJson layer
   */
  setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): Promise<void> {
    // Redirect to controller
    return this.#controllers.layerController.setGeojsonSource(layerPath, geojson);
  }

  /**
   * Zoom to extents of a layer.
   *
   * @param layerPath - The path of the layer to zoom to
   * @param fitOptions - Optional fit options for zooming
   * @returns A promise that resolves when the zoom operation is complete
   * @throws {NoBoundsError} When the layer doesn't have bounds
   */
  zoomToLayerExtent(layerPath: string, fitOptions?: FitOptions): Promise<void> {
    // Redirect to controller
    return this.#controllers.layerController.zoomToLayerExtent(layerPath, fitOptions);
  }

  /**
   * Sets the visibility of a single legend item on a regular (non-group) layer.
   *
   * This method updates the visibility of the specified item both in the underlying
   * layer's style configuration and optionally in the legend store. It can also
   * trigger the layer filters to be reapplied and optionally wait for the next
   * render cycle before resolving. Finally, it emits an event indicating the visibility
   * change.
   *
   * @param layerPath - The path identifying the target layer within the map
   * @param item - The legend item whose visibility will be updated
   * @param visibility - Whether the item should be visible
   * @param waitForRender - If `true`, the promise resolves only after the
   * underlying layer has finished its next render cycle.
   * @returns A promise that resolves once the visibility has been applied,
   * optional legend store updated, filters applied, and render completed if requested
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer was of wrong type
   */
  setItemVisibility(layerPath: string, item: TypeLegendItem, visibility: boolean, waitForRender: boolean): Promise<void> {
    // Redirect to controller
    return this.#controllers.layerController.setItemVisibility(layerPath, item, visibility, waitForRender);
  }

  /**
   * Sets the visibility of all geoview layers on the map.
   *
   * @param newValue - The new visibility
   */
  setAllLayersVisibility(newValue: boolean): void {
    // Redirect to controller
    return this.#controllers.layerController.setAllLayersVisibility(newValue);
  }

  /**
   * Sets or toggles the visibility of a layer within the current map.
   *
   * Retrieves the current visibility of the layer, determines the resulting visibility
   * based on the optional `newValue`, and applies the change only if the visibility
   * actually differs. If `newValue` is provided, the visibility is set explicitly;
   * if omitted, the method toggles the current visibility.
   *
   * @param layerPath - The path of the layer whose visibility is being updated
   * @param newValue - Optional. The new visibility value to apply. If omitted, the current visibility is toggled
   * @returns The resulting visibility state of the layer after the update
   * @throws {LayerNotFoundError} When the layer cannot be found at the given path
   */
  setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean {
    // Redirect to controller
    return this.#controllers.layerController.setOrToggleLayerVisibility(layerPath, newValue);
  }

  // #endregion PUBLIC METHODS - LAYER CONTROLLER GENERAL REDIRECTIONS

  // #region CUSTOM CLIENT REQUIRED FUNCTIONS

  /**
   * Redefine feature info fields.
   *
   * @param layerPath - The path of the layer
   * @param fieldNames - The new field names to use
   * @param fields - The fields to change
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
   * @throws {LayerDifferingFieldLengthsError} When the layer configuration has different field lengths
   * @throws {LayerNotQueryableError} When the layer configuration is not queryable
   */
  redefineFeatureFields(layerPath: string, fieldNames: string[], fields: 'alias' | 'name'): void {
    // Get the layer config
    const layerConfig = this.getLayerEntryConfigRegular(layerPath);

    // Get outfields
    const outfields = layerConfig.getOutfields();

    // If has fields and queryable
    if (!!outfields?.length && layerConfig.getQueryableSourceDefaulted()) {
      // Convert the provided field names to an array so we can index
      if (outfields.length === fieldNames.length)
        // Override existing values in each outfield with provided field name
        outfields.forEach((outfield, index) => {
          // eslint-disable-next-line no-param-reassign
          outfield[fields] = fieldNames[index];
        });
      else throw new LayerDifferingFieldLengthsError(layerPath);
    } else throw new LayerNotQueryableError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  /**
   * Replace outfield names, aliases and types with any number of new values, provided an identical count of each are supplied.
   *
   * @param layerPath - The path of the layer
   * @param types - The new field types (TypeOutfieldsType) to use
   * @param fieldNames - The new field names to use
   * @param fieldAliases - Optional, the new field aliases to use
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path
   * @throws {LayerDifferingFieldLengthsError} When the layer configuration has different field lengths
   * @throws {LayerNotQueryableError} When the layer configuration is not queryable
   */
  replaceFeatureOutfields(layerPath: string, types: TypeOutfieldsType[], fieldNames: string[], fieldAliases?: string[]): void {
    // Get the layer config
    const layerConfig = this.getLayerEntryConfigRegular(layerPath);

    // Get outfields
    const outfields = layerConfig.getOutfields();

    // If has fields and queryable
    if (!!outfields?.length && layerConfig.getQueryableSourceDefaulted()) {
      // Ensure same number of all items are provided
      if (fieldNames.length === types.length) {
        // Convert to array of outfields
        const newOutfields = fieldNames.map((name, index) => {
          return {
            name,
            alias: fieldAliases ? fieldAliases[index] : name,
            type: types[index],
          };
        });

        // Set new outfields
        layerConfig.setOutfields(newOutfields);
      } else throw new LayerDifferingFieldLengthsError(layerPath);
    } else throw new LayerNotQueryableError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  // #endregion CUSTOM CLIENT REQUIRED FUNCTIONS

  // #region EVENTS - LAYER API EVENTS

  /**
   * Emits an event to all handlers when a layer has been flagged as error on the map.
   *
   * @param event - The layer error event
   */
  #emitLayerError(event: LayerApiLayerErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerErrorHandlers, event);
  }

  /**
   * Registers a layer error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerError(callback: LayerApiLayerErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Unregisters a layer error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerError(callback: LayerApiLayerErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Emits layer visibility toggled event.
   *
   * @param event - The event to emit
   */
  #emitLayerVisibilityToggled(event: LayerApiLayerVisibleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer visibility toggled event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerVisibilityToggled(callback: LayerApiLayerVisibleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer visibility toggled event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerVisibilityToggled(callback: LayerApiLayerVisibleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  // #endregion EVENTS - LAYER API EVENTS

  // #region EVENTS - DOMAIN REDIRECTION EVENTS
  // GV Recycling domain events and re-emitting them for external consumers

  /**
   * Emits a layer status changed event to all registered handlers.
   *
   * @param event - The layer status changed event
   */
  #emitLayerStatusChanged(event: DomainLayerStatusChangedEvent): void {
    // Emit the layersetupdated event
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a callback to be executed whenever the layer status is updated.
   *
   * @param callback - The callback function
   */
  onLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void {
    // Register the layersetupdated event callback
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer status is updated.
   *
   * @param callback - The callback function to unregister
   */
  offLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void {
    // Unregister the layersetupdated event callback
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when all layers have turned into a loaded/error state on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerAllLoaded(event: DomainLayerStatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerAllLoadedHandlers, event);
  }

  /**
   * Registers a layer all loaded/error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerAllLoaded(callback: DomainLayerStatusChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer all loaded/error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerAllLoaded(callback: DomainLayerStatusChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has been loaded for the first time on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerFirstLoaded(event: DomainLayerBaseEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerLoadedFirstHandlers, event);
  }

  /**
   * Registers a layer first loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerFirstLoaded(callback: DomainLayerBaseDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedFirstHandlers, callback);
  }

  /**
   * Unregisters a layer first loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFirstLoaded(callback: DomainLayerBaseDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedFirstHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has turned into a loading state on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerLoading(event: DomainLayerBaseEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerLoadingHandlers, event);
  }

  /**
   * Registers a layer loading event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoading(callback: DomainLayerBaseDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Unregisters a layer loading event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoading(callback: DomainLayerBaseDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has turned into a loaded state on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerLoaded(event: DomainLayerBaseEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerLoadedHandlers, event);
  }

  /**
   * Registers a layer loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoaded(callback: DomainLayerBaseDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: DomainLayerBaseDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedHandlers, callback);
  }

  // #endregion EVENTS - DOMAIN REDIRECTION EVENTS

  // #region EVENTS - LAYER CONTROLLER REDIRECTION EVENTS
  // GV Recycling controller events and re-emitting them for external consumers

  /**
   * Emits an event to all handlers when a layer config has been added.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigAdded(event: LayerBuilderEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#controllers.layerCreatorController, this.#onLayerConfigAddedHandlers, event);
  }

  /**
   * Registers a layer config added event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @deprecated Stop using that hook, it's misleading as it's not a layer config that's added, it's a geoview-layer instance.
   */
  // TODO: REFACTOR - Review the wording of this hook, based on the deprecated note.
  onLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Unregisters a layer config added event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer config has been flagged as error.
   *
   * @param event - The layer config error event
   */
  #emitLayerConfigError(event: LayerConfigErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#controllers.layerCreatorController, this.#onLayerConfigErrorHandlers, event);
  }

  /**
   * Registers a layer config error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Unregisters a layer config error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer config has been removed.
   *
   * @param event - The layer config removed event
   * @deprecated Stop using that hook, it's misleading as it's not a layer config that's removed, it's a geoview-layer instance.
   */
  // TODO: REFACTOR - Review the wording of this hook, based on the deprecated note.
  #emitLayerConfigRemoved(event: LayerPathEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#controllers.layerCreatorController, this.#onLayerConfigRemovedHandlers, event);
  }

  /**
   * Registers a layer removed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer removed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has been created.
   *
   * @param event - The layer created event
   */
  #emitLayerCreated(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#controllers.layerCreatorController, this.#onLayerCreatedHandlers, event);
  }

  /**
   * Registers a layer created event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerCreated(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Unregisters a layer created event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerCreated(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Emits layer item visibility toggled event.
   *
   * @param event - The event to emit
   */
  #emitLayerItemVisibilityToggled(event: ControllerLayerItemVisibilityChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#controllers.layerController, this.#onLayerItemVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer item visibility toggled event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerItemVisibilityToggled(callback: ControllerLayerItemVisibilityChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerItemVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer item visibility toggled event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerItemVisibilityToggled(callback: ControllerLayerItemVisibilityChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerItemVisibilityToggledHandlers, callback);
  }

  // #endregion EVENTS - LAYER CONTROLLER REDIRECTION EVENTS
}

// #region EVENT TYPES

/** Defines an event for the layer error delegate. */
export interface LayerApiLayerErrorEvent {
  /** The GV layer that triggered the error. */
  layer: AbstractBaseGVLayer;
  /** The error that occurred. */
  error: GeoViewError;
}

/** Defines a delegate for the layer error event handler function signature. */
export type LayerApiLayerErrorDelegate = EventDelegateBase<LayerApi, LayerApiLayerErrorEvent, void>;

/** Defines an event for the layer visible changed delegate. */
export interface LayerApiLayerVisibleChangedEvent {
  /** The GV layer whose visibility changed. */
  layer: AbstractBaseGVLayer;
  /** The new visibility state. */
  visible: boolean;
}

/** Defines a delegate for the layer visible changed event handler function signature. */
export type LayerApiLayerVisibleChangedDelegate = EventDelegateBase<LayerApi, LayerApiLayerVisibleChangedEvent, void>;

// #endregion EVENT TYPES
