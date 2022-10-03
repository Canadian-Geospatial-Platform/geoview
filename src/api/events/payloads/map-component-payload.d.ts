/// <reference types="react" />
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * Type Gard function that redefines a PayloadBaseClass as a MapComponentPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export declare const payloadIsAMapComponent: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapComponentPayload;
/**
 * Class definition for MapComponentPayload
 *
 * @exports
 * @class MapComponentPayload
 */
export declare class MapComponentPayload extends PayloadBaseClass {
    id: string;
    component?: JSX.Element;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {string} id the map component identifier
     * @param {JSX.Element} component the map component element
     */
    constructor(event: EventStringId, handlerName: string | null, id: string, component?: JSX.Element);
}
/**
 * Helper function used to instanciate a MapComponentPayload object. This function
 * avoids the "new MapComponentPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} id the map component identifier
 * @param {JSX.Element} component the map component element
 *
 * @returns {MapComponentPayload} the MapComponentPayload object created
 */
export declare const mapComponentPayload: (event: EventStringId, handlerName: string | null, id: string, component?: JSX.Element) => MapComponentPayload;
