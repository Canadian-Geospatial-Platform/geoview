import { EventStringId } from '../event';

/**
 * This file defines the constants of the DETAILS_PANEL category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

// Valid keys for the DETAILS_PANEL category
export type DetailPanelEventKey = 'EVENT_DETAILS_PANEL_CROSSHAIR_ENTER';

// Record that associates DETAILS_PANEL's event keys to their event string id
export const DETAILS_PANEL: Record<DetailPanelEventKey, EventStringId> = {
  /**
   * Event is triggered when a user press enter on a crosshair to open details panel
   */
  EVENT_DETAILS_PANEL_CROSSHAIR_ENTER: 'details_panel/crosshair_enter',
};
