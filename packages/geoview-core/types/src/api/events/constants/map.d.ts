import { EventStringId } from '../event';
/**
 * This file defines the constants of the MAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
export declare type MapEventKey = 'EVENT_MAP_LOADED' | 'EVENT_MAP_RELOAD' | 'EVENT_MAP_MOVE_END' | 'EVENT_MAP_ZOOM_END' | 'EVENT_MAP_ADD_COMPONENT' | 'EVENT_MAP_REMOVE_COMPONENT' | 'EVENT_MAP_IN_KEYFOCUS' | 'EVENT_MAP_CROSSHAIR_ENABLE_DISABLE';
export declare const MAP: Record<MapEventKey, EventStringId>;
