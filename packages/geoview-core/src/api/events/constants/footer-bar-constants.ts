import { EventStringId } from '@/api/events/event-types';

/**
 * This file defines the constants of the FOOTERBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the FOOTERBAR category */
export type FooterBarEventKey = 'EVENT_FOOTERBAR_TAB_CREATE' | 'EVENT_FOOTERBAR_TAB_REMOVE';

/** Record that associates FOOTERBAR's event keys to their event string id */
export const FOOTERBAR: Record<FooterBarEventKey, EventStringId> = {
  /**
   * Event triggered when a new footer bar tab has been created
   */
  EVENT_FOOTERBAR_TAB_CREATE: 'footerbar/tab_create',

  /**
   * Event triggered when a footer bar tab has been removed
   */
  EVENT_FOOTERBAR_TAB_REMOVE: 'footerbar/tab_remove',
};
