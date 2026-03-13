import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type {
  QueryType,
  TypeFeatureInfoEntry,
  TypeFeatureInfoResult,
  TypeLocation,
  TypeResultSet,
  TypeResultSetEntry,
} from '@/api/types/map-schema-types';
import { generateId, whenThisThen } from '@/core/utils/utilities';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { LayerApi } from '@/geo/layer/layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { logger } from '@/core/utils/logger';

/**
 * A class to hold a set of layers associated with a value of any type.
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 * @class AbstractLayerSet
 * @exports
 */
export abstract class AbstractLayerSet {
  /** The LayerApi to work with */
  protected layerApi: LayerApi;

  /** An object containing the result sets indexed using the layer path */
  resultSet: TypeResultSet = {};

  /** Indicates the default when registering a layer config */
  // GV: Only the LegendsLayerSet registers the layer configs to track the 'boxes' in the UI.
  // GV: The other layer sets register the layer OBJECTS instead of the layer CONFIGS.
  #defaultRegisterLayerConfigCheck = false;

  // The registered layers
  #registeredLayers: AbstractBaseGVLayer[] = [];

  /** Keep all callback delegates references */
  #onLayerSetUpdatedHandlers: LayerSetUpdatedDelegate[] = [];

  /**
   * Constructs a new LayerSet instance.
   * @param {LayerApi} layerApi - The LayerApi instance to work with.
   */
  constructor(layerApi: LayerApi) {
    this.layerApi = layerApi;
  }

  // #region OVERRIDES

  /**
   * A must-override method called to propagate the result set entry to the store
   * @param {TypeResultSetEntry} resultSetEntry - The result set entry to propagate
   * @param {PropagationType} type - The propagation type
   * @returns {void}
   * @protected
   */
  protected abstract onPropagateToStore(resultSetEntry: TypeResultSetEntry, type: PropagationType): void;

  /**
   * A must-override method called to delete a result set entry from the store
   * @param {string} layerPath - The layer path to delete from store
   * @returns {void}
   * @protected
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
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Override this to perform additional registrations
  }

  /**
   * An overridable unregistration function for a layer-set that the registration process will use to
   * unregister a specific layer config.
   * @param {ConfigBaseClass | undefined} layerConfig - The layer config
   * @returns {void}
   * @protected
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void {
    // Override this to perform additional unregistrations
  }

  /**
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
   * @param {AbstractBaseGVLayer} layer - The layer
   * @returns {boolean} True if the layer should be registered, false otherwise
   * @protected
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
   * @param {AbstractBaseGVLayer} layer - The layer config
   * @returns {void}
   * @protected
   */
  protected onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Get layer name
    const layerPath = layer.getLayerPath();

    // If not there (wasn't pre-registered via a config-registration)
    if (!(layerPath in this.resultSet)) {
      this.resultSet[layerPath] = {
        layerPath,
      };
    }

