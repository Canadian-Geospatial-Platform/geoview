import { EventStringId } from '@/api/events/event-types';

/**
 * This file defines the constants of the MAP category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

// TODO: repair map event as some of them does not exist on OL.... i.e. zoomend, OL uses change:moveend or change:resollution on view object
/** Valid keys for the MAP category */
export type MapEventKey = 'EVENT_MAP_ADD_COMPONENT' | 'EVENT_MAP_IN_KEYFOCUS' | 'EVENT_MAP_RELOAD' | 'EVENT_MAP_REMOVE_COMPONENT';

/** Record that associates MAP's event keys to their event string id */
export const MAP: Record<MapEventKey, EventStringId> = {
  /**
   * Event triggered when a user wants to add a component
   */
  EVENT_MAP_ADD_COMPONENT: 'map/add_component',

  /**
   * Event triggered when a user focus the map with keyboard (WCAG)
   */
  EVENT_MAP_IN_KEYFOCUS: 'map/inkeyfocus',

  /**
   * Event triggered to reload the map
   */
  EVENT_MAP_RELOAD: 'map/reload',

  /**
   * Event triggered when a user wants to remove a component
   */
  EVENT_MAP_REMOVE_COMPONENT: 'map/remove_component',
};
