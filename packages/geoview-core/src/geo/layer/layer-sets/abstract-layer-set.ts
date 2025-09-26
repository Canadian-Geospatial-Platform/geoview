import { Map as OLMap } from 'ol';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { QueryType, TypeFeatureInfoEntry, TypeLocation, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { TypeLayerStatus } from '@/api/types/layer-schema-types';
import { generateId, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass, LayerStatusChangedDelegate, LayerStatusChangedEvent } from '@/api/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { LayerApi } from '@/geo/layer/layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { AbstractBaseLayer, LayerNameChangedDelegate, LayerNameChangedEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
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
  #registeredLayers: AbstractBaseLayer[] = [];

  /** Keep all callback delegates references */
  #onLayerSetUpdatedHandlers: LayerSetUpdatedDelegate[] = [];

  // Keep a bounded reference to the handle layer status changed
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  // Keep a bounded reference to the handle layer status changed
  #boundedHandleLayerNameChanged: LayerNameChangedDelegate;

  /**
   * Constructs a new LayerSet instance.
   * @param {LayerApi} layerApi - The LayerApi instance to work with.
   */
  constructor(layerApi: LayerApi) {
    this.layerApi = layerApi;
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundedHandleLayerNameChanged = this.#handleLayerNameChanged.bind(this);
  }

  /**
   * A quick getter to help identify which layerset class the current instance is coming from.
   */
  public getClassName(): string {
    // Return the name of the class
    return this.constructor.name;
  }

  /**
   * A must-override method called to propagate the result set entry to the store
   * @param {TypeResultSetEntry} resultSetEntry - The result set entry to propagate
   */
  protected abstract onPropagateToStore(resultSetEntry: TypeResultSetEntry, type: PropagationType): void;

  /**
   * A must-override method called to delete a result set entry from the store
   * @param {string} layerPath - The layer path to delete from store
   */
  protected abstract onDeleteFromStore(layerPath: string): void;

  /**
   * Gets the MapId for the layer set
   * @returns
   */
  protected getMapId(): string {
    return this.layerApi.getMapId();
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
        // If the layer status is 'loaded'
        if (layerConfig.layerStatus === 'loaded') {
          // The layer has become loaded

          // Get the layer
          const layer = this.layerApi.getGeoviewLayer(layerConfig.layerPath);

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

  /**
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @returns {boolean} True if the layer config should be registered, false otherwise
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
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected onRegisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Prep the resultSet (it's registered, but it doesn't mean it's in the store yet)
    this.resultSet[layerConfig.layerPath] = {
      layerPath: layerConfig.layerPath,
      layerStatus: layerConfig.layerStatus,
      layerName: layerConfig.getLayerNameCascade(),
    };

    // Register the layer status changed handler
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);
  }

  /**
   * Registers the layer in the layer-set.
   * If the layer is already registered, the function returns immediately.
   * @param {AbstractBaseLayer} layer - The layer to register
   */
  async registerLayer(layer: AbstractBaseLayer): Promise<void> {
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
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
   * @param {AbstractBaseLayer} layer - The layer
   * @returns {boolean} True if the layer should be registered, false otherwise
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set always registers layers except when they are group layers
    if (layer.getLayerConfig()?.getEntryTypeIsGroup()) {
      // Skip groups
      return false;
    }

    // Default
    return true;
  }

  /**
   * An overridable registration function for a layer-set that the registration process will use to
   * create a new entry in the layer set for a specific geoview layer and layer path.
   * @param {AbstractBaseLayer} layer - The layer config
   */
  protected onRegisterLayer(layer: AbstractBaseLayer): void {
    // Get layer name
    const layerName = layer.getLayerName();
    const layerPath = layer.getLayerPath();

    // If not there (wasn't pre-registered via a config-registration)
    if (!(layerPath in this.resultSet)) {
      this.resultSet[layerPath] = {
        layerPath,
        layerStatus: layer.getLayerStatus(),
        layerName,
      };
    } else {
      // Already there, update it
      this.resultSet[layerPath].layerStatus = layer.getLayerStatus();
      this.resultSet[layerPath].layerName = layerName;
    }

    // Add to the registered layers array
    this.#registeredLayers.push(layer);

    // Register the layer name changed handler
    layer.onLayerNameChanged(this.#boundedHandleLayerNameChanged);
  }

  /**
   * Unregisters the layer config and layer from the layer-set.
   * @param {string} layerPath - The layer path
   */
  unregister(layerPath: string): void {
    // Call the unregistration function for the layer-set. This method is different for each child.
    this.onUnregisterLayerConfig(this.layerApi.getLayerEntryConfig(layerPath));

    // Call the unregistration function for the layer-set. This method is different for each child.
    this.onUnregisterLayer(this.layerApi.getGeoviewLayer(layerPath));

    // Delete from the store
    this.onDeleteFromStore(layerPath);

    // Delete the result set for the layer path
    delete this.resultSet[layerPath];

    // Remove layer from registered layers
    this.#registeredLayers = this.#registeredLayers.filter((layer) => layer.getLayerPath() !== layerPath);

    // Inform that the layer set has been updated
    this.onLayerSetUpdatedProcess(layerPath);
  }

  /**
   * An overridable unregistration function for a layer-set that the registration process will use to
   * unregister a specific layer config.
   * @param {ConfigBaseClass | undefined} layerConfig - The layer config
   */
  protected onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void {
    // Unregister the layer status changed handler
    layerConfig?.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);
  }

  /**
   * An overridable unregistration function for a layer-set that the registration process will use to
   * unregister a specific geoview layer.
   * @param {AbstractBaseLayer | undefined} layer - The layer
   */
  protected onUnregisterLayer(layer: AbstractBaseLayer | undefined): void {
    // Unregister the layer name changed handler
    layer?.offLayerNameChanged(this.#boundedHandleLayerNameChanged);
  }

  /**
   * Handles when a layer status changed on a layer config.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {LayerStatusChangedEvent} layerStatusEvent - The new layer status
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent): void {
    try {
      // Call the overridable function to process a layer status is changing
      this.onProcessLayerStatusChanged(layerConfig, layerStatusEvent.layerStatus);

      // If still existing (it's possible a layer set might want to unregister a layer config depending on its status, so we check)
      if (this.resultSet[layerConfig.layerPath]) {
        // Propagate the status to the store so that the UI gets updated
        this.onPropagateToStore(this.resultSet[layerConfig.layerPath], 'layerStatus');
      }

      // Emit the layer set updated changed event
      this.onLayerSetUpdatedProcess(layerConfig.layerPath);
    } catch (error: unknown) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', layerConfig.layerPath, error);
    }
  }

  /**
   * Handles when a layer status changed on a layer config.
   * @param {AbstractBaseLayer} layer - The layer
   * @param {LayerNameChangedEvent} layerNameEvent - The new layer name
   */
  #handleLayerNameChanged(layer: AbstractBaseLayer, layerNameEvent: LayerNameChangedEvent): void {
    const layerPath = layer.getLayerPath();

    try {
      // If the layer path exists for the layer name that changed
      if (this.resultSet[layerPath]) {
        // Call the overridable function to process a layer name change
        this.onProcessNameChanged(layerPath, layerNameEvent.layerName!);

        // Propagate to the store
        this.onPropagateToStore(this.resultSet[layerPath], 'layerName');

        // Inform that the layer set has been updated
        this.onLayerSetUpdatedProcess(layerPath);
      }
    } catch (error: unknown) {
      // Log
      logger.logError('CAUGHT in handleLayerNameChanged', layerPath, error);
    }
  }

  /**
   * An overridable function for a layer-set to process a layer status changed event.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {TypeLayerStatus} layerStatus - The new layer status
   */
  protected onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Change the layer status!
    this.resultSet[layerConfig.layerPath].layerStatus = layerStatus;

    // Update the name with a possibly updated layerName during layer status progression
    // (depending on how this translates in the new layers process, might not need this anymore)
    this.resultSet[layerConfig.layerPath].layerName =
      layerConfig.getLayerName() || layerConfig.getGeoviewLayerName() || 'No name / Sans nom';
  }

  /**
   * An overridable function for a layer-set to process a layer name change.
   * @param {string} layerPath - The layer path being affected
   * @param {string} name - The new layer name
   */
  protected onProcessNameChanged(layerPath: string, name: string): void {
    // Update name
    this.resultSet[layerPath].layerName = name;
  }

  /**
   * An overridable layer set updated function for a layer-set to indicate the layer set has been updated.
   * @param {string} layerPath - The layer path
   */
  protected onLayerSetUpdatedProcess(layerPath: string): void {
    // Emit layer set updated event to the outside
    this.#emitLayerSetUpdated({ layerPath, resultSet: this.resultSet });
  }

  /**
   * Processes layer data to query features on it, if the layer path can be queried.
   * @param {OLMap} map - The Map to query layer features from.
   * @param {AbstractGVLayer} geoviewLayer - The geoview layer
   * @param {QueryType} queryType - The query type
   * @param {TypeLocation} location - The location for the query
   * @param {boolean} queryGeometry - The query geometry boolean
   * @param {AbortController?} abortController - The optional abort controller.
   * @returns {Promise<TypeFeatureInfoEntry[]>} A promise resolving to the query results
   */
  protected static queryLayerFeatures(
    map: OLMap,
    geoviewLayer: AbstractGVLayer,
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry: boolean = true,
    abortController: AbortController | undefined = undefined
  ): Promise<TypeFeatureInfoEntry[]> {
    // Get Feature Info
    return geoviewLayer.getFeatureInfo(map, queryType, location, queryGeometry, abortController);
  }

  /**
   * Checks if the layer is of queryable type based on its class definition
   * @param {AbstractBaseLayer} layer - The layer
   * @returns True if the layer is of queryable type
   */
  protected static isQueryableType(layer: AbstractBaseLayer): boolean {
    return layer instanceof AbstractGVVector || layer instanceof GVEsriDynamic || layer instanceof GVWMS;
  }

  /**
   * Checks if the layer config source is queryable.
   * @param {AbstractBaseLayer} layer - The layer
   * @returns {boolean} True if the source is queryable or undefined
   */
  protected static isSourceQueryable(layer: AbstractBaseLayer): boolean {
    return !((layer.getLayerConfig() as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable === false);
  }

  /**
   * Checks if the layer is in visible range.
   * @param {AbstractGVLayer} layer - The layer
   * @param {number | undefined} currentZoom - The map current zoom level
   * @returns {boolean} True if the state is queryable or undefined
   */
  protected static isInVisibleRange(layer: AbstractGVLayer, currentZoom: number | undefined): boolean {
    // Return false when false or undefined
    return layer.getInVisibleRange(currentZoom);
  }

  /**
   * Align records with informatiom provided by OutFields from layer config.
   * This will update fields in and delete unwanted fields from the arrayOfRecords
   * @param {AbstractBaseLayerEntryConfig} layerEntryConfig - The layer entry config object.
   * @param {TypeFeatureInfoEntry[]} arrayOfRecords - Features to delete fields from.
   * @protected
   * @static
   */
  protected static alignRecordsWithOutFields(layerEntryConfig: AbstractBaseLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): void {
    // If source featureInfo is provided, continue
    if (layerEntryConfig.source && layerEntryConfig.source.featureInfo) {
      const sourceFeatureInfo = layerEntryConfig.source.featureInfo;

      // If outFields is provided, compare record fields with outFields to remove unwanted one
      // If there is no outFields, this will be created in the next function patchMissingMetadataIfNecessary
      if (sourceFeatureInfo.outfields) {
        const outFields = sourceFeatureInfo.outfields;

        // Loop the array of records to delete fields or align fields info for each record
        arrayOfRecords.forEach((recordOriginal) => {
          // Create a copy to avoid the no param reassign ESLint rule
          const record = { ...recordOriginal };
          let fieldKeyCounter = 0;

          const fieldsToDelete = Object.keys(record.fieldInfo).filter((fieldName) => {
            if (outFields.find((outfield) => outfield.name === fieldName)) {
              const fieldIndex = outFields.findIndex((outfield) => outfield.name === fieldName);
              record.fieldInfo[fieldName]!.fieldKey = fieldKeyCounter++;
              record.fieldInfo[fieldName]!.alias = outFields[fieldIndex].alias;
              record.fieldInfo[fieldName]!.dataType = outFields[fieldIndex].type;
              return false; // keep this entry
            }

            return true; // delete this entry
          });

          fieldsToDelete.forEach((entryToDelete) => {
            delete record.fieldInfo[entryToDelete];
          });

          record.fieldInfo.geoviewID = {
            fieldKey: fieldKeyCounter,
            alias: 'geoviewID',
            dataType: 'string',
            value: generateId(),
            domain: null,
          };
        });
      }
    }
  }

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
}

// TODO: Rename this type to something like 'store-container-type' as it is now mostly used to indicate in which store to propagate the result set
// TO.DOCONT: Be mindful if you rename the eventType property in the event payload to the outside! Because lots of templates expect an 'eventType' in the payload.
// TO.DOCONT: Ideally, get rid of it completely. The templates should be self aware of the layer-set that responded to their request now.
export type EventType = 'click' | 'hover' | 'all-features' | 'name';

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
