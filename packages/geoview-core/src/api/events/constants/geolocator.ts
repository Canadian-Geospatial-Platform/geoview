import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the GEOLOCATOR category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the GEOLOCATOR category */
export type GeolocatorEventKey = 'EVENT_GEOLOCATOR_TOGGLE';

/** Record that associates GEOLOCATOR's event keys to their event string id */
export const GEOLOCATOR: Record<GeolocatorEventKey, EventStringId> = {
  /**
   * Event triggered when the app-bar geolocator button has been click to show/hide the geolocator component
   */
  EVENT_GEOLOCATOR_TOGGLE: 'geolocator/toggle',
};
