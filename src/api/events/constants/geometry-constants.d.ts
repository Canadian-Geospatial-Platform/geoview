import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the GEOMETRY category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the GEOMETRY category */
export type GeometryEventKey = 'EVENT_GEOMETRY_ADD' | 'EVENT_GEOMETRY_REMOVE' | 'EVENT_GEOMETRY_ADDED' | 'EVENT_GEOMETRY_OFF' | 'EVENT_GEOMETRY_ON';
/** Record that associates GEOMETRY's event keys to their event string id */
export declare const GEOMETRY: Record<GeometryEventKey, EventStringId>;
