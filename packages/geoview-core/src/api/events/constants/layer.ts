import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the LAYER category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the LAYER category */
export type LayerEventKey = 'EVENT_ADD_LAYER' | 'EVENT_LAYER_ADDED' | 'EVENT_REMOVE_LAYER';

/** Record that associates LAYER's event keys to their event string id */
export const LAYER: Record<LayerEventKey, EventStringId> = {
  /**
   * Event triggered when adding a new layer
   */
  EVENT_ADD_LAYER: 'layer/add',

  /**
   * Event triggered when adding a new layer
   */
  EVENT_LAYER_ADDED: 'layer/added',

  /**
   * Event triggered when removing a layer
   */
  EVENT_REMOVE_LAYER: 'layer/remove',
};
