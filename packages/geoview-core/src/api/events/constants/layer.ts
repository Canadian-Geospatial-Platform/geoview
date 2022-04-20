import { EventStringId } from '../event';

/**
 * Constant that contains layer event types
 */

export type LayerEventKey = 'EVENT_LAYER_ADD' | 'EVENT_LAYER_ADDED' | 'EVENT_REMOVE_LAYER' | 'EVENT_GET_LAYERS';

export const LAYER: Record<LayerEventKey, EventStringId> = {
  /**
   * Event triggered when adding a new layer
   */
  EVENT_LAYER_ADD: 'layer/add',

  /**
   * Event triggered when adding a new layer
   */
  EVENT_LAYER_ADDED: 'layer/added',

  /**
   * Event triggered when removing a layer
   */
  EVENT_REMOVE_LAYER: 'layer/remove',

  // TODO there is no code linked to the following event for the moment
  /**
   * Event triggered when getting all layers
   */
  EVENT_GET_LAYERS: 'layer/get_layers',
};
