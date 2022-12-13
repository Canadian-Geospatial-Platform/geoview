import { Coordinate } from 'ol/coordinate';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a LngLatPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsALngLat: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is LngLatPayload;
/**
 * Class definition for LngLatPayload
 *
 * @exports
 * @class LngLatPayload
 */
export declare class LngLatPayload extends PayloadBaseClass {
    lnglat: Coordinate;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {Coordinate} lnglat the long lat values carried by the payload
     */
    constructor(event: EventStringId, handlerName: string | null, lnglat: Coordinate);
}
/**
 * Helper function used to instanciate a LngLatPayload object. This function
 * avoids the "new LngLatPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {Coordinate} lnglat the long lat values carried by the payload
 *
 * @returns {LngLatPayload} the LngLatPayload object created
 */
export declare const lngLatPayload: (event: EventStringId, handlerName: string | null, lnglat: Coordinate) => LngLatPayload;
