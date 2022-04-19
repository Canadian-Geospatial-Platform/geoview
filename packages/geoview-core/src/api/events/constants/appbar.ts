import { EventStringId } from '../event';

/**
 * Constant that contains appbar event types
 */

type AppbarEventKey = 'EVENT_APPBAR_PANEL_CREATE' | 'EVENT_APPBAR_PANEL_REMOVE';

export const APPBAR: Record<AppbarEventKey, EventStringId> = {
  /**
   * Event triggered when a new appbar panel has been created
   */
  EVENT_APPBAR_PANEL_CREATE: 'appbar/panel_create',

  /**
   * Event triggered when an appbar button panel has been removed
   */
  EVENT_APPBAR_PANEL_REMOVE: 'appbar/panel_remove',
};
