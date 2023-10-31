import { ExtentEvent as OLExtentEvent } from 'ol/interaction/Extent';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a ExtentPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAnExtent: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ExtentPayload;
/**
 * Class definition for ExtentPayload
 *
 * @exports
 * @class ExtentPayload
 */
export declare class ExtentPayload extends PayloadBaseClass {
    extentInfo: OLExtentEvent;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {OLExtentEvent} extentInfo the extent information carried by the payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, extentInfo: OLExtentEvent);
}
/**
 * Helper function used to instanciate a ExtentPayload object. This function
 * avoids the "new ExtentPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLExtentEvent} extent the extent information carried by the payload
 *
 * @returns {ExtentPayload} the ExtentPayload object created
 */
export declare const extentPayload: (event: EventStringId, handlerName: string | null, extent: OLExtentEvent) => ExtentPayload;
