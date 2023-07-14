import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a ClearHighlightsPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAClearHighlights: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ClearHighlightsPayload;
/**
 * Class definition for ClearHighlightsPayload
 *
 * @exports
 * @class ClearHighlightsPayload
 */
export declare class ClearHighlightsPayload extends PayloadBaseClass {
    id: string;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {string} id the Uid of the feature to remove highlight from or 'all'
     */
    constructor(event: EventStringId, handlerName: string | null, id: string);
}
/**
 * Helper function used to instanciate a ClearHighlightsPayload object. This function
 * avoids the "new ClearHighlightsPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} id the Uid of the feature to remove highlight from or 'all'
 *
 * @returns {FeatureHighlightPayload} the FeatureHighlightPayload object created
 */
export declare const clearHighlightsPayload: (event: EventStringId, handlerName: string | null, id: string) => ClearHighlightsPayload;
