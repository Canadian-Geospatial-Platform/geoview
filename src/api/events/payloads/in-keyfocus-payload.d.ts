import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a InKeyfocusPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAInKeyfocus: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is InKeyfocusPayload;
/**
 * Class definition for InKeyfocusPayload
 *
 * @exports
 * @class InKeyfocusPayload
 */
export declare class InKeyfocusPayload extends PayloadBaseClass {
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     */
    constructor(event: EventStringId, handlerName: string | null);
}
/**
 * Helper function used to instanciate a InKeyfocusPayload object. This function
 * avoids the "new InKeyfocusPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {InKeyfocusPayload} the InKeyfocusPayload object created
 */
export declare const inKeyfocusPayload: (event: EventStringId, handlerName: string | null) => InKeyfocusPayload;
