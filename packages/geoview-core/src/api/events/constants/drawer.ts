import { EventStringId } from '../event';

/**
 * Drawer event types
 */

export type DrawerEventKey = 'EVENT_DRAWER_OPEN_CLOSE';

export const DRAWER: Record<DrawerEventKey, EventStringId> = {
  /**
   * Event triggered when a drawer opens/closes
   */
  EVENT_DRAWER_OPEN_CLOSE: 'drawer/open_close',
};
