import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { CONST_VECTOR_TYPES, TypeOfVector } from '../../../core/types/cgpv-types';

// Valid events that can create VectorConfigPayload
const validEvents: EventStringId[] = [EVENT_NAMES.VECTOR.EVENT_VECTOR_ADD, EVENT_NAMES.VECTOR.EVENT_VECTOR_REMOVE];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a VectorConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAVectorConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is VectorConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a CircleConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsACircleConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE;
  }
  return false;
};

/*
 * Additional attributes needed to define a CircleConfigPayload
 */
export interface CircleConfigPayload extends VectorConfigPayload {
  latitude: number;

  longitude: number;

  options: L.CircleMarkerOptions;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a CircleMarkerConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsACircleMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleMarkerConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE_MARKER;
  }
  return false;
};

/*
 * Additional attributes needed to define a CircleMarkerConfigPayload
 */
export interface CircleMarkerConfigPayload extends VectorConfigPayload {
  latitude: number;

  longitude: number;

  options: L.CircleMarkerOptions;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a MarkerConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.MARKER;
  }
  return false;
};

/*
 * Additional attributes needed to define a MarkerConfigPayload
 */
export interface MarkerConfigPayload extends VectorConfigPayload {
  latitude: number;

  longitude: number;

  options: L.MarkerOptions;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a PolygonConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAPolygonConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYGON;
  }
  return false;
};

/*
 * Additional attributes needed to define a PolygonConfigPayload
 */
export interface PolygonConfigPayload extends VectorConfigPayload {
  points: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][];

  options: L.PolylineOptions;
}

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a PolylineConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAPolylineConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylineConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYLINE;
  }
  return false;
};

/*
 * Additional attributes needed to define a PolylineConfigPayload
 */
export interface PolylineConfigPayload extends VectorConfigPayload {
  points: L.LatLngExpression[] | L.LatLngExpression[][];

  options: L.PolylineOptions;
}

/* ******************************************************************************************************************************
 * Class definition for VectorConfigPayload
 */
export class VectorConfigPayload extends PayloadBaseClass {
  // The type of vector payload
  type: TypeOfVector;

  // The vector object identifier
  id?: string;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {TypeOfVector} the type of vector configuration object that makes up the payload
   * @param {string} the vector object identifier
   *
   * @returns {VectorConfigPayload} the VectorConfigPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, type: TypeOfVector, id?: string) {
    if (!validEvents.includes(event)) throw new Error(`VectorConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.type = type;
    this.id = id;
  }

  /*
   * Static method used to create a CircleConfigPayload
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {number} the circle latitude
   * @param {number} the circle longitude
   * @param {L.CircleMarkerOptions} the circle options
   * @param {string} optional circle identifier
   *
   * @returns {CircleConfigPayload} the CircleConfigPayload object created
   */
  static forCircle = (
    event: EventStringId,
    handlerName: string | null,
    latitude: number,
    longitude: number,
    options: L.CircleMarkerOptions,
    id?: string
  ): CircleConfigPayload => {
    const circleConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.CIRCLE, id) as CircleConfigPayload;
    circleConfigPayload.latitude = latitude;
    circleConfigPayload.longitude = longitude;
    circleConfigPayload.options = options;
    return circleConfigPayload;
  };

  /*
   * Static method used to create a CircleMarkerConfigPayload
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {number} the circle marker latitude
   * @param {number} the circle marker longitude
   * @param {L.CircleMarkerOptions} the circle marker options
   * @param {string} optional circle marker identifier
   *
   * @returns {CircleMarkerConfigPayload} the CircleMarkerConfigPayload object created
   */
  static forCircleMarker = (
    event: EventStringId,
    handlerName: string | null,
    latitude: number,
    longitude: number,
    options: L.CircleMarkerOptions,
    id?: string
  ): CircleMarkerConfigPayload => {
    const circleMarkerConfigPayload = new VectorConfigPayload(
      event,
      handlerName,
      CONST_VECTOR_TYPES.CIRCLE_MARKER,
      id
    ) as CircleMarkerConfigPayload;
    circleMarkerConfigPayload.latitude = latitude;
    circleMarkerConfigPayload.longitude = longitude;
    circleMarkerConfigPayload.options = options;
    return circleMarkerConfigPayload;
  };

  /*
   * Static method used to create a MarkerConfigPayload
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {number} the marker latitude
   * @param {number} the marker longitude
   * @param {L.MarkerOptions} the marker options
   * @param {string} optional marker identifier
   *
   * @returns {MarkerConfigPayload} the MarkerConfigPayload object created
   */
  static forMarker = (
    event: EventStringId,
    handlerName: string | null,
    latitude: number,
    longitude: number,
    options: L.MarkerOptions,
    id?: string
  ): MarkerConfigPayload => {
    const markerConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.MARKER, id) as MarkerConfigPayload;
    markerConfigPayload.latitude = latitude;
    markerConfigPayload.longitude = longitude;
    markerConfigPayload.options = options;
    return markerConfigPayload;
  };

  /*
   * Static method used to create a PolygonConfigPayload
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][]} the polygon points
   * @param {L.PolylineOptions} the polygon options
   * @param {string} optional polygon identifier
   *
   * @returns {PolygonConfigPayload} the PolygonConfigPayload object created
   */
  static forPolygon = (
    event: EventStringId,
    handlerName: string | null,
    points: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][],
    options: L.PolylineOptions,
    id?: string
  ): PolygonConfigPayload => {
    const polygonConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON, id) as PolygonConfigPayload;
    polygonConfigPayload.points = points;
    polygonConfigPayload.options = options;
    return polygonConfigPayload;
  };

  /*
   * Static method used to create a PolylineConfigPayload
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {L.LatLngExpression[] | L.LatLngExpression[][]} the polyline points
   * @param {L.PolylineOptions} the polyline options
   * @param {string} optional polyline identifier
   *
   * @returns {PolylineConfigPayload} the PolylineConfigPayload object created
   */
  static forPolyline = (
    event: EventStringId,
    handlerName: string | null,
    points: L.LatLngExpression[] | L.LatLngExpression[][],
    options: L.PolylineOptions,
    id?: string
  ): PolylineConfigPayload => {
    const polylineConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYLINE, id) as PolylineConfigPayload;
    polylineConfigPayload.points = points;
    polylineConfigPayload.options = options;
    return polylineConfigPayload;
  };
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a VectorConfigPayload object. This function
 * avoids the "new VectorConfigPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {TypeOfVector} the type of vector configuration object that makes up the payload
 * @param {string} the vector object identifier
 *
 * @returns {VectorConfigPayload} the VectorConfigPayload object created
 */
export const vectorConfigPayload = (
  event: EventStringId,
  handlerName: string | null,
  type: TypeOfVector,
  id?: string
): VectorConfigPayload => {
  return new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON, id);
};
