import { Feature } from 'ol';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { CONST_VECTOR_TYPES, TypeOfVector } from '../../../geo/layer/vector/vector-types';

/** Valid events that can create VectorPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED];

/**
 * Type Gard function that redefines a PayloadBaseClass as a VectorPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAVector = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is VectorPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Type Gard function that redefines a PayloadBaseClass as a CirclePayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsACircle = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CirclePayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE;
  }
  return false;
};

/**
 * Additional attributes needed to define a CirclePayload
 */
export interface CirclePayload extends VectorPayload {
  circle: Feature;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a CircleMarkerPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsACircleMarker = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleMarkerPayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE_MARKER;
  }
  return false;
};

/**
 * Additional attributes needed to define a CircleMarkerPayload
 */
export interface CircleMarkerPayload extends VectorPayload {
  circleMarker: Feature;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a MarkerPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAMarker = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerPayload => {
  if (payloadIsAMarker(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.MARKER;
  }
  return false;
};

/**
 * Additional attributes needed to define a MarkerPayload
 */
export interface MarkerPayload extends VectorPayload {
  marker: Feature;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a PolygonPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAPolygon = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonPayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYGON;
  }
  return false;
};

/**
 * Additional attributes needed to define a PolygonPayload
 */
export interface PolygonPayload extends VectorPayload {
  polygon: Feature;
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a PolylinePayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAPolyline = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylinePayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYLINE;
  }
  return false;
};

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
export class VectorPayload extends PayloadBaseClass {
  // The type of vector payload
  type: TypeOfVector;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeOfVector} type the type of vector object that makes up the payload
   */
  constructor(event: EventStringId, handlerName: string | null, type: TypeOfVector) {
    if (!validEvents.includes(event)) throw new Error(`VectorPayload can't be instanciated for event of type ${event}`);
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
    const circlePayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.CIRCLE) as CirclePayload;
    circlePayload.circle = circle;
    return circlePayload;
  };

  /**
   * Static method used to create a CircleMarkerPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Feature} circleMarker the circle marker payload
   *
   * @returns {CircleMarkerPayload} the CircleMarkerPayload object created
   */
  static forCircleMarker = (event: EventStringId, handlerName: string | null, circleMarker: Feature): CircleMarkerPayload => {
    const circleMarkerPayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.CIRCLE_MARKER) as CircleMarkerPayload;
    circleMarkerPayload.circleMarker = circleMarker;
    return circleMarkerPayload;
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
    const markerPayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.MARKER) as MarkerPayload;
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
    const polygonPayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON) as PolygonPayload;
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
    const polylinePayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON) as PolylinePayload;
    polylinePayload.polyline = polyline;
    return polylinePayload;
  };
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
export const vectorPayload = (event: EventStringId, handlerName: string | null, type: TypeOfVector): VectorPayload => {
  return new VectorPayload(event, handlerName, type);
};
