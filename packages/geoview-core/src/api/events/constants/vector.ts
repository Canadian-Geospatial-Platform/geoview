import { EventStringId } from '../event';

/**
 * Vector event types
 */

type VectorEventKey = 'EVENT_VECTOR_ADD' | 'EVENT_VECTOR_REMOVE' | 'EVENT_VECTOR_ADDED' | 'EVENT_VECTOR_OFF' | 'EVENT_VECTOR_ON';

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
