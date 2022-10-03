import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the LAYER category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the LAYER category */
export declare type LayerEventKey = 'EVENT_LAYER_ADD' | 'EVENT_LAYER_ADDED' | 'EVENT_REMOVE_LAYER' | 'EVENT_GET_LAYERS';
/** Record that associates LAYER's event keys to their event string id */
export declare const LAYER: Record<LayerEventKey, EventStringId>;
