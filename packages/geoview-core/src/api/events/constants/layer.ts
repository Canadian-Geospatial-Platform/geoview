import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the LAYER category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the LAYER category */
export type LayerEventKey = 'EVENT_ADD_LAYER' | 'EVENT_LAYER_ADDED' | 'EVENT_REMOVE_LAYER' | 'EVENT_IF_CONDITION';

/** Record that associates LAYER's event keys to their event string id */
export const LAYER: Record<LayerEventKey, EventStringId> = {
  /**
   * Event triggered to add a new layer
   */
  EVENT_ADD_LAYER: 'layer/add',

  /**
   * Event triggered when a new layer has been added
   */
  EVENT_LAYER_ADDED: 'layer/added',

  /**
   * Event triggered to remove a layer
   */
  EVENT_REMOVE_LAYER: 'layer/remove',

  /**
   * Event triggered to test a condition related to the geoview layers
   */
  EVENT_IF_CONDITION: 'layer/if_condition',
};
