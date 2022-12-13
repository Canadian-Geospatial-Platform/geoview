import { Coordinate } from 'ol/coordinate';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/** Type used to define an map single click action  */
export type TypeMapSingleClick = {
    lnglat: Coordinate;
    pixel: Coordinate;
    projected: Coordinate;
};
/**
 * type guard function that redefines a PayloadBaseClass as a MapSingleClickPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAMapSingleClick: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapSingleClickPayload;
/**
 * Class definition for MapSingleClick
 *
 * @exports
 * @class MapSingleClick
 */
export declare class MapSingleClickPayload extends PayloadBaseClass {
    coordinates: TypeMapSingleClick;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeMapSingleClick} coordinates the coordinates (lnglat, pixel and projected) values carried by the payload
     */
    constructor(event: EventStringId, handlerName: string | null, coordinates: TypeMapSingleClick);
}
/**
 * Helper function used to instanciate a MapSingleClickPayload object. This function
 * avoids the "new MapSingleClickPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeMapSingleClick} coordinates the long lat values carried by the payload
 *
 * @returns {MapSingleClickPayload} the MapSingleClickPayload object created
 */
export declare const mapSingleClickPayload: (event: EventStringId, handlerName: string | null, coordinates: TypeMapSingleClick) => MapSingleClickPayload;
