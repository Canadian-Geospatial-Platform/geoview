import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the MAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the MAP category */
export type MapEventKey = 'EVENT_MAP_LOADED' | 'EVENT_MAP_RELOAD' | 'EVENT_MAP_MOVE_END' | 'EVENT_MAP_SINGLE_CLICK' | 'EVENT_MAP_POINTER_MOVE' | 'EVENT_MAP_ZOOM_END' | 'EVENT_MAP_ADD_COMPONENT' | 'EVENT_MAP_REMOVE_COMPONENT' | 'EVENT_MAP_IN_KEYFOCUS' | 'EVENT_MAP_CROSSHAIR_ENTER' | 'EVENT_MAP_VIEW_PROJECTION_CHANGE' | 'EVENT_MAP_FIX_NORTH';
/** Record that associates MAP's event keys to their event string id */
export declare const MAP: Record<MapEventKey, EventStringId>;
