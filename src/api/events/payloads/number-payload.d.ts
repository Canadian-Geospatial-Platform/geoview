import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a NumberPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsANumber: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is NumberPayload;
/**
 * Class definition for NumberPayload
 *
 * @exports
 * @class NumberPayload
 */
export declare class NumberPayload extends PayloadBaseClass {
    value: number;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {number} value the value of the number carried by the payload
     */
    constructor(event: EventStringId, handlerName: string | null, value: number);
}
/**
 * Helper function used to instanciate a NumberPayload object. This function
 * avoids the "new NumberPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {number} value the value of the number carried by the payload
 *
 * @returns {NumberPayload} the NumberPayload object created
 */
export declare const numberPayload: (event: EventStringId, handlerName: string | null, value: number) => NumberPayload;
