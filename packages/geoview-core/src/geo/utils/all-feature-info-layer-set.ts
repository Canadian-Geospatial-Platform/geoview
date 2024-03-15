import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetFeatureInfoPayload,
  PayloadBaseClass,
  payloadIsQueryResult,
  payloadIsLayerSetChangeLayerStatus,
  QueryType,
} from '@/api/events/payloads';
import { api } from '@/app';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { TypeLayerData, TypeLayerEntryConfig, TypeLayerStatus, payloadIsGetAllLayerFeatures } from '@/core/types/cgpv-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { LayerSet } from './layer-set';

export type TypeAllFeatureInfoResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeLayerData;
};

export type TypeAllFeatureInfoResultSet = {
  [layerPath: string]: TypeAllFeatureInfoResultSetEntry;
};

type TypeAllFeatureInfoLayerSetInstance = { [mapId: string]: AllFeatureInfoLayerSet };

/** ***************************************************************************************************************************
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get  all feature info" request made on a specific layer of the map. The query is made for one layer at a time.
 *
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends LayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapId (see singleton design pattern) */
  private static allFeatureInfoLayerSetInstance: TypeAllFeatureInfoLayerSetInstance = {};

  /** An object containing the result sets indexed using the layer path */
  declare resultSet: TypeAllFeatureInfoResultSet;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(mapId: string) {
    super(mapId, `${mapId}/all/FeatureInfoLayerSet`, {});
    this.setRegistrationConditionFunction();
    this.setUserRegistrationInitFunction();
    this.setQueryResultListener();
  }

  /* **************************************************************************************************************************
   * This function determines whether a layer can be registered or not.
   */
  setRegistrationConditionFunction() {
    this.registrationConditionFunction = (layerPath: string): boolean => {
      // Log
      logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET setRegistrationConditionFunction', layerPath, Object.keys(this.resultSet));

      const geoviewLayerConfig = api.maps[this.mapId].layer.getGeoviewLayer(layerPath);
      // TODO: Make a util function for this check
      if (
        [
          CONST_LAYER_TYPES.ESRI_IMAGE,
          CONST_LAYER_TYPES.IMAGE_STATIC,
          CONST_LAYER_TYPES.XYZ_TILES,
          CONST_LAYER_TYPES.VECTOR_TILES,
          CONST_LAYER_TYPES.WMS,
        ].includes(geoviewLayerConfig.type)
      )
        return false;

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
      logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET setUserRegistrationInitFunction', layerPath, Object.keys(this.resultSet));

      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
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

      this.setQueryAllFeaturesListener(layerConfig);
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, 'all-features', this.resultSet);
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
      logger.logTraceCoreAPIEvent('ALL-FEATURE-INFO-LAYER-SET on EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS', this.mapId, payload);

      const { layerPath, layerStatus } = payload;
      // if layer's status flag exists and is different than the new one
      if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
        if (layerStatus === 'error') delete this.resultSet[layerPath];
        else {
          const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
          super.changeLayerStatusListenerFunctions(payload);
          if (this?.resultSet?.[layerPath]?.data) {
            this.resultSet[layerPath].data.layerStatus = layerStatus;
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'all-features', this.resultSet);
          }
        }
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
          logger.logTraceCoreAPIEvent('ALL-FEATURE-INFO-LAYER-SET on EVENT_NAMES.GET_FEATURE_INFO.QUERY_ALL_FEATURES', this.mapId);

          const { queryType } = payload;
          if (!this.resultSet[layerConfig.layerPath].data.eventListenerEnabled) return;
          const { data } = this.resultSet[layerConfig.layerPath];
          if (layerConfig.layerStatus === 'loaded') {
            data.features = undefined;
            data.queryStatus = 'processing';
          } else {
            data.features = null;
            data.queryStatus = 'error';
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
        logger.logTraceCoreAPIEvent('ALL-FEATURE-INFO-LAYER-SET - QUERY_RESULT', this.mapId, payload);

        if (payloadIsQueryResult(payload)) {
          const { layerPath, arrayOfRecords, eventType, queryType } = payload;
          if (eventType === 'all-features' && this.resultSet?.[layerPath]?.data) {
            const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
            const { data } = this.resultSet[layerPath];
            data.features = arrayOfRecords;
            data.layerStatus = layerConfig.layerStatus!;
            // When property features is undefined, we are waiting for the query result.
            // when Array.isArray(features) is true, the features property contains the query result.
            // when property features is null, the query ended with an error.
            data.queryStatus = arrayOfRecords === null ? 'error' : 'processed';
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);
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
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * must be used in place of the "new FeatureInfoLayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static get(mapId: string): AllFeatureInfoLayerSet {
    if (!AllFeatureInfoLayerSet.allFeatureInfoLayerSetInstance[mapId])
      AllFeatureInfoLayerSet.allFeatureInfoLayerSetInstance[mapId] = new AllFeatureInfoLayerSet(mapId);
    return AllFeatureInfoLayerSet.allFeatureInfoLayerSetInstance[mapId];
  }

  /**
   * Function used to delete a FeatureInfoLayerSet object associated to a mapId.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  static delete(mapId: string) {
    if (AllFeatureInfoLayerSet.allFeatureInfoLayerSetInstance[mapId]) delete AllFeatureInfoLayerSet.allFeatureInfoLayerSetInstance[mapId];
  }
}
