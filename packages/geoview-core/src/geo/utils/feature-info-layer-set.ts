import { Coordinate } from 'ol/coordinate';
import { EVENT_NAMES } from '@/api/events/event-types';
import { TypeLayerSetChangeLayerStatusPayload, payloadIsAMapMouseEvent } from '@/api/events/payloads';
import { api, LayerApi } from '@/app';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { TypeLayerStatus } from '@/core/types/cgpv-types';

import { LayerSet, TypeFeatureInfoEntry, TypeLayerData } from './layer-set';

export type TypeFeatureInfoResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeLayerData;
};

export type TypeFeatureInfoResultSet = {
  [layerPath: string]: TypeFeatureInfoResultSetEntry;
};

type TypeFeatureInfoLayerSetInstance = { [mapId: string]: FeatureInfoLayerSet };

/**
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get feature info" request made on the map layers when the user click a location on the map.
 *
 * @class FeatureInfoLayerSet
 */
export class FeatureInfoLayerSet extends LayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapId (see singleton design pattern) */
  private static featureInfoLayerSetInstance: TypeFeatureInfoLayerSetInstance = {};

  /** An object containing the result sets indexed using the layer path */
  declare resultSet: TypeFeatureInfoResultSet;

  /**
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  private constructor(layerApi: LayerApi, mapId: string) {
    super(layerApi, mapId, `${mapId}/click/FeatureInfoLayerSet`, {});
    this.setRegistrationConditionFunction();
    this.setUserRegistrationInitFunction();
    this.setMapClickListener();
  }

  /* **************************************************************************************************************************
   * This function determines whether a layer can be registered or not.
   */
  setRegistrationConditionFunction() {
    this.registrationConditionFunction = (layerPath: string): boolean => {
      // Log
      logger.logTraceCore('FEATURE-INFO-LAYER-SET setRegistrationConditionFunction', layerPath, Object.keys(this.resultSet));

      const layerConfig = this.layerApi.registeredLayers[layerPath];
      const queryable = layerConfig?.source?.featureInfo?.queryable;
      return !!queryable;
    };
  }

  /** ***************************************************************************************************************************
   * Define the initialization function that the registration process will use to create a new entry in the layer set for a
   * specific layer path.
   */
  setUserRegistrationInitFunction() {
    this.registrationUserInitialisation = (layerPath: string) => {
      // Log
      logger.logTraceCore('FEATURE-INFO-LAYER-SET setUserRegistrationInitFunction', layerPath, Object.keys(this.resultSet));

      const layerConfig = this.layerApi.registeredLayers[layerPath];
      this.resultSet[layerPath] = {
        layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
        layerStatus: layerConfig.layerStatus!,
        data: {
          layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
          layerStatus: layerConfig.layerStatus!,
          eventListenerEnabled: true,
          queryStatus: 'processed',
          features: [],
          layerPath,
        },
      };
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, 'click', this.resultSet);
    };
  }

  /** ***************************************************************************************************************************
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map. This method is called by the parent class
   * LayerSet via the listener created by the setChangeLayerStatusListenerFunctions method.
   *
   * @param {TypeLayerSetChangeLayerStatusPayload} payload The payload to process.
   */
  protected changeLayerStatusListenerFunctions(payload: TypeLayerSetChangeLayerStatusPayload) {
    // Read info
    const { layerPath, layerStatus } = payload;

    // if layer's status flag exists and is different than the new one
    if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
      if (layerStatus === 'error') delete this.resultSet[layerPath];
      else {
        // Call parent
        super.changeLayerStatusListenerFunctions(payload);

        const layerConfig = this.layerApi.registeredLayers[layerPath];
        if (this?.resultSet?.[layerPath]?.data) {
          this.resultSet[layerPath].data.layerStatus = layerStatus;
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'click', this.resultSet);
        }
      }
    }
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   *
   * @param {Coordinate} coordinate The coordinate where to query the features
   */
  queryLayers = async (coordinate: Coordinate): Promise<TypeFeatureInfoResultSet> => {
    // TODO: REFACTOR - Watch out for code reentrancy between queries!
    // ! Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // ! As it is (and was like this befor events refactor), the this.resultSet is mutating between async calls.

    // Prepare to hold all promises of features in the loop below
    const allPromises: Promise<TypeFeatureInfoEntry[] | undefined | null>[] = [];

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      const layerConfig = this.layerApi.registeredLayers[layerPath];
      const { data } = this.resultSet[layerPath];
      if (!data.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        data.features = undefined;
        data.queryStatus = 'processing';

        // Query and event types of what we're doing
        const queryType = 'at_long_lat';
        const eventType = 'click';

        // Process query on results data
        const promiseResult = this.processQueryResultSetData(data, layerConfig, layerPath, queryType, coordinate);

        // Add the promise
        allPromises.push(promiseResult);

        // When the promise is done, propagate to store
        promiseResult.then((arrayOfRecords) => {
          // Keep the features retrieved
          data.features = arrayOfRecords;
          data.layerStatus = layerConfig.layerStatus!;

          // When property features is undefined, we are waiting for the query result.
          // when Array.isArray(features) is true, the features property contains the query result.
          // when property features is null, the query ended with an error.
          data.queryStatus = arrayOfRecords ? 'processed' : 'error';

          // Propagate to store
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);
        });
      } else {
        data.features = null;
        data.queryStatus = 'error';
      }
    });

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Return the results
    return this.resultSet;
  };

  /**
   * Listen to "map click" and call a query for all registered layers at the clicked location.
   */
  setMapClickListener() {
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          // Log
          logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET on EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK', this.mapId, payload);

          // Process to query all layers which can be queried
          this.queryLayers(payload.coordinates.lnglat);
        }
      },
      this.mapId
    );
  }

  /**
   * Function used to enable listening of click events. When a layer path is not provided,
   * click events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableClickListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of click events. When a layer path is not provided,
   * click events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableClickListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether click events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   *
   * @param {string} layerPath Optional parameter used to get the flag value of a layer.
   *
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isClickListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.data?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].data.eventListenerEnabled;
      if (returnValue !== this.resultSet[key].data.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * must be used in place of the "new FeatureInfoLayerSet" syntax.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static get(layerApi: LayerApi, mapId: string): FeatureInfoLayerSet {
    if (!FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId])
      FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId] = new FeatureInfoLayerSet(layerApi, mapId);
    return FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId];
  }

  /**
   * Function used to delete a FeatureInfoLayerSet object associated to a mapId.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  static delete(mapId: string) {
    if (FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId]) delete FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId];
  }
}
