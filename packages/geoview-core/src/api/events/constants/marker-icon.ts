import { EventStringId } from '../event';

/**
 * Marker icon event types
 */

export type MarkerIconEventKey = 'EVENT_MARKER_ICON_SHOW' | 'EVENT_MARKER_ICON_HIDE';

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
