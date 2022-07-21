import { EventStringId } from '../event';

/**
 * This file defines the constants of the FOOTER_TABS category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the FOOTER_TABS category */
export type FooterTabsEventKey = 'EVENT_FOOTER_TABS_TAB_CREATE' | 'EVENT_FOOTER_TABS_TAB_REMOVE';

/** Record that associates FOOTER_TABS's event keys to their event string id */
export const FOOTER_TABS: Record<FooterTabsEventKey, EventStringId> = {
  /**
   * Event triggered when a new footer tabs tab has been created
   */
  EVENT_FOOTER_TABS_TAB_CREATE: 'footer_tabs/tab_create',

  /**
   * Event triggered when a footer tabs tab has been removed
   */
  EVENT_FOOTER_TABS_TAB_REMOVE: 'footer_tabs/tab_remove',
};
