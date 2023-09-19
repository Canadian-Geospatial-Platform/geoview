import { Feature } from 'ol';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeOfGeometry } from '@/geo/layer/geometry/geometry-types';
/**
 * type guard function that redefines a PayloadBaseClass as a GeometryPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAGeometry: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is GeometryPayload;
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
export interface CirclePayload extends GeometryPayload {
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
export interface MarkerPayload extends GeometryPayload {
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
export interface PolygonPayload extends GeometryPayload {
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
export interface PolylinePayload extends GeometryPayload {
    polyline: Feature;
}
/**
 * Class definition for GeometryPayload
 *
 * @exports
 * @class GeometryPayload
 */
export declare class GeometryPayload extends PayloadBaseClass {
    type: TypeOfGeometry;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeOfGeometry} type the type of geometry object that makes up the payload
     */
    constructor(event: EventStringId, handlerName: string | null, type: TypeOfGeometry);
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
 * Helper function used to instanciate a GeometryPayload object. This function
 * avoids the "new GeometryPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeOfGeometry} type the type of geometry object that makes up the payload
 *
 * @returns {GeometryPayload} the GeometryPayload object created
 */
export declare const geometryPayload: (event: EventStringId, handlerName: string | null, type: TypeOfGeometry) => GeometryPayload;
