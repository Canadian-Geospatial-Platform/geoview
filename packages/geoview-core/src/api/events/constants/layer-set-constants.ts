import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the LAYER_SET category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the LAYER_SET category */
export type LayerSetEventKey = 'UPDATED';

/** Record that associates LAYER_SET's event keys to their event string id */
export const LAYER_SET: Record<LayerSetEventKey, EventStringId> = {
  /**
   * Event triggered when a layer set has changed
   */
  UPDATED: 'layer_set/updated',
};
