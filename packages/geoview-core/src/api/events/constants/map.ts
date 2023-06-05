import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the MAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

// TODO: repair map event as some of them does not exist on OL.... i.e. zoomend, OL uses change:moveend or change:resollution on view object
/** Valid keys for the MAP category */
export type MapEventKey =
  | 'EVENT_MAP_LOADED'
  | 'EVENT_MAP_RELOAD'
  | 'EVENT_MAP_MOVE_END'
  | 'EVENT_MAP_SINGLE_CLICK'
  | 'EVENT_MAP_POINTER_MOVE'
  | 'EVENT_MAP_ZOOM_END'
  | 'EVENT_MAP_ADD_COMPONENT'
  | 'EVENT_MAP_REMOVE_COMPONENT'
  | 'EVENT_MAP_IN_KEYFOCUS'
  | 'EVENT_MAP_CROSSHAIR_ENABLE_DISABLE'
  | 'EVENT_MAP_CROSSHAIR_ENTER'
  | 'EVENT_MAP_VIEW_PROJECTION_CHANGE'
  | 'EVENT_MAP_FIX_NORTH';

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
   * Event triggered when a user does a true single click with no dragging and no double click. Note that this event is delayed by 250 ms to ensure that it is not a double click
   */
  EVENT_MAP_SINGLE_CLICK: 'map/singleclick',

  /**
   * Event triggered when a user does a pointer move
   */
  EVENT_MAP_POINTER_MOVE: 'map/pointermove',

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

  /**
   * Event triggered to crosshair enable and enter pressed
   */
  EVENT_MAP_CROSSHAIR_ENTER: 'map/crosshair_enter',

  /**
   * Event triggered to change map view projection
   */
  EVENT_MAP_VIEW_PROJECTION_CHANGE: 'map/view_projection_change',

  /**
   * Event triggered when user fix north to stay straight
   */
  EVENT_MAP_FIX_NORTH: 'map/fix_north',
};
