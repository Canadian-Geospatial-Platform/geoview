import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create SliderPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.SLIDER.EVENT_SLIDER_CHANGE,
  EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_VALUES,
  EVENT_NAMES.SLIDER.EVENT_SLIDER_SET_MINMAX,
];

/**
 * type guard function that redefines a PayloadBaseClass as a SliderPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsASlider = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SliderPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Attributes needed to define a SliderPayload
 */
export interface SliderTypePayload {
  // limits (min max)
  min: number;
  max: number;

  // value(s)
  value: number[] | number;

  // active thumb
  activeThumb: number;
}

/**
 * Class definition for SliderPayload
 *
 * @exports
 * @class SliderPayload
 */
export class SliderPayload extends PayloadBaseClass {
  sliderValues: SliderTypePayload;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {number[]} sliderValues the current slider values
   */
  constructor(event: EventStringId, handlerName: string | null, sliderValues: SliderTypePayload) {
    if (!validEvents.includes(event)) throw new Error(`SliderPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.sliderValues = sliderValues;
  }
}

/**
 * Helper function used to instanciate a SliderPayload object. This function
 * avoids the "new SliderPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {number} sliderValues the value of the number carried by the payload
 *
 * @returns {SliderPayload} the SliderPayload object created
 */
export const sliderPayload = (event: EventStringId, handlerName: string | null, sliderValues: SliderTypePayload): SliderPayload => {
  return new SliderPayload(event, handlerName, sliderValues);
};
