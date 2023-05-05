import { TranslateEvent as OLTranslateEvent } from 'ol/interaction/Translate';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a TranslatePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsATranslate: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is TranslatePayload;
/**
 * Class definition for TranslatePayload
 *
 * @exports
 * @class TranslatePayload
 */
export declare class TranslatePayload extends PayloadBaseClass {
    translateInfo: OLTranslateEvent;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {OLTranslateEvent} translateInfo the translate information carried by the payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, translateInfo: OLTranslateEvent);
}
/**
 * Helper function used to instanciate a TranslatePayload object. This function
 * avoids the "new TranslatePayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLTranslateEvent} translateInfo the translate information carried by the payload
 *
 * @returns {TranslatePayload} the Translate Payload object created
 */
export declare const translatePayload: (event: EventStringId, handlerName: string | null, translate: OLTranslateEvent) => TranslatePayload;
