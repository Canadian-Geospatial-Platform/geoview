import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the VECTOR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the VECTOR category */
export type VectorEventKey = 'EVENT_VECTOR_ADD' | 'EVENT_VECTOR_REMOVE' | 'EVENT_VECTOR_ADDED' | 'EVENT_VECTOR_OFF' | 'EVENT_VECTOR_ON';

/** Record that associates VECTOR's event keys to their event string id */
export const VECTOR: Record<VectorEventKey, EventStringId> = {
  /**
   * Event triggered when a request is made to add a vector
   */
  EVENT_VECTOR_ADD: 'vector/add',

  /**
   * Event triggered when a request is made to remove a vector
   */
  EVENT_VECTOR_REMOVE: 'vector/remove',

  /**
   * Event is triggered when a vector has been added
   */
  EVENT_VECTOR_ADDED: 'vector/added',

  /**
   * Event is triggered when you want to turn off all visible vectors
   */
  EVENT_VECTOR_OFF: 'vector/off',

  /**
   * Event is triggered when you want to turn on all visible vectors
   */
  EVENT_VECTOR_ON: 'vector/on',
};
