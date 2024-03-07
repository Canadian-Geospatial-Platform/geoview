import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the DRAW category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the INTERACTION category */
export type InteractionEventKey =
  | 'EVENT_EXTENT'
  | 'EVENT_DRAW_STARTED'
  | 'EVENT_DRAW_ENDED'
  | 'EVENT_DRAW_ABORTED'
  // | 'EVENT_MODIFY_STARTED'
  // | 'EVENT_MODIFY_ENDED'
  | 'EVENT_TRANSLATE_STARTED'
  | 'EVENT_TRANSLATE_ENDED';

/** Record that associates DRAW's event keys to their event string id */
export const INTERACTION: Record<InteractionEventKey, EventStringId> = {
  /**
   * Event is triggered when a select notification opens
   */
  EVENT_EXTENT: 'interaction/extent_selected',

  /**
   * Event triggered when drawing has started
   */
  EVENT_DRAW_STARTED: 'interaction/draw_started',

  /**
   * Event triggered when drawing has ended
   */
  EVENT_DRAW_ENDED: 'interaction/draw_ended',

  /**
   * Event triggered when drawing has aborted
   */
  EVENT_DRAW_ABORTED: 'interaction/draw_aborted',

  // /**
  //  * Event triggered when modifying has started
  //  */
  // EVENT_MODIFY_STARTED: 'interaction/modify_started',

  // /**
  //  * Event triggered when modifying has ended
  //  */
  // EVENT_MODIFY_ENDED: 'interaction/modify_ended',

  /**
   * Event is triggered when a translate operation starts
   */
  EVENT_TRANSLATE_STARTED: 'interaction/translate_started',

  /**
   * Event is triggered when a translate operation ends
   */
  EVENT_TRANSLATE_ENDED: 'interaction/translate_ended',
};
