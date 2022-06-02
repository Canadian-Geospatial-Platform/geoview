import { EventStringId } from '../event';

/**
 * This file defines the constants of the MAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the MAP category */
export type MapEventKey =
  | 'EVENT_MAP_LOADED'
  | 'EVENT_MAP_RELOAD'
  | 'EVENT_MAP_MOVE_END'
  | 'EVENT_MAP_ZOOM_END'
  | 'EVENT_MAP_ADD_COMPONENT'
  | 'EVENT_MAP_REMOVE_COMPONENT'
  | 'EVENT_MAP_IN_KEYFOCUS'
  | 'EVENT_MAP_CROSSHAIR_ENABLE_DISABLE';

/** Record that associates MAP's event keys to their event string id */
export const MAP: Record<MapEventKey, EventStringId> = {
  /**
   * Event triggered when map is loaded and api ready
   */
  EVENT_MAP_LOADED: 'map/loaded',

  /**
   * Event triggered to reload the map
   */
  EVENT_MAP_RELOAD: 'map/reload',

  /**
   * Event triggered when a user stops moving the map
   */
  EVENT_MAP_MOVE_END: 'map/moveend',

  /**
   * Event triggered when a user stops zooming the map
   */
  EVENT_MAP_ZOOM_END: 'map/zoomend',

  /**
   * Event triggered when a user wants to add a component
   */
  EVENT_MAP_ADD_COMPONENT: 'map/add_component',

  /**
   * Event triggered when a user wants to remove a component
   */
  EVENT_MAP_REMOVE_COMPONENT: 'map/remove_component',

  /**
   * Event triggered when a user focus the map with keyboard (WCAG)
   */
  EVENT_MAP_IN_KEYFOCUS: 'map/inkeyfocus',

  /**
   * Event triggered to enable / disable crosshair
   */
  EVENT_MAP_CROSSHAIR_ENABLE_DISABLE: 'map/crosshair_enable_disable',
};
