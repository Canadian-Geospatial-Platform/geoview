import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the FOOTERBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the FOOTERBAR category */
export type FooterbarEventKey = 'EVENT_FOOTERBAR_EXPAND_COLLAPSE';

/** Record that associates FOOTERBAR's event keys to their event string id */
export const FOOTERBAR: Record<FooterbarEventKey, EventStringId> = {
  /**
   * Event triggered when a footer bar is expanded or collapsed
   */
  EVENT_FOOTERBAR_EXPAND_COLLAPSE: 'footerbar/expand_collapse',
};
