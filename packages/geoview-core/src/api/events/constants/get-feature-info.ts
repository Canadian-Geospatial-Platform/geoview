import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the GET_FEATURE_INFO category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the GET_FEATURE_INFO category */
export type GetFeatureInfoEventKey = 'REGISTER' | 'QUERY_LAYER' | 'QUERY_RESULT';

/** Record that associates GET_FEATURE_INFO's event keys to their event string id */
export const GET_FEATURE_INFO: Record<GetFeatureInfoEventKey, EventStringId> = {
  /**
   * Event triggered when a layer wants to register to a panel
   */
  REGISTER: 'get_feature_info/register',

  /**
   * Event triggered to execute a query on a layer
   */
  QUERY_LAYER: 'get_feature_info/query_layer',

  /**
   * Event triggered to send the result of the query
   */
  QUERY_RESULT: 'get_feature_info/query_result',
};
