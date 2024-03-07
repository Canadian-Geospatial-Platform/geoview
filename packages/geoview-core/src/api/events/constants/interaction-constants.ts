import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the DRAW category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the INTERACTION category */
export type InteractionEventKey = 'EVENT_EXTENT';

/** Record that associates DRAW's event keys to their event string id */
export const INTERACTION: Record<InteractionEventKey, EventStringId> = {
  /**
   * Event is triggered when a select notification opens
   */
  EVENT_EXTENT: 'interaction/extent_selected',
};
