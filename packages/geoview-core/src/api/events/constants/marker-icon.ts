import { EventStringId } from '../event';

/**
 * This file defines the constants of the MARKER_ICON category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

// Valid keys for the MARKER_ICON category
export type MarkerIconEventKey = 'EVENT_MARKER_ICON_SHOW' | 'EVENT_MARKER_ICON_HIDE';

// Record that associates MARKER_ICON's event keys to their event string id
export const MARKER_ICON: Record<MarkerIconEventKey, EventStringId> = {
  /**
   * Event is triggered when a call is made to show a marker on map click in details panel
   */
  EVENT_MARKER_ICON_SHOW: 'marker_icon/show',

  /**
   * Event is triggered when a call is made to hide the marker
   */
  EVENT_MARKER_ICON_HIDE: 'marker_icon/hide',
};
