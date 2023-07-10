import { Coordinate } from 'ol/coordinate';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/** Type used to define the map mouse information  */
export type TypeMapMouseInfo = {
    lnglat: Coordinate;
    pixel: Coordinate;
    projected: Coordinate;
    dragging: boolean;
};
/**
 * type guard function that redefines a PayloadBaseClass as a MapMouseEventPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAMapMouseEvent: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapMouseEventPayload;
/**
 * Class definition for MapMouseEventPayload
 *
 * @exports
 * @class MapMouseEventPayload
 */
export declare class MapMouseEventPayload extends PayloadBaseClass {
    coordinates: TypeMapMouseInfo;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeMapMouseInfo} coordinates the coordinates (lnglat, pixel and projected) values carried by the payload
     */
    constructor(event: EventStringId, handlerName: string | null, coordinates: TypeMapMouseInfo);
}
/**
 * Helper function used to instanciate a MapMouseEventPayload object. This function
 * avoids the "new MapMouseEventPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapMouseInfo} coordinates the long lat values carried by the payload
 *
 * @returns {MapMouseEventPayload} the MapMouseEventPayload object created
 */
export declare const mapMouseEventPayload: (event: EventStringId, handlerName: string | null, coordinates: TypeMapMouseInfo) => MapMouseEventPayload;
