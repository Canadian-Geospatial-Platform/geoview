import { EventStringId } from '../event';

/**
 * This file defines the constants of the SLIDER category. The constants are placed
 * in a record that associates an event key with its event string id for each event.
 */

// Valid keys for the SLIDER category
export type SliderEventKey = 'EVENT_SLIDER_CHANGE' | 'EVENT_SLIDER_SET_VALUES' | 'EVENT_SLIDER_SET_MINMAX';

// Record that associates SLIDER's event keys to their event string id
export const SLIDER: Record<SliderEventKey, EventStringId> = {
  /**
   * Event is triggered when slider value change
   */
  EVENT_SLIDER_CHANGE: 'slider/on_change_value',

  /**
   * Event is triggered to change slider handle value(s)
   */
  EVENT_SLIDER_SET_VALUES: 'slider/set_values',

  /**
   * Event is triggered to change slider min max values
   */
  EVENT_SLIDER_SET_MINMAX: 'slider/set_min_max',
};
