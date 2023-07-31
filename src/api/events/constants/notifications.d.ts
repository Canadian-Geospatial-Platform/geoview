import { EventStringId } from '../event-types';
/**
 * This file defines the constants of NOTIFICATIONS. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the NOTIFICATIONS */
export type NotificationsEventKey = 'NOTIFICATION_ADD' | 'NOTIFICATION_REMOVE';
/** Record that associates NOTIFICATIONS event keys to their event string id */
export declare const NOTIFICATIONS: Record<NotificationsEventKey, EventStringId>;
