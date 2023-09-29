import { EventStringId } from '../event-types';

/**
 * This file defines the constants of the GEOMETRY category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

/** Valid keys for the GEOMETRY category */
export type GeometryEventKey =
  | 'EVENT_GEOMETRY_ADD'
  | 'EVENT_GEOMETRY_REMOVE'
  | 'EVENT_GEOMETRY_ADDED'
  | 'EVENT_GEOMETRY_OFF'
  | 'EVENT_GEOMETRY_ON';

/** Record that associates GEOMETRY's event keys to their event string id */
export const GEOMETRY: Record<GeometryEventKey, EventStringId> = {
  /**
   * Event triggered when a request is made to add a geometry
   */
  EVENT_GEOMETRY_ADD: 'geometry/add',

  /**
   * Event triggered when a request is made to remove a geometry
   */
  EVENT_GEOMETRY_REMOVE: 'geometry/remove',

  /**
   * Event is triggered when a geometry has been added
   */
  EVENT_GEOMETRY_ADDED: 'geometry/added',

  /**
   * Event is triggered when you want to turn off all visible geometries
   */
  EVENT_GEOMETRY_OFF: 'geometry/off',

  /**
   * Event is triggered when you want to turn on all visible geometries
   */
  EVENT_GEOMETRY_ON: 'geometry/on',
};
