import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the GET_FEATURE_INFO category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the GET_LEGENDS category */
export type GetLegendsEventKey = 'QUERY_LEGENDS' | 'ALL_LEGENDS_DONE' | 'LEGEND_INFO';

/** Record that associates GET_LEGENDS's event keys to their event string id */
export const GET_LEGENDS: Record<GetLegendsEventKey, EventStringId> = {
  /**
   * Event triggered to execute a query on a layer
   */
  QUERY_LEGENDS: 'get_legends/query_legends',

  /**
   * Event triggered when all the queries of the layer set are done
   */
  ALL_LEGENDS_DONE: 'get_legends/all_legends_done',

  /**
   * Event triggered to send the result of the query
   */
  LEGEND_INFO: 'get_legends/legend_info',
};
