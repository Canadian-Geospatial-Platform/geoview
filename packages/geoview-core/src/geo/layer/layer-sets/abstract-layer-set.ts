import type { QueryType, TypeFeatureInfoEntry, TypeFeatureInfoResult, TypeLocation } from '@/api/types/map-schema-types';
import { generateId, whenThisThen } from '@/core/utils/utilities';
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
   * Gets the registered layer paths based on the registered layers.
   *
   * @returns An array of layer paths
   */
  getRegisteredLayerPaths(): string[] {
    return this.#registeredLayers.map((layer) => layer.getLayerPath());
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
   *
   * @param layer - The layer to register
   */
  async registerLayer(layer: AbstractBaseGVLayer): Promise<void> {
    // If the layer is already registered, skip it, we don't register twice
    if (this.getRegisteredLayerPaths().includes(layer.getLayerPath())) return;

    // Wait a maximum of 20 seconds for the layer to get to loaded state so that it can get registered, otherwise another attempt will have to be made
    // This await is important when devs call this method directly to register ad-hoc layers.
    await whenThisThen(() => layer.getLayerStatus() === 'loaded', 20000);

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
   * @param abortController - Optional abort controller
   * @returns A promise that resolves with the query results
   */
  protected queryLayerFeatures(
    geoviewLayer: AbstractGVLayer,
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry: boolean = true,
    abortController?: AbortController
  ): Promise<TypeFeatureInfoResult> {
    // If the layer is invisible (or any of its parent(s) is invisible)
    if (!geoviewLayer.getVisibleIncludingParents()) return Promise.resolve({ results: [] });

    // If is not in visible range
    if (!geoviewLayer.getInVisibleRange(this.mapViewer.getView().getZoom())) return Promise.resolve({ results: [] });

    // Get Feature Info
    return geoviewLayer.getFeatureInfo(this.mapViewer.map, queryType, location, queryGeometry, abortController);
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
   * @param layerConfig - The configuration object for the layer
   * @param event - The layer status change event
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, event: LayerStatusChangedEvent): void {
    try {
      // If the layer status is 'loaded', otherwise, don't even try yet
      if (event.layerStatus === 'loaded') {
        // The layer has become loaded
        layerConfig.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

        // Get the layer
        const layer = this.layerDomain.getGeoviewLayer(layerConfig.layerPath);

        // Register the layer itself (not the layer config) automatically in the layer set
        this.registerLayer(layer).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('in registerLayer in #handleLayerStatusChanged', error);
        });
      }
    } catch (error: unknown) {
      // Error happened when trying to register the layer coming from the layer config
      logger.logError('Error trying to register the layer coming from the layer config', error);
    }
  }

  // #endregion PRIVATE METHODS

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
          const outfield = outfields.find((f) => f.name === fieldName || f.alias === fieldName);

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
