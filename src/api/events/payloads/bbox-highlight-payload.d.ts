import { Extent } from 'ol/extent';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a BBoxHighlightPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsABBoxHighlight: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is BBoxHighlightPayload;
/**
 * Class definition for BBoxHighlightPayload
 *
 * @exports
 * @class BBoxHighlightPayload
 */
export declare class BBoxHighlightPayload extends PayloadBaseClass {
    bbox: Extent;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler name
     * @param {Extent} bbox the bounding box to highlight
     */
    constructor(event: EventStringId, handlerName: string | null, bbox: Extent);
}
/**
 * Helper function used to instanciate a BBoxHighlightPayload object. This function
 * avoids the "new BBoxHighlightPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler name
 * @param {Extent} bbox the bounding box to highlight
 *
 * @returns {BBoxHighlightPayload} the BBoxHighlightPayload object created
 */
export declare const bboxHighlightPayload: (event: EventStringId, handlerName: string | null, bbox: Extent) => BBoxHighlightPayload;
