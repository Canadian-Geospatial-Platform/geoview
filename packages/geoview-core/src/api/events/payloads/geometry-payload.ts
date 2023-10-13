import { Feature } from 'ol';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { CONST_GEOMETRY_TYPES, TypeOfGeometry } from '@/geo/layer/geometry/geometry-types';

/** Valid events that can create GeometryPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.GEOMETRY.EVENT_GEOMETRY_ADDED];

/**
 * type guard function that redefines a PayloadBaseClass as a GeometryPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAGeometry = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GeometryPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * type guard function that redefines a PayloadBaseClass as a CirclePayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsACircle = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CirclePayload => {
  if (payloadIsAGeometry(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.CIRCLE;
  }
  return false;
};

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
export const payloadIsAMarker = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerPayload => {
  if (payloadIsAMarker(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.MARKER;
  }
  return false;
};

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
export const payloadIsAPolygon = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonPayload => {
  if (payloadIsAGeometry(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.POLYGON;
  }
  return false;
};

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
export const payloadIsAPolyline = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylinePayload => {
  if (payloadIsAGeometry(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.POLYLINE;
  }
  return false;
};

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
export class GeometryPayload extends PayloadBaseClass {
  // The type of geometry payload
  type: TypeOfGeometry;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeOfGeometry} type the type of geometry object that makes up the payload
   */
  constructor(event: EventStringId, handlerName: string | null, type: TypeOfGeometry) {
    if (!validEvents.includes(event)) throw new Error(`GeometryPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.type = type;
  }

  /**
   * Static method used to create a CirclePayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Feature} circle the circle payload
   *
   * @returns {CirclePayload} the CirclePayload object created
   */
  static forCircle = (event: EventStringId, handlerName: string | null, circle: Feature): CirclePayload => {
    const circlePayload = new GeometryPayload(event, handlerName, CONST_GEOMETRY_TYPES.CIRCLE) as CirclePayload;
    circlePayload.circle = circle;
    return circlePayload;
  };

  /**
   * Static method used to create a MarkerPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Feature} marker the marker payload
   *
   * @returns {MarkerPayload} the MarkerPayload object created
   */
  static forMarker = (event: EventStringId, handlerName: string | null, marker: Feature): MarkerPayload => {
    const markerPayload = new GeometryPayload(event, handlerName, CONST_GEOMETRY_TYPES.MARKER) as MarkerPayload;
    markerPayload.marker = marker;
    return markerPayload;
  };

  /**
   * Static method used to create a PolygonPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Feature} polygon the polygon payload
   *
   * @returns {PolygonPayload} the PolygonPayload object created
   */
  static forPolygon = (event: EventStringId, handlerName: string | null, polygon: Feature): PolygonPayload => {
    const polygonPayload = new GeometryPayload(event, handlerName, CONST_GEOMETRY_TYPES.POLYGON) as PolygonPayload;
    polygonPayload.polygon = polygon;
    return polygonPayload;
  };

  /**
   * Static method used to create a PolylinePayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Feature} polyline the polyline payload
   *
   * @returns {PolylinePayload} the PolylinePayload object created
   */
  static forPolyline = (event: EventStringId, handlerName: string | null, polyline: Feature): PolylinePayload => {
    const polylinePayload = new GeometryPayload(event, handlerName, CONST_GEOMETRY_TYPES.POLYGON) as PolylinePayload;
    polylinePayload.polyline = polyline;
    return polylinePayload;
  };
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
export const geometryPayload = (event: EventStringId, handlerName: string | null, type: TypeOfGeometry): GeometryPayload => {
  return new GeometryPayload(event, handlerName, type);
};
