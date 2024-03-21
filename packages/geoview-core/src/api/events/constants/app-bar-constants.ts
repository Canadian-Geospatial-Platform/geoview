import { EventStringId } from '@/api/events/event-types';

/**
 * This file defines the constants of the APPBAR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the APPBAR category */
export type AppbarEventKey = 'EVENT_APPBAR_PANEL_CREATE' | 'EVENT_APPBAR_PANEL_REMOVE';

/** Record that associates APPBAR's event keys to their event string id */
export const APPBAR: Record<AppbarEventKey, EventStringId> = {
  /**
   * Event triggered when a new app-bar panel has been created
   */
  EVENT_APPBAR_PANEL_CREATE: 'appbar/panel_create',

  /**
   * Event triggered when an app-bar button panel has been removed
   */
  EVENT_APPBAR_PANEL_REMOVE: 'appbar/panel_remove',
};
