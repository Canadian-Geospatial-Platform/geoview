import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a BooleanPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsABoolean: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is BooleanPayload;
/**
 * Class definition for BooleanPayload
 *
 * @exports
 * @class BooleanPayload
 */
export declare class BooleanPayload extends PayloadBaseClass {
    status: boolean;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {boolean} status the boolean value carried by the payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, status: boolean);
}
/**
 * Helper function used to instanciate a BooleanPayload object. This function
 * avoids the "new BooleanPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {boolean} status the boolean value carried by the payload
 *
 * @returns {BooleanPayload} the BooleanPayload object created
 */
export declare const booleanPayload: (event: EventStringId, handlerName: string | null, status: boolean) => BooleanPayload;
