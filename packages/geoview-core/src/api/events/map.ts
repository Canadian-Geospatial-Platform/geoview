/**
 * A constant that exports all event types for the map
 */
export const MAP = {
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
