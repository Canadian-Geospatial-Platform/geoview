import { Coordinate } from 'ol/coordinate';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

import {
  CONST_GEOMETRY_TYPES,
  TypeFeatureStyle,
  TypeIconStyle,
  TypeFeatureCircleStyle,
  TypeOfGeometry,
} from '@/geo/layer/geometry/geometry-types';

/** Valid events that can create GeometryConfigPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.GEOMETRY.EVENT_GEOMETRY_ADD, EVENT_NAMES.GEOMETRY.EVENT_GEOMETRY_REMOVE];

/**
 * type guard function that redefines a PayloadBaseClass as a GeometryConfigPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAGeometryConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is GeometryConfigPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * type guard function that redefines a PayloadBaseClass as a CircleConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsACircleConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleConfigPayload => {
  if (payloadIsAGeometryConfig(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.CIRCLE;
  }
  return false;
};

/**
 * Additional attributes needed to define a CircleConfigPayload
 */
export interface CircleConfigPayload extends GeometryConfigPayload {
  coordintate: Coordinate;

  radius?: number;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureCircleStyle;
  };
}

/**
 * type guard function that redefines a PayloadBaseClass as a MarkerConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerConfigPayload => {
  if (payloadIsAGeometryConfig(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.MARKER;
  }
  return false;
};

/**
 * Additional attributes needed to define a MarkerConfigPayload
 */
export interface MarkerConfigPayload extends GeometryConfigPayload {
  coordinate: Coordinate;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeIconStyle;
  };
}

/**
 * type guard function that redefines a PayloadBaseClass as a PolygonConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAPolygonConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonConfigPayload => {
  if (payloadIsAGeometryConfig(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.POLYGON;
  }
  return false;
};

/**
 * Additional attributes needed to define a PolygonConfigPayload
 */
export interface PolygonConfigPayload extends GeometryConfigPayload {
  points: Coordinate;

  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  };
}

/**
 * type guard function that redefines a PayloadBaseClass as a PolylineConfigPayload
 * if the type attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAPolylineConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylineConfigPayload => {
  if (payloadIsAGeometryConfig(verifyIfPayload)) {
    return verifyIfPayload?.type === CONST_GEOMETRY_TYPES.POLYLINE;
  }
  return false;
};

/**
 * Additional attributes needed to define a PolylineConfigPayload
 */
export interface PolylineConfigPayload extends GeometryConfigPayload {
  points: Coordinate;
  options?: {
    geometryLayout?: 'XY' | 'XYZ' | 'XYM' | 'XYZM';
    style?: TypeFeatureStyle;
  };
}

/**
 * Class definition for GeometryConfigPayload
 *
 * @exports
 * @class GeometryConfigPayload
 */
export class GeometryConfigPayload extends PayloadBaseClass {
  // The type of geometry payload
  type: TypeOfGeometry;

  // The geometry object identifier
  id?: string;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeOfGeometry} type the type of geometry configuration object that makes up the payload
   * @param {string} id the geometry object identifier
   */
  constructor(event: EventStringId, handlerName: string | null, type: TypeOfGeometry, id?: string) {
    if (!validEvents.includes(event)) throw new Error(`GeometryConfigPayload can't be instanciated for event of type ${event}`);
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
    const circleConfigPayload = new GeometryConfigPayload(event, handlerName, CONST_GEOMETRY_TYPES.CIRCLE, id) as CircleConfigPayload;
    circleConfigPayload.coordintate = coordinate;
    circleConfigPayload.radius = radius;
    circleConfigPayload.options = options;
    return circleConfigPayload;
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
      style?: TypeIconStyle;
    },
    id?: string
  ): MarkerConfigPayload => {
    const markerConfigPayload = new GeometryConfigPayload(event, handlerName, CONST_GEOMETRY_TYPES.MARKER, id) as MarkerConfigPayload;
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
    const polygonConfigPayload = new GeometryConfigPayload(event, handlerName, CONST_GEOMETRY_TYPES.POLYGON, id) as PolygonConfigPayload;
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
    const polylineConfigPayload = new GeometryConfigPayload(event, handlerName, CONST_GEOMETRY_TYPES.POLYLINE, id) as PolylineConfigPayload;
    polylineConfigPayload.points = points;
    polylineConfigPayload.options = options;
    return polylineConfigPayload;
  };
}

/**
 * Helper function used to instanciate a GeometryConfigPayload object. This function
 * avoids the "new GeometryConfigPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeOfGeometry} type the type of geometry configuration object that makes up the payload
 * @param {string} id the geometry object identifier
 *
 * @returns {GeometryConfigPayload} the GeometryConfigPayload object created
 */
export const geometryConfigPayload = (
  event: EventStringId,
  handlerName: string | null,
  type: TypeOfGeometry,
  id?: string
): GeometryConfigPayload => {
  return new GeometryConfigPayload(event, handlerName, CONST_GEOMETRY_TYPES.POLYGON, id);
};
