import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeValidMapProjectionCodes } from '../../../geo/map/map-schema-types';
/**
 * type guard function that redefines a PayloadBaseClass as a MapViewProjectionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAMapViewProjection: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapViewProjectionPayload;
/**
 * Class definition for MapViewProjectionPayload
 *
 * @exports
 * @class MapViewProjectionPayload
 */
export declare class MapViewProjectionPayload extends PayloadBaseClass {
    projection: TypeValidMapProjectionCodes;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {number} projection the map view projection
     */
    constructor(event: EventStringId, handlerName: string | null, projection: TypeValidMapProjectionCodes);
}
/**
 * Helper function used to instanciate a MapViewProjectionPayload object. This function
 * avoids the "new MapViewProjectionPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {number} projection the map view projection
 *
 * @returns {MapViewProjectionPayload} the MapViewProjectionPayload object created
 */
export declare const mapViewProjectionPayload: (event: EventStringId, handlerName: string | null, projection: TypeValidMapProjectionCodes) => MapViewProjectionPayload;
