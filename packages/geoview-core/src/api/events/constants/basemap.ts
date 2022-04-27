import { EventStringId } from '../event';

/**
 * This file defines the constants of the BASEMAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

// Valid keys for the BASEMAP category
export type BasmapEventKey = 'EVENT_BASEMAP_LAYERS_UPDATE';

// Record that associates BASEMAP's event keys to their event string id
export const BASEMAP: Record<BasmapEventKey, EventStringId> = {
  /**
   * Event is triggered when updating the basemap layers
   */
  EVENT_BASEMAP_LAYERS_UPDATE: 'basemap/layers_update',
};
