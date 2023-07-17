import { EventStringId } from '../event-types';

/**
 * This file defines the constants of NOTIFICATIONS. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the NOTIFICATIONS */
export type NotificationsEventKey = 'NOTIFICATION_ADD' | 'NOTIFICATION_REMOVE';

/** Record that associates FOOTER_TABS's event keys to their event string id */
export const NOTIFICATIONS: Record<NotificationsEventKey, EventStringId> = {
  /**
   * Event triggered when a new notification has been added
   */
  NOTIFICATION_ADD: 'notification/add',

  /**
   * Event triggered when a footer tabs tab has been removed
   */
  NOTIFICATION_REMOVE: 'notification/remove',
};
