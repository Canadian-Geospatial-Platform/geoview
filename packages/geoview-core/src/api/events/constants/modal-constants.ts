import { EventStringId } from '@/api/events/event-types';

/**
 * This file defines the constants of the MODAL category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the MODAL category */
export type ModalEventKey = 'EVENT_MODAL_OPEN' | 'EVENT_MODAL_CLOSE';

/** Record that associates MODAL's event keys to their event string id */
export const MODAL: Record<ModalEventKey, EventStringId> = {
  /**
   * Event is triggered when a modal opens
   */
  EVENT_MODAL_OPEN: 'modal/open',

  /**
   * Event is triggered when a modal is closed
   */
  EVENT_MODAL_CLOSE: 'modal/close',
};
