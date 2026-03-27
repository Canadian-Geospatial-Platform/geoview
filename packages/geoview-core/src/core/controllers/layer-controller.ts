import type BaseLayer from 'ol/layer/Base';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import type { TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { LayerWrongTypeError } from '@/core/exceptions/layer-exceptions';
import { useControllers } from '@/core/controllers/base/controller-manager';
import {
  setStoreLayerHoverable,
  setStoreLayerName,
  setStoreLayerQueryable,
  setStoreLayerRasterFunction,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type {
  DomainLayerHoverableChangedDelegate,
  DomainLayerHoverableChangedEvent,
  DomainLayerNameChangedDelegate,
  DomainLayerNameChangedEvent,
  DomainLayerQueryableChangedDelegate,
  DomainLayerQueryableChangedEvent,
  DomainLayerStatusChangedDelegate,
  DomainLayerStatusChangedEvent,
  LayerDomain,
} from '@/core/domains/layer-domain';
import { isValidUUID } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import {
  getStoreMapOrderedLayerIndexByPath,
  getStoreMapOrderedLayerInfo,
  setStoreMapLayerHoverable,
  setStoreMapLayerQueryable,
  utilFindMapLayerAndChildrenFromOrderedInfo,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';

/**
 * LayerController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export class LayerController extends AbstractMapViewerController {
  /** The Layer Domain instance associated with this controller */
  #layerDomain: LayerDomain;

  /** The bounded reference to the handle layer entry config registered */
  #boundedHandleLayerEntryConfigRegistered: DomainLayerStatusChangedDelegate;

  /** The bounded reference to the handle layer entry config unregistered */
  #boundedHandleLayerEntryConfigUnregistered: DomainLayerStatusChangedDelegate;

  /** The bounded reference to the handle layer name changed */
  #boundedHandleLayerNameChanged: DomainLayerNameChangedDelegate;

  /** The bounded reference to the handle layer hoverable changed */
  #boundedHandleLayerHoverableChanged: DomainLayerHoverableChangedDelegate;

  /** The bounded reference to the handle layer queryable changed */
  #boundedHandleLayerQueryableChanged: DomainLayerQueryableChangedDelegate;

  /**
   * Creates an instance of LayerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   */
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // Keep the domain internally
    this.#layerDomain = layerDomain;

    // Keep a bounded reference to the handle layer entry config registered
    this.#boundedHandleLayerEntryConfigRegistered = this.#handleLayerEntryConfigRegistered.bind(this);

    // Keep a bounded reference to the handle layer entry config unregistered
    this.#boundedHandleLayerEntryConfigUnregistered = this.#handleLayerEntryConfigUnregistered.bind(this);

    // Keep a bounded reference to the handle layer name changed
    this.#boundedHandleLayerNameChanged = this.#handleLayerNameChanged.bind(this);

    // Keep a bounded reference to the handle layer hoverable changed
    this.#boundedHandleLayerHoverableChanged = this.#handleLayerHoverableChanged.bind(this);

    // Keep a bounded reference to the handle layer queryable changed
    this.#boundedHandleLayerQueryableChanged = this.#handleLayerQueryableChanged.bind(this);
  }

  // #region OVERRIDES

  /**
   * Hooks layer domain listeners.
   */
  protected override onHook(): void {
    // Listens when a layer config has been registered in the domain
    this.#layerDomain.onLayerEntryConfigRegistered(this.#boundedHandleLayerEntryConfigRegistered);

    // Listens when a layer config has been unregistered from the domain
    this.#layerDomain.onLayerEntryConfigUnregistered(this.#boundedHandleLayerEntryConfigUnregistered);

    // Listens when the layer name is changed in the Layer domain
    this.#layerDomain.onLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // Listens when the layer hoverable state is changed in the Layer domain
    this.#layerDomain.onLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);

    // Listens when the layer queryable state is changed in the Layer domain
    this.#layerDomain.onLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unhooks when the layer queryable state is changed in the Layer domain
    this.#layerDomain.offLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

    // Unhooks when the layer hoverable state is changed in the Layer domain
    this.#layerDomain.offLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);

    // Unhooks when a layer name is changed in the Layer domain
    this.#layerDomain.offLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // Unhooks when a layer config has been unregistered from the domain
    this.#layerDomain.offLayerEntryConfigUnregistered(this.#boundedHandleLayerEntryConfigUnregistered);

    // Unhooks when a layer config has been registered in the domain
    this.#layerDomain.offLayerEntryConfigRegistered(this.#boundedHandleLayerEntryConfigRegistered);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  // #region PUBLIC METHODS - GEOVIEW LAYER/ENTRY GETTERS

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerIds();
  }

  /**
   * Gets the Layer Entry layer paths.
   *
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryLayerPaths();
  }

  /**
   * Gets the Layer Entry Configs.
   *
   * @returns The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfigs();
  }

  /**
   * Retrieves the layer entry configuration for the given layer path.
   *
   * @param layerPath - The layer path to look up
   * @returns The ConfigBaseClass layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfig(layerPath);
  }

  /**
   * Retrieves the layer entry configuration for the given layer path, if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The ConfigBaseClass layer configuration, or undefined if not found
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfigIfExists(layerPath);
  }

  /**
   * Gets the layer configuration of a regular layer (not a group) at the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig {
    return this.#layerDomain.getLayerEntryConfigRegular(layerPath);
  }

  /**
   * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig {
    return this.#layerDomain.getLayerEntryConfigGroup(layerPath);
  }

  /**
   * Gets the GeoView Layer Paths.
   *
   * @returns The layer paths of the GV Layers
   */
  getGeoviewLayerPaths(): string[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerPaths();
  }

  /**
   * Gets all GeoView Layers
   *
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayers(): AbstractBaseGVLayer[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayers();
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
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayersRegulars();
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
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayersGroups();
  }

  /**
   * Gets all GeoView layers that are at the root.
   *
   * @returns An array containing only the layers at the root level of the registry.
   */
  getGeoviewLayersRoot(): AbstractBaseGVLayer[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayersRoot();
  }

  /**
   * Retrieves the Geoview layer for the given layer path.
   *
   * @param layerPath - The layer path to look up
   * @returns The Geoview layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractBaseGVLayer {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayer(layerPath);
  }

  /**
   * Retrieves the Geoview layer for the given layer path, if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The AbstractBaseGVLayer or undefined when not found
   */
  getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerIfExists(layerPath);
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
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerRegular(layerPath);
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
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerRegularIfExists(layerPath);
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
    // Retrieve from the domain
    return this.#layerDomain.getOLLayerAsync(layerPath, timeout, checkFrequency);
  }

  // #endregion PUBLIC METHODS - GEOVIEW LAYER/ENTRY GETTERS

  /**
   * Retrieves the service (metadata) projection code for a specific raster layer.
   *
   * @param layerPath - The fully qualified path of the layer.
   * @returns The projection code (e.g., "EPSG:4326") defined in the layer's service metadata,
   *          or `undefined` if:
   *          - the layer does not exist,
   *          - the layer is not a raster layer,
   *          - or the metadata projection is not available.
   * @description
   *
   * This method looks up the GeoView layer associated with the provided `layerPath`.
   * If the layer exists and is an instance of `AbstractGVRaster`, it retrieves the
   * projection defined in the service metadata via `getMetadataProjection()`.
   * The projection code is then returned using `projection.getCode()`.
   */
  getLayerMetatadaProjectionEPSG(layerPath: string): string | undefined {
    // Get the layer if it exists
    const geoviewLayer = this.getGeoviewLayerIfExists(layerPath);

    // If of the right type
    if (geoviewLayer instanceof AbstractGVRaster) {
      // Get the projection and return its code
      const projection = geoviewLayer.getMetadataProjection();
      return projection?.getCode();
    }

    // Layer not found or not a Raster layer or no metadata projection
    return undefined;
  }

  /**
   * Sets the name of the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to set the queryable property
   * @param name - The value to set for the name property
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerName(layerPath: string, name: string): void {
    // Act on the domain
    this.getGeoviewLayer(layerPath).setLayerName(name);
  }

  /**
   * Sets the queryable property of the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to set the queryable property
   * @param queryable - The value to set for the queryable property
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerQueryable(layerPath: string, queryable: boolean): void {
    // Act on the domain
    this.getGeoviewLayerRegular(layerPath).setQueryable(queryable);
  }

  /**
   * Sets hoverable state for a layer.
   *
   * @param layerPath - The path of the layer.
   * @param hoverable - The new hoverable state for the layer.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerHoverable(layerPath: string, hoverable: boolean): void {
    // Get the layer
    const layer = this.getGeoviewLayerRegular(layerPath);

    // Redirect
    layer.setHoverable(hoverable);
  }

  /**
   * Updates the raster function for an ESRI Image layer.
   *
   * @param layerPath - The path of the layer.
   * @param rasterFunctionId - The raster function ID to apply or undefined to remove it.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is not an ESRI Image layer.
   */
  setLayerRasterFunction(layerPath: string, rasterFunctionId: string | undefined): void {
    // Get the layer
    const layer = this.getGeoviewLayer(layerPath);

    // Check if it's the right type
    if (!(layer instanceof GVEsriImage)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

    // Update the raster function
    layer.setRasterFunction(rasterFunctionId);

    // Update the store
    //TODO: REFACTOR - The store update should happen through a store adaptor via a setRasterFunctionChanged event raised by the layer
    setStoreLayerRasterFunction(this.getMapId(), layerPath, rasterFunctionId);

    // Trigger legend re-query through the layer set system (forced refresh)
    this.getControllersRegistry().layerSetController.legendsLayerSet.queryLegend(layer, true);
  }

  // #endregion PUBLIC METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  /**
   * Handles when a layer entry config is registered in the domain.
   *
   * Registers the layer for ordered layer info, notifies all layer sets,
   * and sets the layer status to registered.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the registered layer config
   */
  #handleLayerEntryConfigRegistered(sender: LayerDomain, event: DomainLayerStatusChangedEvent): void {
    // Register for ordered layer information
    if (event.config.getGeoviewLayerConfig().useAsBasemap !== true) this.#registerForOrderedLayerInfo(event.config as TypeLayerEntryConfig);

    // Tell the layer sets about it
    this.getControllersRegistry().layerSetController.allLayerSets.forEach((layerSet) => {
      // Register the config to the layer set
      layerSet.registerLayerConfig(event.config);
    });

    // Set the layer status to registered
    event.config.setLayerStatusRegistered();
  }

  /**
   * Handles when a layer entry config is unregistered from the domain.
   *
   * Notifies all layer sets to unregister the layer.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the unregistered layer config
   */
  #handleLayerEntryConfigUnregistered(sender: LayerDomain, event: DomainLayerStatusChangedEvent): void {
    // GV Could be moved to layer-set-controller, but keeping it here for now to be next to the layer entry config registered event hook

    // Tell the layer sets about it
    this.getControllersRegistry().layerSetController.allLayerSets.forEach((layerSet) => {
      // Unregister from the layer set
      layerSet.unregister(event.config.layerPath);
    });
  }

  /**
   * Handles when a layer name is changed in the domain.
   *
   * @param layer - The layer that's become changed.
   * @param event - The event containing the name change.
   */
  #handleLayerNameChanged(sender: LayerDomain, event: DomainLayerNameChangedEvent): void {
    setStoreLayerName(this.getMapId(), event.layer.getLayerPath(), event.name);
  }

  /**
   * Handles when a layer's hoverable state changes in the domain.
   *
   * Propagates the change to the store and clears feature info results
   * when hoverable is turned off.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the layer and new hoverable state
   */
  #handleLayerHoverableChanged(sender: LayerDomain, event: DomainLayerHoverableChangedEvent): void {
    // Save in store
    // TODO: CHECK - Why 2 store locations to store the hoverable state? Centralize?
    setStoreMapLayerHoverable(this.getMapId(), event.layer.getLayerPath(), event.hoverable);

    // Save in store
    setStoreLayerHoverable(this.getMapId(), event.layer.getLayerPath(), event.hoverable);

    // If not hoverable
    if (!event.hoverable) {
      // Clear the results when turning the hoverable to false
      this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.clearResults(event.layer.getLayerPath());
    }
  }

  /**
   * Handles when a layer's queryable state changes in the domain.
   *
   * Propagates the change to the store and clears feature info results
   * when queryable is turned off.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the layer and new queryable state
   */
  #handleLayerQueryableChanged(sender: LayerDomain, event: DomainLayerQueryableChangedEvent): void {
    // Save in store
    setStoreLayerQueryable(this.getMapId(), event.layer.getLayerPath(), event.queryable);

    // Save in store
    // TODO: CHECK - Why 2 store locations to store the queryable state? Centralize?
    setStoreMapLayerQueryable(this.getMapId(), event.layer.getLayerPath(), event.queryable);

    // If not queryable
    if (!event.queryable) {
      // Clear the results from the layer set when turning the queryable to false
      this.getControllersRegistry().layerSetController.clearFeatureInfoLayerResults(event.layer.getLayerPath());
    }
  }

  // #endregion DOMAIN HANDLERS

  // #region PRIVATE METHODS

  /**
   * Registers layer information for the ordered layer info in the store.
   *
   * @param layerConfig - The layer configuration to be reordered.
   */
  #registerForOrderedLayerInfo(layerConfig: ConfigBaseClass): void {
    // If the map index for the given layer path hasn't been set yet
    if (getStoreMapOrderedLayerIndexByPath(this.getMapId(), layerConfig.layerPath) === -1) {
      // Get the parent layer path
      const parentLayerPathArray = layerConfig.layerPath.split('/');
      parentLayerPathArray.pop();
      const parentLayerPath = parentLayerPathArray.join('/');

      // Get the parent layer config, if any
      const parentLayerConfig = layerConfig.getParentLayerConfig();

      // If the map index of a parent layer path has been set and it is a valid UUID, the ordered layer info is a place holder
      // registered while the geocore layer info was fetched
      if (getStoreMapOrderedLayerIndexByPath(this.getMapId(), parentLayerPath) !== -1 && isValidUUID(parentLayerPath)) {
        // Replace the placeholder ordered layer info
        MapEventProcessor.replaceOrderedLayerInfo(this.getMapId(), layerConfig, parentLayerPath);
      } else if (parentLayerConfig) {
        // Here the map index of a sub layer path hasn't been set and there's a parent layer config for the current layer config
        // Get the map index of the parent layer path
        const parentLayerIndex = getStoreMapOrderedLayerIndexByPath(this.getMapId(), parentLayerPath);

        // Get the number of layers
        const numberOfLayers = utilFindMapLayerAndChildrenFromOrderedInfo(
          parentLayerPath,
          getStoreMapOrderedLayerInfo(this.getMapId())
        ).length;

        // If the map index of the parent has been set
        if (parentLayerIndex !== -1) {
          // Add the ordered layer information for the sub layer path based on the parent index + the number of child layers
          MapEventProcessor.addOrderedLayerInfoByConfig(
            this.getMapId(),
            layerConfig as TypeLayerEntryConfig,
            parentLayerIndex + numberOfLayers
          );
        } else {
          // If we get here, something went wrong and we have a sub layer being registered before the parent
          logger.logError(`Sub layer ${layerConfig.layerPath} registered in layer order before parent layer`);
          MapEventProcessor.addOrderedLayerInfoByConfig(this.getMapId(), parentLayerConfig);
        }
      } else {
        // Add the orderedLayerInfo for layer that hasn't been set and has no parent layer or geocore placeholder
        MapEventProcessor.addOrderedLayerInfoByConfig(this.getMapId(), layerConfig as TypeLayerEntryConfig);
      }
    }
  }

  // #endregion PRIVATE METHODS
}

/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useLayerController(): LayerController {
  return useControllers().layerController;
}
