import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the ATTRIBUTION category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the ATTRIBUTION category */
export declare type AttributionEventKey = 'EVENT_ATTRIBUTION_UPDATE';
/** Record that associates ATTRIBUTION's event keys to their event string id */
export declare const ATTRIBUTION: Record<AttributionEventKey, EventStringId>;
