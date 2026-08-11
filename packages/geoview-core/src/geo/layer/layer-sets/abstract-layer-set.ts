import type {
  QueryType,
  TypeDisplayLanguage,
  TypeFeatureInfoEntry,
  TypeFeatureInfoResult,
  TypeLocation,
} from '@/api/types/map-schema-types';
import EventHelper, { type EventDelegateBase } from '@/api/events/event-helper';
import { generateId } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import type { LayerDomain } from '@/core/domains/layer-domain';
import type {
  ConfigBaseClass,
  LayerStatusChangedDelegate,
  LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { Coordinate } from 'ol/coordinate';

/**
 * A class to hold a set of layers associated with a value of any type.
 *
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 */
export abstract class AbstractLayerSet {
  /** The LayerDomain to work with */
  // TODO: REFACTOR IMPORTANT - We can get rid of the layerDomain dependency here if we
  // TO.DOCONT: always pass the GVLayer or LayerEntry in parameters when necessary instead of the layerPath string.
  protected layerDomain: LayerDomain;

  /** The MapViewer to work with */
  protected mapViewer: MapViewer;

  /** The controller registry to work with */
  protected controllerRegistry: ControllerRegistry;

  /** Indicates the default when registering a layer config */
  // GV: Only the LegendsLayerSet registers the layer configs to track the 'boxes' in the UI.
  // GV: The other layer sets register the layer OBJECTS instead of the layer CONFIGS.
  #defaultRegisterLayerConfigCheck = false;

  /** The registered layer configs */
  #registeredLayerConfigs: ConfigBaseClass[] = [];

  /** The registered layers */
  #registeredLayers: AbstractBaseGVLayer[] = [];

  /** Keep a bounded reference to the handle when the layer config status callbacks */
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  /** Callback delegates for the layer config registered event */
  #onLayerConfigRegisteredHandlers: LayerConfigRegisteredDelegate[] = [];

  /** Callback delegates for the layer config registered event */
  #onLayerRegisteredHandlers: LayerRegisteredDelegate[] = [];

  /**
   * Constructs a new LayerSet instance.
   *
   * @param mapViewer - The MapViewer instance to work with
   * @param controllerRegistry - The ControllerRegistry instance to work with
   * @param layerDomain - The LayerDomain instance to work with
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, layerDomain: LayerDomain) {
    this.mapViewer = mapViewer;
    this.controllerRegistry = controllerRegistry;
    this.layerDomain = layerDomain;

    /** Keep a reference to the handle when the layer config status changes */
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
  }

  // #region OVERRIDES

  /**
   * A must-override method called to delete a result set entry from the store.
   *
   * @param layerPath - The layer path to delete from store
   */
  protected abstract onDeleteFromStore(layerPath: string): void;

  /**
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path.
   *
   * @param layerConfig - The layer config
   * @returns True if the layer config should be registered, false otherwise
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set doesn't register layer configs, it typically registers the layer objects but not the layer config
    return this.#defaultRegisterLayerConfigCheck;
  }

  /**
   * An overridable registration function for a layer-set that the registration process will use to
   * create a new entry in the layer set for a specific geoview layer and layer path.
   *
   * @param layerConfig - The layer config
   */
  protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Add the layer config to the registered layer configs
    this.#registeredLayerConfigs.push(layerConfig);

    // Emit about it
    this.#emitLayerConfigRegistered({ layerConfig });
  }

  /**
   * An overridable unregistration function for a layer-set that the registration process will use to
   * unregister a specific layer config.
   *
   * @param layerConfig - The layer config
   */
  protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void {
    // Remove layer config from registered layer configs
    this.#registeredLayerConfigs = this.#registeredLayerConfigs.filter((layer) => layer.layerPath !== layerConfig?.layerPath);
  }

  /**
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
   *
   * @param layer - The layer
   * @returns True if the layer should be registered, false otherwise
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set always registers layers except when they are group layers or basemap layers
    if (layer.getLayerConfig()?.getEntryTypeIsGroup()) {
      // Skip groups
      return false;
    }
    if (layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap) return false;

    // Default
    return true;
  }

  /**
   * An overridable registration function for a layer-set that the registration process will use to
   * create a new entry in the layer set for a specific geoview layer and layer path.
   *
   * @param layer - The layer config
   */
  protected onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Add to the registered layers array
    this.#registeredLayers.push(layer);

    // Emit about it
    this.#emitLayerRegistered({ layer });
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * A quick getter to help identify which layerset class the current instance is coming from.
   *
   * @returns The constructor name of the current layerset class instance
   */
  getClassName(): string {
    // Return the name of the class
    return this.constructor.name;
  }

  /**
   * Gets the registered layer config paths based on the registered layer configs.
   *
   * @returns An array of layer config paths
   */
  getRegisteredLayerConfigPaths(): string[] {
    return this.#registeredLayerConfigs.map((layer) => layer.layerPath);
  }

  /**
   * Gets a registered layer config by its layer path if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The registered layer config, or undefined if not found
   */
  getRegisteredLayerConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    return this.#registeredLayerConfigs.find((layer) => layer.layerPath === layerPath);
  }

  /**
   * Gets the registered layer paths based on the registered layers.
   *
   * @returns An array of layer paths
   */
  getRegisteredLayerPaths(): string[] {
    return this.#registeredLayers.map((layer) => layer.getLayerPath());
  }

  /**
   * Gets a registered layer by its layer path if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The registered layer, or undefined if not found
   */
  getRegisteredLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined {
    return this.#registeredLayers.find((layer) => layer.getLayerPath() === layerPath);
  }

  /**
   * Registers the layer config in the layer-set.
   *
   * @param layerConfig - The layer config
   */
  registerLayerConfig(layerConfig: ConfigBaseClass): void {
    // Update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
    if (this.onRegisterLayerConfigCheck(layerConfig) && !this.getRegisteredLayerConfigPaths().includes(layerConfig.layerPath)) {
      // Call the registration function for the layer-set. This method is different for each child.
      this.onRegisterLayerConfig(layerConfig);
    }

    // Prepare the config for its layer registration later
    this.#prepareConfigForLayerRegistration(layerConfig);
  }

  /**
   * Registers the layer in the layer-set.
   *
   * If the layer is already registered, the function returns immediately.
   * If the layer hasn't reached the `loaded` status yet, this method subscribes to the layer
   * config's status change event and waits until the status becomes `loaded` before registering.
   * This await is important when devs call this method directly to register ad-hoc layers.
   *
   * @param layer - The layer to register
   * @returns A promise that resolves once the layer has been registered (or skipped)
   */
  async registerLayer(layer: AbstractBaseGVLayer): Promise<void> {
    // If the layer is already registered, skip it, we don't register twice
    if (this.getRegisteredLayerPaths().includes(layer.getLayerPath())) return;

    // Early-exit on 'error'
    if (layer.getLayerStatus() === 'error') return;

    // Wait for the layer to reach 'loaded' status if not already loaded
    if (layer.getLayerStatus() !== 'loaded') {
      const event = await layer.getLayerConfig().onceLayerStatusChanged((e) => e.layerStatus === 'loaded' || e.layerStatus === 'error');
      if (event.layerStatus !== 'loaded') return;
    }

    // Update the registration of all layer sets
    if (this.onRegisterLayerCheck(layer)) {
      // Call the registration function for the layer-set. This method is different for each child.
      this.onRegisterLayer(layer);
    }
  }

  /**
   * Unregisters the layer config and layer from the layer-set.
   *
   * @param layerPath - The layer path
   */
  unregister(layerPath: string): void {
    // Call the unregistration function for the layer-set. This method is different for each child.
    this.onUnregisterLayerConfig(this.layerDomain.getLayerEntryConfigIfExists(layerPath));

    // Delete from the store
    this.onDeleteFromStore(layerPath);

    // Remove layer from registered layers
    this.#registeredLayers = this.#registeredLayers.filter((layer) => layer.getLayerPath() !== layerPath);
  }

  /**
   * Waits for a layer config to be registered in the all-feature-info-layer-set.
   *
   * This method returns a promise that resolves when the given `layerPath` is included in the registered layer config paths of the set.
   *
   * @param layerPath - The unique path identifying the layer to check for registration
   * @returns A promise that resolves when the layer is registered
   */
  waitForLayerConfigToGetRegistered(layerPath: string): Promise<LayerConfigRegisteredEvent> {
    // First, check synchronously — it may ALREADY be registered
    const registeredLayerConfig = this.getRegisteredLayerConfigIfExists(layerPath);
    if (registeredLayerConfig) return Promise.resolve({ layerConfig: registeredLayerConfig });

    // Otherwise, subscribe and wait
    return this.onceLayerConfigRegistered((event) => event.layerConfig.layerPath === layerPath);
  }

  /**
   * Waits for a layer config to be registered in the all-feature-info-layer-set.
   *
   * This method returns a promise that resolves when the given `layerPath` is included in the registered layer config paths of the set.
   *
   * @param layerPath - The unique path identifying the layer to check for registration
   * @returns A promise that resolves when the layer is registered
   */
  waitForLayerToGetRegistered(layerPath: string): Promise<LayerRegisteredEvent> {
    // First, check synchronously — it may ALREADY be registered
    const registeredLayer = this.getRegisteredLayerIfExists(layerPath);
    if (registeredLayer) return Promise.resolve({ layer: registeredLayer });

    // Otherwise, subscribe and wait
    return this.onceLayerRegistered((event) => event.layer.getLayerPath() === layerPath);
  }

  // #endregion PUBLIC METHODS

  // #region PROTECTED METHODS

  /**
   * Gets the MapId for the layer set.
   *
   * @returns The map id
   */
  protected getMapId(): string {
    return this.mapViewer.mapId;
  }

  /**
   * Processes layer data to query features on it, if the layer path can be queried.
   *
   * @param geoviewLayer - The geoview layer
   * @param queryType - The query type
   * @param location - The location for the query
   * @param queryGeometry - Optional whether to query geometry
   * @param language - The display language to use for the query
   * @param abortController - Optional abort controller
   * @returns A promise that resolves with the query results
   * @throws {NotSupportedError} When `queryType` is not one of the supported query types (propagated from `getFeatureInfo()`)
   * @throws {NotImplementedError} When the underlying layer type does not implement the requested `queryType` (propagated from `getFeatureInfo()`)
   */
  protected queryLayerFeatures(
    geoviewLayer: AbstractGVLayer,
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry = true,
    language: TypeDisplayLanguage,
    abortController?: AbortController
  ): Promise<TypeFeatureInfoResult> {
    // If the layer is invisible (or any of its parent(s) is invisible)
    if (!geoviewLayer.getVisibleIncludingParents()) return Promise.resolve({ results: [] });

    // If is not in visible range
    const currentResolution =
      this.mapViewer.getView().getResolution() ?? this.mapViewer.getView().getResolutionForZoom(this.mapViewer.getView().getZoom() ?? 0);
    if (!geoviewLayer.isInVisibleRange(currentResolution)) {
      return Promise.resolve({ results: [] });
    }

    // Get Feature Info
    return geoviewLayer.getFeatureInfo(this.mapViewer.map, queryType, location, queryGeometry, language, abortController);
  }

  /**
   * Checks if a pixel coordinate should be queried for a layer considering swiper clipping.
   *
   * @param layerPath - The layer path to check
   * @param pixelCoordinate - The pixel coordinate relative to the map viewport
   * @returns True if the coordinate should be queried (not clipped by swiper)
   */
  protected shouldQueryAtPixel(layerPath: string, pixelCoordinate: Coordinate): boolean {
    // Check if swiper plugin is loaded via controller existence
    const { swiperController } = this.controllerRegistry;
    if (!swiperController) {
      // Swiper plugin not loaded - no filtering needed
      return true;
    }

    // Get map size. Required to check if the pixel coordinate is in the visible region considering the swiper position and orientation.
    const mapSize = this.mapViewer.map.getSize();
    if (!mapSize) return true;

    // Delegate to swiper controller
    return swiperController.shouldQueryAtPixel(layerPath, pixelCoordinate, mapSize);
  }

  // #endregion PROTECTED METHODS

  // #region PRIVATE METHODS

  /**
   * Prepares a layer configuration for automatic registration once the layer becomes loaded.
   *
   * This method sets up a listener on the provided layer configuration that monitors its status.
   * When the layer's status changes to `loaded`, it attempts to retrieve the corresponding layer
   * from the layer API and registers it into the system's layer set. If registration fails, errors
   * are logged appropriately.
   *
   * @param layerConfig - The configuration object for the layer to be monitored
   */
  #prepareConfigForLayerRegistration(layerConfig: ConfigBaseClass): void {
    // Listen to the status changes so that when it gets loaded it automatically gets registered as a layer
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);
  }

  /**
   * Handles the layer status change event.
   *
   * When a layer's status changes to `loaded`, this method attempts to retrieve the corresponding layer
   * from the layer domain and registers it into the system's layer set. If registration fails, errors
   * are logged appropriately.
   *
   * @param sender - The configuration object for the layer
   * @param event - The layer status change event
   */
  #handleLayerStatusChanged(sender: ConfigBaseClass, event: LayerStatusChangedEvent): void {
    try {
      // If the layer status is 'loaded', otherwise, don't even try yet
      if (event.layerStatus === 'loaded') {
        // The layer has become loaded
        sender.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

        // Get the layer
        const layer = this.layerDomain.getGeoviewLayerIfExists(sender.layerPath);

        // If the layer exists (hasn't been deleted meanwhile)
        if (layer) {
          // Register the layer itself (not the layer config) automatically in the layer set
          this.registerLayer(layer).catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('in registerLayer in #handleLayerStatusChanged', error);
          });
        } else {
          // Log
          logger.logWarning(`The layer ${sender.layerPath} turned into a 'loaded' state, but wasn't on the map anymore.`);
        }
      }
    } catch (error: unknown) {
      // Error happened when trying to register the layer coming from the layer config
      logger.logError('Error trying to register the layer coming from the layer config', error);
    }
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

  /**
   * Emits a layer config registered event.
   *
   * @param event - The layer config registered event
   */
  #emitLayerConfigRegistered(event: LayerConfigRegisteredEvent): void {
    // Emit the event
    EventHelper.emitEvent(this, this.#onLayerConfigRegisteredHandlers, event);
  }

  /**
   * Returns a promise that resolves the next time a layer config registered event fires.
   *
   * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
   * @returns A promise that resolves with the event payload when layer config registered fires (and passes the filter)
   */
  onceLayerConfigRegistered(filter?: (event: LayerConfigRegisteredEvent) => boolean): Promise<LayerConfigRegisteredEvent> {
    // Register a one-shot event handler that resolves a promise
    return EventHelper.onceEventPromise(this.#onLayerConfigRegisteredHandlers, filter);
  }

  /**
   * Registers a layer config registered event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onLayerConfigRegistered(callback: LayerConfigRegisteredDelegate): LayerConfigRegisteredDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerConfigRegisteredHandlers, callback);
  }

  /**
   * Unregisters a layer config registered event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigRegistered(callback: LayerConfigRegisteredDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigRegisteredHandlers, callback);
  }

  /**
   * Emits a layer registered event.
   *
   * @param event - The layer config registered event
   */
  #emitLayerRegistered(event: LayerRegisteredEvent): void {
    // Emit the event
    EventHelper.emitEvent(this, this.#onLayerRegisteredHandlers, event);
  }

  /**
   * Returns a promise that resolves the next time a layer registered event fires.
   *
   * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
   * @returns A promise that resolves with the event payload when layer registered fires (and passes the filter)
   */
  onceLayerRegistered(filter?: (event: LayerRegisteredEvent) => boolean): Promise<LayerRegisteredEvent> {
    // Register a one-shot event handler that resolves a promise
    return EventHelper.onceEventPromise(this.#onLayerRegisteredHandlers, filter);
  }

  /**
   * Registers a layer registered event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onLayerRegistered(callback: LayerRegisteredDelegate): LayerRegisteredDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onLayerRegisteredHandlers, callback);
  }

  /**
   * Unregisters a layer registered event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerRegistered(callback: LayerRegisteredDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerRegisteredHandlers, callback);
  }

  // #endregion EVENTS

  // #region STATIC METHODS

  /**
   * Checks if the layer is of queryable type based on its class definition.
   *
   * @param layer - The layer
   * @returns True if the layer is of queryable type
   */
  protected static isQueryableType(layer: AbstractBaseGVLayer): boolean {
    return layer instanceof AbstractGVVector || layer instanceof GVEsriDynamic || layer instanceof GVWMS || layer instanceof GVEsriImage;
  }

  /**
   * Checks if the layer config source is queryable.
   *
   * @param layer - The layer
   * @returns True if the source is queryable or undefined
   */
  protected static isSourceQueryable(layer: AbstractBaseGVLayer): boolean {
    // Cast
    const layerConfigCasted = layer.getLayerConfig() as AbstractBaseLayerEntryConfig;

    // Get if the source is queryable
    return layerConfigCasted.getQueryableSourceDefaulted();
  }

  /**
   * Aligns records with information provided by OutFields from layer config.
   *
   * This will update fields in and delete unwanted fields from the arrayOfRecords.
   *
   * @param layerEntryConfig - The layer entry config object
   * @param arrayOfRecords - Features to delete fields from
   */
  protected static alignRecordsWithOutFields(layerEntryConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): void {
    // Get outfields
    const outfields = layerEntryConfig.getOutfields();

    // If outFields is provided, compare record fields with outFields to remove unwanted one
    // If there is no outFields, this will be created in the next function patchMissingMetadataIfNecessary
    if (outfields) {
      // Loop the array of records to delete fields or align fields info for each record
      arrayOfRecords.forEach((recordOriginal) => {
        // Create a copy to avoid the no param reassign ESLint rule
        const record = { ...recordOriginal };
        let fieldKeyCounter = 0;

        const fieldsToDelete = Object.keys(record.fieldInfo).filter((fieldName) => {
          // Look for an attribute with the name or alias (alias because a GetFeature responds with the alias in the features response!)
          const normalizedFieldName = fieldName.toLowerCase();
          const fieldLeafToken = normalizedFieldName.split('.').pop();
          const outfield = outfields.find((f) => {
            const normalizedOutfieldName = f.name.toLowerCase();
            const normalizedOutfieldAlias = f.alias.toLowerCase();
            const outfieldLeafToken = normalizedOutfieldName.split('.').pop();

            if (normalizedOutfieldName === normalizedFieldName || normalizedOutfieldAlias === normalizedFieldName) {
              return true;
            }

            return fieldLeafToken !== undefined && outfieldLeafToken === fieldLeafToken;
          });

          if (outfield) {
            const field = record.fieldInfo[fieldName]!;
            field.fieldKey = fieldKeyCounter++;
            field.alias = outfield.alias;
            field.dataType = outfield.type;
            return false; // keep this entry
          }

          return true; // mark for deletion
        });

        fieldsToDelete.forEach((entryToDelete) => {
          delete record.fieldInfo[entryToDelete];
        });

        record.fieldInfo.geoviewID = {
          fieldKey: fieldKeyCounter,
          alias: 'geoviewID',
          dataType: 'string',
          value: generateId(),
        };
      });
    }
  }

  /**
   * Determines whether the retrieved feature info records contain real attribute fields
   *
   * (i.e., key-value properties) or whether they were returned in a fallback
   * HTML/plain-text form, which commonly occurs with WMS `GetFeatureInfo` responses.
   * This is used primarily to detect when a WMS service cannot return structured
   * feature attributes and instead provides the feature data as a single HTML or
   * plain-text block.
   * **Logic summary:**
   * - For WMS layers (`OgcWmsLayerEntryConfig`):
   *   - If the first record contains exactly one property and that property is
   *     either `html` or `plain_text`, the method considers the response *not*
   *     to contain actual fields.
   * - For all other cases, the method assumes records contain valid structured attributes.
   *
   * @param layerConfig - The layer configuration used to determine whether special WMS handling applies
   * @param arrayOfRecords - The retrieved feature info entries representing attributes or raw text content
   * @returns `true` if the feature info records contain real attribute fields;
   *   `false` if they consist only of fallback HTML or plain-text content
   */
  protected static recordsContainActualFields(layerConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): boolean {
    // If the layer is WMS and there's only 1 property and it's html or plain_text, let it be, the getFeatureInfo couldn't query object by properties nicely
    if (layerConfig instanceof OgcWmsLayerEntryConfig && arrayOfRecords.length) {
      const { fieldInfo } = arrayOfRecords[0];
      if (
        Object.keys(fieldInfo).length === 1 &&
        (Object.prototype.hasOwnProperty.call(fieldInfo, 'html') || Object.prototype.hasOwnProperty.call(fieldInfo, 'plain_text'))
      ) {
        // Skip
        return false;
      }
    }

    // Records have actual fields
    return true;
  }

  // #endregion STATIC METHODS
}

// #region EVENTS & DELEGATES

/** Event emitted when a layer config is registered in the layer-set. */
export interface LayerConfigRegisteredEvent {
  /** The layer config */
  layerConfig: ConfigBaseClass;
}

/** Delegate for the layer config registered event handler function signature. */
export type LayerConfigRegisteredDelegate = EventDelegateBase<AbstractLayerSet, LayerConfigRegisteredEvent, void>;

/** Event emitted when a layer is registered in the layer-set. */
export interface LayerRegisteredEvent {
  /** The layer */
  layer: AbstractBaseGVLayer;
}

/** Delegate for the layer registered event handler function signature. */
export type LayerRegisteredDelegate = EventDelegateBase<AbstractLayerSet, LayerRegisteredEvent, void>;

// #endregion EVENTS & DELEGATES
