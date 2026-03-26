import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import type { TypeLayerEntryConfig } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/controller-manager';
import { setStoreLayerName, setStoreLayerQueryable } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type {
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
  setStoreMapLayerQueryable,
  utilFindMapLayerAndChildrenFromOrderedInfo,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';

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

    // Listens when the layer queryable state is changed in the Layer domain
    this.#layerDomain.onLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unhooks when the layer queryable state is changed in the Layer domain
    this.#layerDomain.offLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

    // Unhooks when a layer name is changed in the Layer domain
    this.#layerDomain.offLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // Unhooks when a layer config has been unregistered from the domain
    this.#layerDomain.offLayerEntryConfigUnregistered(this.#boundedHandleLayerEntryConfigUnregistered);

    // Unhooks when a layer config has been registered in the domain
    this.#layerDomain.offLayerEntryConfigRegistered(this.#boundedHandleLayerEntryConfigRegistered);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Retrieves the layer entry configuration for the given layer path, if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The layer entry config, or undefined if not found
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfigIfExists(layerPath);
  }

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
    const geoviewLayer = this.#layerDomain.getGeoviewLayerIfExists(layerPath);

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
   */
  setLayerName(layerPath: string, name: string): void {
    // Act on the domain
    this.#layerDomain.getGeoviewLayer(layerPath).setLayerName(name);
  }

  /**
   * Sets the queryable property of the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to set the queryable property
   * @param queryable - The value to set for the queryable property
   */
  setLayerQueryable(layerPath: string, queryable: boolean): void {
    // Act on the domain
    this.#layerDomain.getGeoviewLayerRegular(layerPath).setQueryable(queryable);
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
    this.getMapViewer().controllers.layerSetController.allLayerSets.forEach((layerSet) => {
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
    this.getMapViewer().controllers.layerSetController.allLayerSets.forEach((layerSet) => {
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
      this.getMapViewer().controllers.layerSetController.clearFeatureInfoLayerResults(event.layer.getLayerPath());
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
