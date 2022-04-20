import { EventStringId } from '../event';

/**
 * Details panel event types
 */

export type DetailPanelEventKey = 'EVENT_DETAILS_PANEL_CROSSHAIR_ENTER';

export const DETAILS_PANEL: Record<DetailPanelEventKey, EventStringId> = {
  /**
   * Event is triggered when a user press enter on a crosshair to open details panel
   */
  EVENT_DETAILS_PANEL_CROSSHAIR_ENTER: 'details_panel/crosshair_enter',
};
