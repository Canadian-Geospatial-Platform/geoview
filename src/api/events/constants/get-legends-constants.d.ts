import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the GET_FEATURE_INFO category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the GET_LEGENDS category */
export type GetLegendsEventKey = 'LEGENDS_LAYERSET_UPDATED' | 'LEGEND_INFO' | 'QUERY_LEGEND' | 'TRIGGER';
/** Record that associates GET_LEGENDS's event keys to their event string id */
export declare const GET_LEGENDS: Record<GetLegendsEventKey, EventStringId>;
