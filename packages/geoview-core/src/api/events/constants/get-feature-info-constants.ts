import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the GET_FEATURE_INFO category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the GET_FEATURE_INFO category */
export type GetFeatureInfoEventKey =
  | 'QUERY_LAYER'
  | 'ALL_QUERIES_DONE'
  | 'GET_ALL_LAYER_FEATURES'
  | 'QUERY_RESULT'
  | 'FEATURE_INFO_LAYERSET_UPDATED';

/** Record that associates GET_FEATURE_INFO's event keys to their event string id */
export const GET_FEATURE_INFO: Record<GetFeatureInfoEventKey, EventStringId> = {
  /**
   * Event triggered to execute a query on a layer
   */
  QUERY_LAYER: 'get_feature_info/query_layer',

  /**
   * Event triggered when all the queries of the layer set are done
   */
  ALL_QUERIES_DONE: 'get_feature_info/all_queries_done',

  /**
   * Event triggered when a user needs to get all features information for alayer on the map
   */
  GET_ALL_LAYER_FEATURES: 'get_feature_info/get_all_layer_features',

  /**
   * Event triggered to send the result of the query
   */
  QUERY_RESULT: 'get_feature_info/query_result',

  /**
   * Event triggered to send the result of the query
   */
  FEATURE_INFO_LAYERSET_UPDATED: 'get_feature_info/feature_info_layerset_updated',
};
