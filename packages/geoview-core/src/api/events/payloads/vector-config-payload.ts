import { Coordinate } from 'ol/coordinate';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

import { CONST_VECTOR_TYPES, TypeFeatureStyle, TypeFeatureCircleStyle, TypeOfVector } from '../../../geo/layer/vector/vector-types';

/** Valid events that can create VectorConfigPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.VECTOR.EVENT_VECTOR_ADD, EVENT_NAMES.VECTOR.EVENT_VECTOR_REMOVE];

/**
 * Type Gard function that redefines a PayloadBaseClass as a VectorConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAVectorConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is VectorConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Type Gard function that redefines a PayloadBaseClass as a CircleConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsACircleConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE;
  }
  return false;
};

/**
 * Additional attributes needed to define a CircleConfigPayload
 */
export interface CircleConfigPayload extends VectorConfigPayload {
  coordintate: Coordinate;

  radius?: number;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureCircleStyle;
  };
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a CircleMarkerConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsACircleMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleMarkerConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE_MARKER;
  }
  return false;
};

/**
 * Additional attributes needed to define a CircleMarkerConfigPayload
 */
export interface CircleMarkerConfigPayload extends VectorConfigPayload {
  coordinate: Coordinate;

  radius?: number;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureCircleStyle;
  };
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a MarkerConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.MARKER;
  }
  return false;
};

/**
 * Additional attributes needed to define a MarkerConfigPayload
 */
export interface MarkerConfigPayload extends VectorConfigPayload {
  coordinate: Coordinate;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  };
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a PolygonConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAPolygonConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYGON;
  }
  return false;
};

/**
 * Additional attributes needed to define a PolygonConfigPayload
 */
export interface PolygonConfigPayload extends VectorConfigPayload {
  points: Coordinate;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  };
}

/**
 * Type Gard function that redefines a PayloadBaseClass as a PolylineConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true of the payload is valid
 */
export const payloadIsAPolylineConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylineConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYLINE;
  }
  return false;
};

/**
 * Additional attributes needed to define a PolylineConfigPayload
 */
export interface PolylineConfigPayload extends VectorConfigPayload {
  points: Coordinate;
  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  };
}

/**
 * Class definition for VectorConfigPayload
 *
 * @exports
 * @class VectorConfigPayload
 */
export class VectorConfigPayload extends PayloadBaseClass {
  // The type of vector payload
  type: TypeOfVector;

  // The vector object identifier
  id?: string;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeOfVector} type the type of vector configuration object that makes up the payload
   * @param {string} id the vector object identifier
   */
  constructor(event: EventStringId, handlerName: string | null, type: TypeOfVector, id?: string) {
    if (!validEvents.includes(event)) throw new Error(`VectorConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.type = type;
    this.id = id;
  }

  /**
   * Static method used to create a CircleConfigPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Coordintate} coordinate the long lat coordintate
   * @param {number} radius optional circle radius
   * @param options the circle options
   * @param {string} id optional circle identifier
   *
   * @returns {CircleConfigPayload} the CircleConfigPayload object created
   */
  static forCircle = (
    event: EventStringId,
    handlerName: string | null,
    coordinate: Coordinate,
    radius?: number,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureCircleStyle;
    },
    id?: string
  ): CircleConfigPayload => {
    const circleConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.CIRCLE, id) as CircleConfigPayload;
    circleConfigPayload.coordintate = coordinate;
    circleConfigPayload.radius = radius;
    circleConfigPayload.options = options;
    return circleConfigPayload;
  };

  /**
   * Static method used to create a CircleMarkerConfigPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Coordinate} coordinate the circle marker long lat position
   * @param {number} radius optional circle marker radius
   * @param options the circle marker options
   * @param {string} id optional circle marker identifier
   *
   * @returns {CircleMarkerConfigPayload} the CircleMarkerConfigPayload object created
   */
  static forCircleMarker = (
    event: EventStringId,
    handlerName: string | null,
    coordinate: Coordinate,
    radius?: number,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureCircleStyle;
    },
    id?: string
  ): CircleMarkerConfigPayload => {
    const circleMarkerConfigPayload = new VectorConfigPayload(
      event,
      handlerName,
      CONST_VECTOR_TYPES.CIRCLE_MARKER,
      id
    ) as CircleMarkerConfigPayload;
    circleMarkerConfigPayload.coordinate = coordinate;
    circleMarkerConfigPayload.radius = radius;
    circleMarkerConfigPayload.options = options;
    return circleMarkerConfigPayload;
  };

  /**
   * Static method used to create a MarkerConfigPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Coordinate} coordinate the marker long lat position
   * @param options the marker options
   * @param {string} id optional marker identifier
   *
   * @returns {MarkerConfigPayload} the MarkerConfigPayload object created
   */
  static forMarker = (
    event: EventStringId,
    handlerName: string | null,
    coordinate: Coordinate,
    options?: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): MarkerConfigPayload => {
    const markerConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.MARKER, id) as MarkerConfigPayload;
    markerConfigPayload.coordinate = coordinate;
    markerConfigPayload.options = options;
    return markerConfigPayload;
  };

  /**
   * Static method used to create a PolygonConfigPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Coordinate} points the polygon points
   * @param options the polygon options
   * @param {string} id optional polygon identifier
   *
   * @returns {PolygonConfigPayload} the PolygonConfigPayload object created
   */
  static forPolygon = (
    event: EventStringId,
    handlerName: string | null,
    points: Coordinate,
    options: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): PolygonConfigPayload => {
    const polygonConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON, id) as PolygonConfigPayload;
    polygonConfigPayload.points = points;
    polygonConfigPayload.options = options;
    return polygonConfigPayload;
  };

  /**
   * Static method used to create a PolylineConfigPayload
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {Coordinate} points the polyline points
   * @param options the polyline options
   * @param {string} id optional polyline identifier
   *
   * @returns {PolylineConfigPayload} the PolylineConfigPayload object created
   */
  static forPolyline = (
    event: EventStringId,
    handlerName: string | null,
    points: Coordinate,
    options: {
      geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
      style?: TypeFeatureStyle;
    },
    id?: string
  ): PolylineConfigPayload => {
    const polylineConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYLINE, id) as PolylineConfigPayload;
    polylineConfigPayload.points = points;
    polylineConfigPayload.options = options;
    return polylineConfigPayload;
  };
}

/**
 * Helper function used to instanciate a VectorConfigPayload object. This function
 * avoids the "new VectorConfigPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeOfVector} type the type of vector configuration object that makes up the payload
 * @param {string} id the vector object identifier
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
