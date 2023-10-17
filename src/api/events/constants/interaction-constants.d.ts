import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the DRAW category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the INTERACTION category */
export type InteractionEventKey = 'EVENT_SELECTED' | 'EVENT_DRAW_STARTED' | 'EVENT_DRAW_ENDED' | 'EVENT_DRAW_ABORTED' | 'EVENT_MODIFY_STARTED' | 'EVENT_MODIFY_ENDED' | 'EVENT_TRANSLATE_STARTED' | 'EVENT_TRANSLATE_ENDED';
/** Record that associates DRAW's event keys to their event string id */
export declare const INTERACTION: Record<InteractionEventKey, EventStringId>;
