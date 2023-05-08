import { ModifyEvent as OLModifyEvent } from 'ol/interaction/Modify';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a ModifyPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAModify: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ModifyPayload;
/**
 * Class definition for ModifyPayload
 *
 * @exports
 * @class ModifyPayload
 */
export declare class ModifyPayload extends PayloadBaseClass {
    modifyInfo: OLModifyEvent;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {OLModifyEvent} modifyInfo the boolean value carried by the payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, modifyInfo: OLModifyEvent);
}
/**
 * Helper function used to instanciate a ModifyPayload object. This function
 * avoids the "new ModifyPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLModifyEvent} modify the modifying information carried by the payload
 *
 * @returns {ModifyPayload} the ModifyPayload object created
 */
export declare const modifyPayload: (event: EventStringId, handlerName: string | null, modify: OLModifyEvent) => ModifyPayload;
