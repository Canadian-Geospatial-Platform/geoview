import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import {
  QueryType,
  TypeFeatureInfoEntry,
  TypeLayerStatus,
  TypeLocation,
  TypeResultSet,
  TypeResultSetEntry,
} from '@/geo/map/map-schema-types';
import { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { TypeFeatureInfoResultSetEntry, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { AbstractGeoViewLayer, LayerNameChangedEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { getLocalizedValue, whenThisThen } from '@/core/utils/utilities';
import { ConfigBaseClass, LayerStatusChangedEvent } from '@/core/utils/config/validation-classes/config-base-class';
import { LayerApi } from '@/geo/layer/layer';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { AbstractGVLayer } from '../gv-layers/abstract-gv-layer';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EsriDynamic } from '../geoview-layers/raster/esri-dynamic';
import { AbstractGeoViewVector } from '../geoview-layers/vector/abstract-geoview-vector';
import { WMS } from '../geoview-layers/raster/wms';
import { GVEsriDynamic } from '../gv-layers/raster/gv-esri-dynamic';
import { AbstractGVVector } from '../gv-layers/vector/abstract-gv-vector';
import { GVWMS } from '../gv-layers/raster/gv-wms';
import { AbstractBaseLayer } from '../gv-layers/abstract-base-layer';
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

  // Keep a bounded reference to the handle layer status changed
  #boundHandleLayerStatusChanged: (config: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent) => void;

  // Keep a bounded reference to the handle layer status changed
  #boundHandleLayerNameChanged: (layer: AbstractGeoViewLayer | AbstractBaseLayer, layerNameEvent: LayerNameChangedEvent) => void;

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
          const layer = this.layerApi.getGeoviewLayerHybrid(layerConfig.layerPath);

          // If the layer could be found
          if (layer) {
            // Register the layer automatically in the layer set
            this.registerLayer(layer, layerConfig.layerPath).catch((error) => {
              // Log
              logger.logPromiseFailed('in registerLayer in registerLayerConfig', error);
            });
          }
        }
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
      layerName: getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(this.getMapId()))!,
    };

    // Register the layer status changed handler
    layerConfig.onLayerStatusChanged(this.#boundHandleLayerStatusChanged);
  }

  /**
   * Registers the layer in the layer-set.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   */
  async registerLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): Promise<void> {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done

    // Wait a maximum of 20 seconds for the layer to get to loaded state so that it can get registered, otherwise another attempt will have to be made
    // This await is important when devs call this method directly to register ad-hoc layers.
    await whenThisThen(() => layer.getLayerConfig(layerPath)?.layerStatus === 'loaded', 20000);

    // If the layer is already registered, skip it, we don't register twice
    if (this.#registeredLayerLayerPaths.includes(layerPath)) return;

    // Update the registration of all layer sets
    if (this.onRegisterLayerCheck(layer, layerPath)) {
      // Call the registration function for the layer-set. This method is different for each child.
      this.onRegisterLayer(layer, layerPath);

      // Call for propagation to the store upon registration
      this.onPropagateToStore(this.resultSet[layerPath], 'layer-registration');

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerPath);
    }
  }

  /**
   * An overridable registration condition function for a layer-set to check if the registration
   * should happen for a specific geoview layer and layer path. By default, a layer-set always registers layers except when they are group layers.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @returns {boolean} True if the layer should be registered, false otherwise
   */
  // Added eslint-disable here, because we do want to override this method in children and keep 'this'.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/class-methods-use-this
  protected onRegisterLayerCheck(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Override this function to perform registration condition logic in the inherited classes
    // By default, a layer-set always registers layers except when they are group layers
    if (this.layerApi.getGeoviewLayerHybrid(layerPath)?.getLayerConfig(layerPath)?.entryType === 'group') {
      // Skip groups
      return false;
    }

    // Default
    return true;
  }

  /**
   * An overridable registration function for a layer-set that the registration process will use to
   * create a new entry in the layer set for a specific geoview layer and layer path.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer config
   */
  protected onRegisterLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done

    // Get layer name
    const layerName = getLocalizedValue(layer.getLayerName(layerPath), AppEventProcessor.getDisplayLanguage(this.getMapId()))!;

    // If not there (wasn't pre-registered via a config-registration)
    if (!(layerPath in this.resultSet)) {
      this.resultSet[layerPath] = {
        layerPath,
        layerStatus: layer.getLayerConfig(layerPath)!.layerStatus,
        layerName,
      };
    } else {
      // Already there, update it
      this.resultSet[layerPath].layerStatus = layer.getLayerConfig(layerPath)!.layerStatus;
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
    this.onUnregisterLayer(this.layerApi.getGeoviewLayerHybrid(layerPath));

    // Delete from the store
    this.onDeleteFromStore(layerPath);

    // Delete the result set for the layer path
    delete this.resultSet[layerPath];

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
   * @param {AbstractGeoViewLayer | AbstractBaseLayer | undefined} layer - The layer
   */
  protected onUnregisterLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer | undefined): void {
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
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @param {LayerNameChangedEvent} layerNameEvent - The new layer name
   */
  #handleLayerNameChanged(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerNameEvent: LayerNameChangedEvent): void {
    try {
      // If the layer path exists for the layer name that changed
      if (this.resultSet[layerNameEvent.layerPath]) {
        // Call the overridable function to process a layer name change
        this.onProcessNameChanged(
          layerNameEvent.layerPath,
          getLocalizedValue(layerNameEvent.layerName, AppEventProcessor.getDisplayLanguage(this.getMapId()))!
        );

        // Propagate to the store
        this.onPropagateToStore(this.resultSet[layerNameEvent.layerPath], 'layerName');

        // Inform that the layer set has been updated
        this.onLayerSetUpdatedProcess(layerNameEvent.layerPath);
      }
    } catch (error) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', layerNameEvent.layerPath, error);
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
    this.resultSet[layerConfig.layerPath].layerName = getLocalizedValue(
      layerConfig.layerName || layerConfig.geoviewLayerConfig.geoviewLayerName,
      AppEventProcessor.getDisplayLanguage(this.getMapId())
    )!;
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
   * @param {AbstractGeoViewLayer | AbstractGVLayer} geoviewLayer - The geoview layer
   * @param {QueryType} queryType - The query type
   * @param {TypeLocation} location - The location for the query
   * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} A promise resolving to the query results
   */
  protected static queryLayerFeatures(
    data: TypeFeatureInfoResultSetEntry | TypeAllFeatureInfoResultSetEntry | TypeHoverResultSetEntry,
    geoviewLayer: AbstractGeoViewLayer | AbstractGVLayer,
    queryType: QueryType,
    location: TypeLocation
  ): Promise<TypeFeatureInfoEntry[] | undefined | null> {
    // Get Feature Info
    return geoviewLayer.getFeatureInfo(queryType, data.layerPath, location);
  }

  /**
   * Checks if the layer is of queryable type based on its class definition
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @returns True if the layer is of queryable type
   */
  protected static isQueryableType(layer: AbstractGeoViewLayer | AbstractBaseLayer): boolean {
    return (
      layer instanceof AbstractGeoViewVector ||
      layer instanceof AbstractGVVector ||
      layer instanceof EsriDynamic ||
      layer instanceof GVEsriDynamic ||
      layer instanceof WMS ||
      layer instanceof GVWMS
    );
  }

  /**
   * Checks if the layer config source is queryable.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @returns {boolean} True if the source is queryable or undefined
   */
  protected static isSourceQueryable(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    return !((layer.getLayerConfig(layerPath) as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable === false);
  }

  /**
   * Checks if the layer config state is queryable.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @returns {boolean} True if the state is queryable or undefined
   */
  protected static isStateQueryable(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Return false when it's clearly false, otherwise, return true
    return !((layer.getLayerConfig(layerPath) as AbstractBaseLayerEntryConfig)?.initialSettings?.states?.queryable === false);
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

// TODO: Move the definition of the domain in the new schema
// TODO.CONT: Starting here vvvv
// TODO.CONT: Not anymore. Types were moved, below is event stuff and good here (leaving the TODO here in case it's meant as reference for migration).

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