    // Add to the registered layers array
    this.#registeredLayers.push(layer);
  }

  /**
   * An overridable layer set updated function for a layer-set to indicate the layer set has been updated.
   * @param {string} layerPath - The layer path
   * @returns {void}
   * @protected
   */
  protected onLayerSetUpdatedProcess(layerPath: string): void {
    // Emit layer set updated event to the outside
    this.#emitLayerSetUpdated({ layerPath, resultSet: this.resultSet });
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * A quick getter to help identify which layerset class the current instance is coming from.
   */
  getClassName(): string {
    // Return the name of the class
    return this.constructor.name;
  }

  /**
   * Gets the registered layer paths based on the registered layers
   * @returns {string[]} An array of layer paths
   */
  getRegisteredLayerPaths(): string[] {
    return this.#registeredLayers.map((layer) => layer.getLayerPath());
  }

  /**
   * Registers the layer config in the layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  registerLayerConfig(layerConfig: ConfigBaseClass): void {
    // Update the registration of all layer sets if !payload.layerSetId or update only the specified layer set
    if (this.onRegisterLayerConfigCheck(layerConfig) && !(layerConfig.layerPath in this.resultSet)) {
      // Prep the resultSet (it's registered, but it doesn't mean it's in the store yet)
      this.resultSet[layerConfig.layerPath] = {
        layerPath: layerConfig.layerPath,
      };

      // Call the registration function for the layer-set. This method is different for each child.
      this.onRegisterLayerConfig(layerConfig);

      // Call for propagation to the store upon registration
      this.onPropagateToStore(this.resultSet[layerConfig.layerPath], 'config-registration');

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerConfig.layerPath);
    }

    // Prepare the config for its layer registration later
    this.#prepareConfigForLayerRegistration(layerConfig);
  }

  /**
   * Registers the layer in the layer-set.
   * If the layer is already registered, the function returns immediately.
   * @param {AbstractBaseGVLayer} layer - The layer to register
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

      // Call for propagation to the store upon registration
      this.onPropagateToStore(this.resultSet[layer.getLayerPath()], 'layer-registration');

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layer.getLayerPath());
    }
  }

  /**
   * Unregisters the layer config and layer from the layer-set.
   * @param {string} layerPath - The layer path
   */
  unregister(layerPath: string): void {
    // Call the unregistration function for the layer-set. This method is different for each child.
    this.onUnregisterLayerConfig(this.layerApi.getLayerEntryConfigIfExists(layerPath));

    // Delete from the store
    this.onDeleteFromStore(layerPath);

    // Delete the result set for the layer path
    delete this.resultSet[layerPath];

    // Remove layer from registered layers
    this.#registeredLayers = this.#registeredLayers.filter((layer) => layer.getLayerPath() !== layerPath);

    // Inform that the layer set has been updated
    this.onLayerSetUpdatedProcess(layerPath);
  }

  // #endregion PUBLIC METHODS

  // #region PROTECTED METHODS

  /**
   * Gets the MapId for the layer set
   * @returns
   */
  protected getMapId(): string {
    return this.layerApi.getMapId();
  }

  /**
   * Processes layer data to query features on it, if the layer path can be queried.
   * @param {AbstractGVLayer} geoviewLayer - The geoview layer
   * @param {QueryType} queryType - The query type
   * @param {TypeLocation} location - The location for the query
   * @param {boolean} queryGeometry - The query geometry boolean
   * @param {AbortController?} [abortController] - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoResult>} A promise resolving to the query results
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
    if (!geoviewLayer.getInVisibleRange(this.layerApi.mapViewer.getView().getZoom())) return Promise.resolve({ results: [] });

    // Get Feature Info
    return geoviewLayer.getFeatureInfo(this.layerApi.mapViewer.map, queryType, location, queryGeometry, abortController);
  }

  // #endregion PROTECTED METHODS

  // #region PRIVATE METHODS

  /**
   * Prepares a layer configuration for automatic registration once the layer becomes loaded.
   * This method sets up a listener on the provided layer configuration that monitors its status.
   * When the layer's status changes to `loaded`, it attempts to retrieve the corresponding layer
   * from the layer API and registers it into the system's layer set. If registration fails, errors
   * are logged appropriately.
   * @param {ConfigBaseClass} layerConfig - The configuration object for the layer to be monitored.
   * @private
   */
  #prepareConfigForLayerRegistration(layerConfig: ConfigBaseClass): void {
    // Listen to the status changes so that when it gets loaded it automatically gets registered as a layer
    layerConfig.onLayerStatusChanged(() => {
      try {
        // If the layer status is 'loaded', otherwise, don't even try yet
        if (layerConfig.layerStatus === 'loaded') {
          // The layer has become loaded

          // Get the layer (not just the config) if it exists yet
          const layer = this.layerApi.getGeoviewLayerIfExists(layerConfig.layerPath);

          // If the layer could be found
          if (layer) {
            // Register the layer itself (not the layer config) automatically in the layer set
            this.registerLayer(layer).catch((error: unknown) => {
              // Log
              logger.logPromiseFailed('in registerLayer in registerLayerConfig', error);
            });
          }
        }
      } catch (error: unknown) {
        // Error happened when trying to register the layer coming from the layer config
        logger.logError('Error trying to register the layer coming from the layer config', error);
      }
    });
  }

  // #endregion PRIVATE METHODS

  // #region STATIC METHODS

  /**
   * Checks if the layer is of queryable type based on its class definition
   * @param {AbstractBaseGVLayer} layer - The layer
   * @returns True if the layer is of queryable type
   */
  protected static isQueryableType(layer: AbstractBaseGVLayer): boolean {
    return layer instanceof AbstractGVVector || layer instanceof GVEsriDynamic || layer instanceof GVWMS || layer instanceof GVEsriImage;
  }

  /**
   * Checks if the layer config source is queryable.
   * @param {AbstractBaseGVLayer} layer - The layer
   * @returns {boolean} True if the source is queryable or undefined
   */
  protected static isSourceQueryable(layer: AbstractBaseGVLayer): boolean {
    // Cast
    const layerConfigCasted = layer.getLayerConfig() as AbstractBaseLayerEntryConfig;

    // Get if the source is queryable
    return layerConfigCasted.getQueryableSourceDefaulted();
  }

  /**
   * Align records with informatiom provided by OutFields from layer config.
   * This will update fields in and delete unwanted fields from the arrayOfRecords
   * @param {AbstractBaseLayerEntryConfig} layerEntryConfig - The layer entry config object.
   * @param {TypeFeatureInfoEntry[]} arrayOfRecords - Features to delete fields from.
   * @static
   * @protected
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
   * @param {AbstractBaseLayerEntryConfig} layerConfig
   *   The layer configuration used to determine whether special WMS handling applies.
   * @param {TypeFeatureInfoEntry[]} arrayOfRecords
   *   The retrieved feature info entries representing attributes or raw text content.
   * @returns {boolean}
   *   `true` if the feature info records contain real attribute fields;
   *   `false` if they consist only of fallback HTML or plain-text content.
   * @static
   * @protected
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

  // #region EVENTS

  /**
   * Emits an event to all registered handlers.
   * @param {LayerSetUpdatedEvent} event - The event to emit
   * @private
   */
  #emitLayerSetUpdated(event: LayerSetUpdatedEvent): void {
    // Emit the layersetupdated event
    EventHelper.emitEvent(this, this.#onLayerSetUpdatedHandlers, event);
  }

  /**
   * Registers a callback to be executed whenever the layer set is updated.
   * @param {LayerSetUpdatedDelegate} callback - The callback function
   */
  onLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    // Register the layersetupdated event callback
    EventHelper.onEvent(this.#onLayerSetUpdatedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer set is updated.
   * @param {LayerSetUpdatedDelegate} callback - The callback function to unregister
   */
  offLayerSetUpdated(callback: LayerSetUpdatedDelegate): void {
    // Unregister the layersetupdated event callback
    EventHelper.offEvent(this.#onLayerSetUpdatedHandlers, callback);
  }

  // #endregion EVENTS
}

/** The propagation type, notably for the store */
export type PropagationType = 'config-registration' | 'layer-registration' | 'layerStatus' | 'layerName';

/**
 * Define a delegate for the event handler function signature
 */
type LayerSetUpdatedDelegate = EventDelegateBase<AbstractLayerSet, LayerSetUpdatedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerSetUpdatedEvent = {
  layerPath: string;
  resultSet: TypeResultSet;
};
