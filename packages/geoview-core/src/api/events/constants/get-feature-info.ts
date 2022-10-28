import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the GET_FEATURE_INFO category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the GET_FEATURE_INFO category */
export type GetFeatureInfoEventKey = 'REQUEST_LAYER_INVENTORY' | 'QUERY_LAYER' | 'ALL_QUERIES_DONE' | 'QUERY_RESULT' | 'LAYER_REGISTRATION';

/** Record that associates GET_FEATURE_INFO's event keys to their event string id */
export const GET_FEATURE_INFO: Record<GetFeatureInfoEventKey, EventStringId> = {
  /**
   * Event triggered when a panel wants to inventory the layers of a map
   */
  REQUEST_LAYER_INVENTORY: 'get_feature_info/request_layer_inventory',

  /**
   * Event triggered to execute a query on a layer
   */
  QUERY_LAYER: 'get_feature_info/query_layer',

  /**
   * Event triggered when all the queries of the layer set are done
   */
  ALL_QUERIES_DONE: 'get_feature_info/all_queries_done',

  /**
   * Event triggered to send the result of the query
   */
  QUERY_RESULT: 'get_feature_info/query_result',

  /**
   * Event triggered when a layer wants to register to a panel
   */
  LAYER_REGISTRATION: 'get_feature_info/layer_registration',
};
