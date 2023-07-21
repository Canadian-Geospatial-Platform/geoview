import { Feature } from 'ol';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeOfVector } from '@/geo/layer/vector/vector-types';
/**
 * type guard function that redefines a PayloadBaseClass as a VectorPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAVector: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is VectorPayload;
/**
 * type guard function that redefines a PayloadBaseClass as a CirclePayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsACircle: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is CirclePayload;
/**
 * Additional attributes needed to define a CirclePayload
 */
export interface CirclePayload extends VectorPayload {
    circle: Feature;
}
/**
 * type guard function that redefines a PayloadBaseClass as a MarkerPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAMarker: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MarkerPayload;
/**
 * Additional attributes needed to define a MarkerPayload
 */
export interface MarkerPayload extends VectorPayload {
    marker: Feature;
}
/**
 * type guard function that redefines a PayloadBaseClass as a PolygonPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAPolygon: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PolygonPayload;
/**
 * Additional attributes needed to define a PolygonPayload
 */
export interface PolygonPayload extends VectorPayload {
    polygon: Feature;
}
/**
 * type guard function that redefines a PayloadBaseClass as a PolylinePayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAPolyline: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PolylinePayload;
/**
 * Additional attributes needed to define a PolylinePayload
 */
export interface PolylinePayload extends VectorPayload {
    polyline: Feature;
}
/**
 * Class definition for VectorPayload
 *
 * @exports
 * @class VectorPayload
 */
export declare class VectorPayload extends PayloadBaseClass {
    type: TypeOfVector;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeOfVector} type the type of vector object that makes up the payload
     */
    constructor(event: EventStringId, handlerName: string | null, type: TypeOfVector);
    /**
     * Static method used to create a CirclePayload
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {Feature} circle the circle payload
     *
     * @returns {CirclePayload} the CirclePayload object created
     */
    static forCircle: (event: EventStringId, handlerName: string | null, circle: Feature) => CirclePayload;
    /**
     * Static method used to create a MarkerPayload
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {Feature} marker the marker payload
     *
     * @returns {MarkerPayload} the MarkerPayload object created
     */
    static forMarker: (event: EventStringId, handlerName: string | null, marker: Feature) => MarkerPayload;
    /**
     * Static method used to create a PolygonPayload
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {Feature} polygon the polygon payload
     *
     * @returns {PolygonPayload} the PolygonPayload object created
     */
    static forPolygon: (event: EventStringId, handlerName: string | null, polygon: Feature) => PolygonPayload;
    /**
     * Static method used to create a PolylinePayload
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {Feature} polyline the polyline payload
     *
     * @returns {PolylinePayload} the PolylinePayload object created
     */
    static forPolyline: (event: EventStringId, handlerName: string | null, polyline: Feature) => PolylinePayload;
}
/**
 * Helper function used to instanciate a VectorPayload object. This function
 * avoids the "new VectorPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeOfVector} type the type of vector object that makes up the payload
 *
 * @returns {VectorPayload} the VectorPayload object created
 */
export declare const vectorPayload: (event: EventStringId, handlerName: string | null, type: TypeOfVector) => VectorPayload;
