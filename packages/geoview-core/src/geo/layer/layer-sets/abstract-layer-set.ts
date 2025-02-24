import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  QueryType,
  TypeFeatureInfoEntry,
  TypeFeatureInfoLayerConfig,
  TypeLayerEntryConfig,
  TypeLayerStatus,
  TypeLocation,
  TypeResultSet,
  TypeResultSetEntry,
} from '@/geo/map/map-schema-types';
import { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { TypeFeatureInfoResultSetEntry, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { generateId, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass, LayerStatusChangedEvent } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { LayerApi } from '@/geo/layer/layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { AbstractBaseLayer, LayerNameChangedEvent } from '@/geo/layer/gv-layers/abstract-base-layer';
import { logger } from '@/core/utils/logger';

/**
 * A class to hold a set of layers associated with a value of any type.
 * Layers are added/removed to the layer-set via the registerOrUnregisterLayer function.
 * @class LayerSet
 * @exports
 */
export abstract class AbstractLayerSet {
  /** The LayerApi to work with */
  protected layerApi: LayerApi;

  /** An object containing the result sets indexed using the layer path */
  resultSet: TypeResultSet = {};

  /** Indicates the default when registering a layer config */
  #defaultRegisterLayerConfigCheck = false;

  // The registered layers
  // TODO: Refactor - Layers refactoring. Replace this array of string to array of GVLayer object instead (and rename attribute) once hybrid work is done
  #registeredLayerLayerPaths: string[] = [];

  // Keep all callback delegates references
  #onLayerSetUpdatedHandlers: LayerSetUpdatedDelegate[] = [];

  // Keep all callback delegates references
  #onLayerStatusUpdatedHandlers: LayerStatusUpdatedDelegate[] = [];

  // Keep a bounded reference to the handle layer status changed
  #boundHandleLayerStatusChanged: (config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => void;

  // Keep a bounded reference to the handle layer status changed
  #boundHandleLayerNameChanged: (layer: AbstractBaseLayer, layerNameEvent: LayerNameChangedEvent) => void;

  /**
   * Constructs a new LayerSet instance.
   * @param {LayerApi} layerApi - The LayerApi instance to work with.
   */
  constructor(layerApi: LayerApi) {
    this.layerApi = layerApi;
    this.#boundHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundHandleLayerNameChanged = this.#handleLayerNameChanged.bind(this);
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

  // Shortcut to get the map id
  protected getMapId(): string {
    return this.layerApi.getMapId();
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

  #prepareConfigForLayerRegistration(layerConfig: ConfigBaseClass): void {
    // Listen to the status changes so that when it gets loaded it automatically gets registered as a layer
    layerConfig.onLayerStatusChanged(() => {
      try {
        // If the layer status is 'loaded'
        if (layerConfig.layerStatus === 'loaded') {
          // The layer has become loaded

          // GV Take this opportunity to verify if the layer had a parent (this code used to be inside ConfigBaseClass,
          // GV but it turns out parentLayerConfig couldn't be trusted when navigating the object hierarchy - see note over there)
          // GV cgpv.api.maps['sandboxMap'].layer.getLayerEntryConfig('uniqueValueId/uniqueValueId/4').layerStatus
          // GV vs cgpv.api.maps['sandboxMap'].layer.getLayerEntryConfig('uniqueValueId/uniqueValueId/4').parentLayerConfig.listOfLayerEntryConfig[0].layerStatus

          // If the config has a parent
          if (layerConfig.parentLayerConfig) {
            // Get all the siblings reusing the LayerApi which is more trustable than the parent hierarchy on the config themselves
            const layerConfigSiblings = layerConfig.parentLayerConfig.listOfLayerEntryConfig
              .map((layerConf) => {
                return this.layerApi.getLayerEntryConfig(layerConf.layerPath);
              })
              .filter((layerConf) => layerConf) as ConfigBaseClass[];

            // If all siblings of the layer config are loaded
            if (ConfigBaseClass.allLayerStatusAreGreaterThanOrEqualTo('loaded', layerConfigSiblings)) {
              // Get the parent, again using the LayerApi, can't trust the 'parentLayerConfig'
              const parentConfig = this.layerApi.getLayerEntryConfig(layerConfig.parentLayerConfig.layerPath);
              // If found, this parent can be flagged as loaded
              if (parentConfig) parentConfig.layerStatus = 'loaded';
            }
          }

          // Get the layer
          const layer = this.layerApi.getGeoviewLayer(layerConfig.layerPath);

          // If the layer could be found
          if (layer) {
            // Register the layer itself (not the layer config) automatically in the layer set
            this.registerLayer(layer).catch((error) => {
              // Log
              logger.logPromiseFailed('in registerLayer in registerLayerConfig', error);
            });
          }
        }

        // Emit that the layerConfig got their status changed
        this.#emitLayerStatusUpdated({ layer: layerConfig });
      } catch (error) {
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
    // By default, a layer-set doesn't register layer configs
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
      layerName: layerConfig.layerName!,
    };

    // Register the layer status changed handler
    layerConfig.onLayerStatusChanged(this.#boundHandleLayerStatusChanged);
  }

  /**
   * Registers the layer in the layer-set.
   * @param {AbstractBaseLayer} layer - The layer
   */
  async registerLayer(layer: AbstractBaseLayer): Promise<void> {
    // Wait a maximum of 20 seconds for the layer to get to loaded state so that it can get registered, otherwise another attempt will have to be made
    // This await is important when devs call this method directly to register ad-hoc layers.
    await whenThisThen(() => layer.getLayerStatus() === 'loaded', 20000);

    // If the layer is already registered, skip it, we don't register twice
    if (this.#registeredLayerLayerPaths.includes(layer.getLayerPath())) return;

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set always registers layers except when they are group layers
    if (layer.getLayerConfig()?.entryType === 'group') {
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
    const layerName = layer.getLayerName()!;
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
    this.#registeredLayerLayerPaths.push(layerPath);

    // Register the layer name changed handler
    layer.onLayerNameChanged(this.#boundHandleLayerNameChanged);
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

    // Remove layer path from registered layer paths
    this.#registeredLayerLayerPaths = this.#registeredLayerLayerPaths.filter((registeredLayer) => registeredLayer !== layerPath);

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
    layerConfig?.offLayerStatusChanged(this.#boundHandleLayerStatusChanged);
  }

  /**
   * An overridable unregistration function for a layer-set that the registration process will use to
   * unregister a specific geoview layer.
   * @param {AbstractBaseLayer | undefined} layer - The layer
   */
  protected onUnregisterLayer(layer: AbstractBaseLayer | undefined): void {
    // Unregister the layer name changed handler
    layer?.offLayerNameChanged(this.#boundHandleLayerNameChanged);
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
        // Propagate to the store
        this.onPropagateToStore(this.resultSet[layerConfig.layerPath], 'layerStatus');
      }

      // Emit the layer set updated changed event
      this.onLayerSetUpdatedProcess(layerConfig.layerPath);
    } catch (error) {
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
    } catch (error) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', layerPath, error);
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
    this.resultSet[layerConfig.layerPath].layerName = layerConfig.layerName || layerConfig.geoviewLayerConfig.geoviewLayerName!;
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
   * @param {TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry} data - The layer data
   * @param {AbstractGVLayer} geoviewLayer - The geoview layer
   * @param {QueryType} queryType - The query type
   * @param {TypeLocation} location - The location for the query
   * @param {boolean} queryGeometry - The query geometry boolean
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise resolving to the query results
   */
  protected static queryLayerFeatures(
    data: TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry,
    geoviewLayer: AbstractGVLayer,
    queryType: QueryType,
    location: TypeLocation,
    queryGeometry: boolean = true
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Get Feature Info
    return geoviewLayer.getFeatureInfo(queryType, location, queryGeometry);
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
   * Checks if the layer config state is queryable.
   * @param {AbstractBaseLayer} layer - The layer
   * @returns {boolean} True if the state is queryable or undefined
   */
  protected static isStateQueryable(layer: AbstractBaseLayer): boolean {
    // Return false when it's clearly false, otherwise, return true
    return !((layer.getLayerConfig() as AbstractBaseLayerEntryConfig)?.initialSettings?.states?.queryable === false);
  }

  /**
   * Checks if the layer is in visible range.
   * @param {AbstractGVLayer} layer - The layer
   * @returns {boolean} True if the state is queryable or undefined
   */
  protected static isInVisibleRange(layer: AbstractGVLayer): boolean {
    // Return false when false or undefined
    return layer.getInVisibleRange() ?? false;
  }

  /**
   * Align records with informatiom provided by OutFields from layer config.
   * This will update fields in and delete unwanted fields from the arrayOfRecords
   * @param {TypeLayerEntryConfig} layerPath - Path of the layer to get config from.
   * @param {TypeFeatureInfoEntry[]} arrayOfRecords - Features to delete fields from.
   * @protected
   * @static
   */
  protected static alignRecordsWithOutFields(layerEntryConfig: TypeLayerEntryConfig, arrayOfRecords: TypeFeatureInfoEntry[]): void {
    // If source featureInfo is provided, continue
    if (layerEntryConfig.source && layerEntryConfig.source.featureInfo) {
      const sourceFeatureInfo = layerEntryConfig.source!.featureInfo as TypeFeatureInfoLayerConfig;

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
              record.fieldInfo[fieldName]!.alias = outFields![fieldIndex].alias;
              record.fieldInfo[fieldName]!.dataType = outFields![fieldIndex].type;
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

  /**
   * Emits an event to all registered handlers.
   * @param {LayerStatusUpdatedEvent} event - The event to emit
   * @private
   */
  #emitLayerStatusUpdated(event: LayerStatusUpdatedEvent): void {
    // Emit the layersetupdated event
    EventHelper.emitEvent(this, this.#onLayerStatusUpdatedHandlers, event);
  }

  /**
   * Registers a callback to be executed whenever the layer status is updated.
   * @param {LayerStatusUpdatedDelegate} callback - The callback function
   */
  onLayerStatusUpdated(callback: LayerStatusUpdatedDelegate): void {
    // Register the layersetupdated event callback
    EventHelper.onEvent(this.#onLayerStatusUpdatedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer status is updated.
   * @param {LayerStatusUpdatedDelegate} callback - The callback function to unregister
   */
  offLayerStatusUpdated(callback: LayerStatusUpdatedDelegate): void {
    // Unregister the layersetupdated event callback
    EventHelper.offEvent(this.#onLayerStatusUpdatedHandlers, callback);
  }
}

// TODO: Rename this type to something like 'store-container-type' as it is now mostly used to indicate in which store to propagate the result set
// TO.DOCONT: Be mindful if you rename the eventType property in the event payload to the outside! Because lots of templates expect an 'eventType' in the payload.
// TO.DOCONT: Ideally, get rid of it completely. The templates should be self aware of the layer-set that responded to their request now.
export type EventType = 'click' | 'hover' | 'all-features' | 'name';

export type PropagationType = 'config-registration' | 'layer-registration' | 'layerStatus' | 'layerName';

// TODO: Move the definition of the domain in the new schema
// TO.DOCONT: Starting here vvvv
// TO.DOCONT: Not anymore. Types were moved, below is event stuff and good here (leaving the TODO here in case it's meant as reference for migration).

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

/**
 * Define a delegate for the event handler function signature
 */
type LayerStatusUpdatedDelegate = EventDelegateBase<AbstractLayerSet, LayerStatusUpdatedEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerStatusUpdatedEvent = {
  layer: ConfigBaseClass;
};
