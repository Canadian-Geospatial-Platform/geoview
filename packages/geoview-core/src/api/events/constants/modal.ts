import { EventStringId } from '../event';

/**
 * Modal event types
 */

type ModalEventKey = 'EVENT_MODAL_CREATE' | 'EVENT_MODAL_OPEN' | 'EVENT_MODAL_CLOSE' | 'EVENT_MODAL_UPDATE';

export const MODAL: Record<ModalEventKey, EventStringId> = {
  /**
   * Event is triggered when a new modal is created
   */
  EVENT_MODAL_CREATE: 'modal/create',

  /**
   * Event is triggered when a modal opens
   */
  EVENT_MODAL_OPEN: 'modal/open',

  /**
   * Event is triggered when a modal is closed
   */
  EVENT_MODAL_CLOSE: 'modal/close',

  /**
   * Event is triggered when a modal is updated
   */
  EVENT_MODAL_UPDATE: 'modal/update',
};
