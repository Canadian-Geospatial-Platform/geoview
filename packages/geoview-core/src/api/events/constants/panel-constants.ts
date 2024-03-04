import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the PANEL category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the PANEL category */
export type PanelEventKey = 'EVENT_PANEL_ADD_ACTION' | 'EVENT_PANEL_REMOVE_ACTION';

/** Record that associates PANEL's event keys to their event string id */
export const PANEL: Record<PanelEventKey, EventStringId> = {
  /**
   * Event triggered when a request is made to add an action button
   */
  EVENT_PANEL_ADD_ACTION: 'panel/add_action',

  /**
   * Event triggered when a request is made to remove an action button
   */
  EVENT_PANEL_REMOVE_ACTION: 'panel/remove_action',
};
