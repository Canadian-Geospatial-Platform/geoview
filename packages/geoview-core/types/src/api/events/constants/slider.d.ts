import { EventStringId } from '../event';
/**
 * This file defines the constants of the SLIDER category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */
export declare type SliderEventKey = 'EVENT_SLIDER_CHANGE' | 'EVENT_SLIDER_SET_VALUES' | 'EVENT_SLIDER_SET_MINMAX';
export declare const SLIDER: Record<SliderEventKey, EventStringId>;
