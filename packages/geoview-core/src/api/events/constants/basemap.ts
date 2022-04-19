import { EventStringId } from '../event';

/**
 * Basemap event types
 */

type BasmapEventKey = 'EVENT_BASEMAP_LAYERS_UPDATE';

export const BASEMAP: Record<BasmapEventKey, EventStringId> = {
  /**
   * Event is triggered when updating the basemap layers
   */
  EVENT_BASEMAP_LAYERS_UPDATE: 'basemap/layers_update',
};
