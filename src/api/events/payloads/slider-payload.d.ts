import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a SliderPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsASlider: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is SliderPayload;
/**
 * Attributes needed to define a SliderPayload
 */
export interface SliderTypePayload {
    min: number;
    max: number;
    value: number[] | number;
    activeThumb: number;
}
/**
 * Class definition for SliderPayload
 *
 * @exports
 * @class SliderPayload
 */
export declare class SliderPayload extends PayloadBaseClass {
    sliderValues: SliderTypePayload;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {number[]} sliderValues the current slider values
     */
    constructor(event: EventStringId, handlerName: string | null, sliderValues: SliderTypePayload);
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
export declare const sliderPayload: (event: EventStringId, handlerName: string | null, sliderValues: SliderTypePayload) => SliderPayload;
