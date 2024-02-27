import debounce from 'lodash/debounce';

import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetFeatureInfoPayload,
  PayloadBaseClass,
  payloadIsQueryResult,
  TypeFeatureInfoResultSet,
  payloadIsLayerSetChangeLayerStatus,
  payloadIsAMapMouseEvent,
  ArrayOfEventTypes,
  TypeLayerData,
  EventType,
  QueryType,
} from '@/api/events/payloads';
import { api } from '@/app';
import { LayerSet } from './layer-set';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { Coordinate, TypeLayerEntryConfig, TypeQueryStatus, payloadIsGetAllLayerFeatures } from '@/core/types/cgpv-types';

type TypeFeatureInfoLayerSetInstance = { [mapId: string]: FeatureInfoLayerSet };

/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeArrayOfFeatureInfoEntries. When this class is instantiated,
 * all layers already loaded on the specified map that are queryable will be added to the set. Layers added afterwards will be
 * added to the set if they are queryable. Deleted layers will be removed from the set. If you click on the map, all queryable
 * layers will execute a query and return their result set.
 *
 * @class FeatureInfoLayerSet
 */
export class FeatureInfoLayerSet extends LayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapId (see singleton design pattern) */
  private static featureInfoLayerSetInstance: TypeFeatureInfoLayerSetInstance = {};

  /** An object containing the result sets indexed using the layer path */
  declare resultSet: TypeFeatureInfoResultSet;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(mapId: string) {
    super(mapId, `${mapId}/FeatureInfoLayerSet`, {});
    this.setRegistrationConditionFunction();
    this.setUserRegistrationInitFunction();
    this.setMapClickListener();
    this.setMapHoverListener();
    this.setQueryResultListener();
  }

  /* **************************************************************************************************************************
   * This function determines whether a layer can be registered or not.
   */
  setRegistrationConditionFunction() {
    this.registrationConditionFunction = (layerPath: string): boolean => {
      // Log
      logger.logTraceCore('FEATURE-INFO-LAYER-SET setRegistrationConditionFunction', layerPath, Object.keys(this.resultSet));

      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
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

      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
      this.resultSet[layerPath] = {
        layerStatus: layerConfig.layerStatus!,
        data: {},
        layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
      };

      ArrayOfEventTypes.forEach((eventType) => {
        this.resultSet[layerPath].data[eventType] = {
          layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
          layerStatus: layerConfig.layerStatus!,
          eventListenerEnabled: true,
          queryStatus: 'processed',
          features: [],
          layerPath,
        };
        if (eventType === 'all-features') this.setQueryAllFeaturesListener(layerConfig);
        FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);
      });
    };
  }

  /** ***************************************************************************************************************************
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map.This method is called by the parent class
   * LayerSet via the listener created by the setChangeLayerStatusListenerFunctions method.
   *
   * @param {PayloadBaseClass} payload The payload to process.
   */
  protected changeLayerStatusListenerFunctions(payload: PayloadBaseClass) {
    if (payloadIsLayerSetChangeLayerStatus(payload)) {
      // Log
      logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET on EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS', this.mapId, payload);

      const { layerPath, layerStatus } = payload;
      // if layer's status flag exists and is different than the new one
      if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
        if (layerStatus === 'error') delete this.resultSet[layerPath];
        else super.changeLayerStatusListenerFunctions(payload);
      }
    }
  }

  /** ***************************************************************************************************************************
   * Set the listener function that will monitor events sent when we want to retreive all features in the context specified for
   * a specific layer. For the moment, the context can only be 'all' and the query will return all the features on the layer.
   * Next generation of this listener will be able to query for features 'using_a_bounding_box' or 'using_a_a polygon' as value
   * for the context.
   */
  private setQueryAllFeaturesListener(layerConfig: TypeLayerEntryConfig) {
    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_ALL_FEATURES,
      (payload) => {
        if (payloadIsGetAllLayerFeatures(payload)) {
          // Log
          logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET on EVENT_NAMES.GET_FEATURE_INFO.QUERY_ALL_FEATURES', this.mapId);

          const { queryType } = payload;
          if (!this.resultSet[layerConfig.layerPath].data['all-features']!.eventListenerEnabled) return;
          const dataForEventType = this.resultSet[layerConfig.layerPath].data['all-features'] as TypeLayerData;
          if (layerConfig.layerStatus === 'loaded') {
            dataForEventType.features = undefined;
            dataForEventType.queryStatus = 'processing';
          } else {
            dataForEventType.features = null;
            dataForEventType.queryStatus = 'error';
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'all-features', this.resultSet);
            return;
          }

          api.event.emit(
            GetFeatureInfoPayload.createQueryLayerPayload(`${this.mapId}/${layerConfig.layerPath}`, queryType, layerConfig.layerPath)
          );
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'all-features', this.resultSet);
        }
      },
      `${this.mapId}/${layerConfig.layerPath}`
    );
    FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'click', this.resultSet);
  }

  /* **************************************************************************************************************************
   * Private method used to emit a query layer event for all layers in the result set that are loaded. Layers that has an error
   * are set with an undefined features array and a queryStatus equal to 'error'.
   *
   * @param {EventType} eventType The event type (ex.: "click" | "hover" | "crosshaire-enter" | "all-features")
   * @param {QueryType} queryType The query type (ex.: "all" | "at_pixel" | "at_coordinate" | "at_long_lat", ...)
   * @param {Coordinate} coordinate The coordinate of the event
   */
  private createQueryLayerPayloadFor = (eventType: EventType, queryType: QueryType, coordinate: Coordinate): void => {
    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
      const dataForEventType = this.resultSet[layerPath].data[eventType] as TypeLayerData;
      if (!dataForEventType.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        dataForEventType.features = undefined;
        dataForEventType.queryStatus = 'processing';
      } else {
        dataForEventType.features = null;
        dataForEventType.queryStatus = 'error';
      }

      if (dataForEventType.eventListenerEnabled && dataForEventType.queryStatus !== ('error' as TypeQueryStatus)) {
        api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(`${this.mapId}/${layerPath}`, queryType, coordinate, eventType));
      }
    });
  };

  /** ***************************************************************************************************************************
   * Listen to "map click" and send a query layers event to queryable layers. These layers will return a result set of features.
   */
  setMapClickListener() {
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          // Log
          logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET on EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK', this.mapId, payload);

          this.createQueryLayerPayloadFor('click', 'at_long_lat', payload.coordinates.lnglat);
        }
      },
      this.mapId
    );
  }

  /** ***************************************************************************************************************************
   * Listen to "map hover" and send a query layers event to queryable layers. These layers will return a result set of features.
   */
  setMapHoverListener() {
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE,
      debounce((payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET on EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE', this.mapId, payload);

        if (payloadIsAMapMouseEvent(payload)) {
          this.createQueryLayerPayloadFor('hover', 'at_pixel', payload.coordinates.pixel);
        }
      }, 750),
      this.mapId
    );
  }

  /** ***************************************************************************************************************************
   * Listen to "query result" events and send an all query done event when all the layers have returned their result set of
   * features.
   */
  private setQueryResultListener() {
    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - QUERY_RESULT', this.mapId, payload);

        if (payloadIsQueryResult(payload)) {
          const { layerPath, queryType, arrayOfRecords, eventType } = payload;
          const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
          if (this.resultSet?.[layerPath]?.data) {
            const dataForEventType = this.resultSet[layerPath].data[eventType] as TypeLayerData;
            dataForEventType.features = arrayOfRecords;
            dataForEventType.layerStatus = layerConfig.layerStatus!;
            // When property features is undefined, we are waiting for the query result.
            // when Array.isArray(features) is true, the features property contains the query result.
            // when property features is null, the query ended with an error.
            dataForEventType.queryStatus = arrayOfRecords === null ? 'error' : 'processed';
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);
          }

          const allDone = Object.keys(this.resultSet).reduce((doneFlag, layerPathToTest) => {
            return doneFlag && this.resultSet[layerPathToTest].data[eventType]?.features !== undefined;
          }, true);

          if (allDone) {
            api.event.emit(
              GetFeatureInfoPayload.createAllQueriesDonePayload(
                this.layerSetId,
                eventType,
                layerPath,
                queryType,
                this.layerSetId,
                this.resultSet
              )
            );
          }
        }
      },
      this.mapId
    );
  }

  /**
   * Helper function used to launch the query on a layer to get all of its feature information
   *
   * @param {string} layerPath The layerPath that will be queried.
   * @param {QueryType} queryType the query's type to perform
   */
  // TODO: (futur development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  triggerGetAllFeatureInfo(layerPath: string, queryType: QueryType = 'all') {
    if (this.resultSet[layerPath])
      api.event.emit(GetFeatureInfoPayload.createGetAllLayerFeaturesPayload(`${this.mapId}/${layerPath}`, queryType));
    else logger.logError(`The triggerGetAllFeatureInfo method cannot be used on an inexistant layer path (${layerPath})`);
  }

  /**
   * Function used to enable listening of click events. When a layer path is not provided,
   * click events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableClickListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.click!.eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.click!.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of click events. When a layer path is not provided,
   * click events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableClickListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.click!.eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.click!.eventListenerEnabled = false;
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
    if (layerPath) return !!this.resultSet?.[layerPath]?.data?.click?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].data.click!.eventListenerEnabled;
      if (returnValue !== this.resultSet[key].data.click!.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.hover!.eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.hover!.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.hover!.eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.hover!.eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   *
   * @param {string} layerPath Optional parameter used to get the flag value of a layer.
   *
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isHoverListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.data?.hover?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].data.hover!.eventListenerEnabled;
      if (returnValue !== this.resultSet[key].data.hover!.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * must be used in place of the "new FeatureInfoLayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static get(mapId: string): FeatureInfoLayerSet {
    if (!FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId])
      FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId] = new FeatureInfoLayerSet(mapId);
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
