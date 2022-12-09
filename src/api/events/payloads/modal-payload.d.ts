import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a ModalPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAModal: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ModalPayload;
/**
 * Class definition for ModalPayload
 *
 * @exports
 * @class ModalPayload
 */
export declare class ModalPayload extends PayloadBaseClass {
    modalId: string;
    open?: boolean;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {string} modalId the modal identifier
     * @param {boolean} open optional flag used to specify if the modal is open
     */
    constructor(event: EventStringId, handlerName: string | null, modalId: string, open?: boolean);
}
/**
 * Helper function used to instanciate a ModalPayload object. This function
 * avoids the "new ModalPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} modalId the modal identifier
 * @param {boolean} open optional flag used to specify if the modal is open
 *
 * @returns {ModalPayload} the ModalPayload object created
 */
export declare const modalPayload: (event: EventStringId, handlerName: string | null, modalId: string, open?: boolean) => ModalPayload;
