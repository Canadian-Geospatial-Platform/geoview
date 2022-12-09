import { EventStringId } from '../event-types';
/**
 * This file defines the constants of the SLIDER category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
/** Valid keys for the SLIDER category */
export type SliderEventKey = 'EVENT_SLIDER_CHANGE' | 'EVENT_SLIDER_SET_VALUES' | 'EVENT_SLIDER_SET_MINMAX';
/** Record that associates SLIDER's event keys to their event string id */
export declare const SLIDER: Record<SliderEventKey, EventStringId>;
