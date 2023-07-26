import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the LAYER_SET category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the LAYER_SET category */
export type LayerSetEventKey = 'REQUEST_LAYER_INVENTORY' | 'LAYER_REGISTRATION' | 'CHANGE_LAYER_STATUS' | 'UPDATED';

/** Record that associates LAYER_SET's event keys to their event string id */
export const LAYER_SET: Record<LayerSetEventKey, EventStringId> = {
  /**
   * Event triggered when a panel wants to inventory the layers of a map
   */
  REQUEST_LAYER_INVENTORY: 'layer_set/request_layer_inventory',

  /**
   * Event triggered when a layer wants to register to the layer set
   */
  LAYER_REGISTRATION: 'layer_set/layer_registration',

  /**
   * Event triggered when a layer's status has changed
   */
  CHANGE_LAYER_STATUS: 'layer_set/change_layer_status',

  /**
   * Event triggered when a layer set has changed
   */
  UPDATED: 'layer_set/updated',
};
