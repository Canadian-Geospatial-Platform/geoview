import { EventStringId } from '../event';

/**
 * Overview map event types
 */

export type OverviewEventKey = 'EVENT_OVERVIEW_MAP_TOGGLE';

export const OVERVIEW_MAP: Record<OverviewEventKey, EventStringId> = {
  /**
   * Event triggered when the overview map is toggled
   */
  EVENT_OVERVIEW_MAP_TOGGLE: 'overview_map/toggle',
};
