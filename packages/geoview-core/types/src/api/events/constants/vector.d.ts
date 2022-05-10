import { EventStringId } from '../event';
/**
 * This file defines the constants of the VECTOR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
export declare type VectorEventKey = 'EVENT_VECTOR_ADD' | 'EVENT_VECTOR_REMOVE' | 'EVENT_VECTOR_ADDED' | 'EVENT_VECTOR_OFF' | 'EVENT_VECTOR_ON';
export declare const VECTOR: Record<VectorEventKey, EventStringId>;
