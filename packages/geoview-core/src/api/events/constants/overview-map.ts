import { EventStringId } from '../event';

/**
 * This file defines the constants of the OVERVIEW_MAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the OVERVIEW_MAP category */
export type OverviewEventKey = 'EVENT_OVERVIEW_MAP_TOGGLE';

/** Record that associates OVERVIEW_MAP's event keys to their event string id */
export const OVERVIEW_MAP: Record<OverviewEventKey, EventStringId> = {
  /**
   * Event triggered when the overview map is toggled
   */
  EVENT_OVERVIEW_MAP_TOGGLE: 'overview_map/toggle',
};
