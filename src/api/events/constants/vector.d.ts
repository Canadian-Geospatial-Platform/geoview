import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the VECTOR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the VECTOR category */
export declare type VectorEventKey = 'EVENT_VECTOR_ADD' | 'EVENT_VECTOR_REMOVE' | 'EVENT_VECTOR_ADDED' | 'EVENT_VECTOR_OFF' | 'EVENT_VECTOR_ON';
/** Record that associates VECTOR's event keys to their event string id */
export declare const VECTOR: Record<VectorEventKey, EventStringId>;
