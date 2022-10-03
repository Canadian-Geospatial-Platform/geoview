import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the GET_FEATURE_INFO category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the GET_FEATURE_INFO category */
export declare type GetFeatureInfoEventKey = 'REGISTER' | 'QUERY_LAYER' | 'QUERY_RESULT';
/** Record that associates GET_FEATURE_INFO's event keys to their event string id */
export declare const GET_FEATURE_INFO: Record<GetFeatureInfoEventKey, EventStringId>;
