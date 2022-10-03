import OLMap from 'ol/Map';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a MapPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAMap: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapPayload;
/**
 * Class definition for MapPayload
 *
 * @exports
 * @class MapPayload
 */
export declare class MapPayload extends PayloadBaseClass {
    map: OLMap;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {OLMap} map the map payload
     */
    constructor(event: EventStringId, handlerName: string | null, map: OLMap);
}
/**
 * Helper function used to instanciate a MapPayload object. This function
 * avoids the "new MapPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLMap} map the map payload
 *
 * @returns {MapPayload} the MapPayload object created
 */
export declare const mapPayload: (event: EventStringId, handlerName: string | null, map: OLMap) => MapPayload;
