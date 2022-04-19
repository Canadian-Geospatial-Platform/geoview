import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { CONST_VECTOR_TYPES } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.VECTOR.EVENT_VECTOR_ADD, EVENT_NAMES.VECTOR.EVENT_VECTOR_REMOVE];

export const payloadIsAVectorConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is VectorConfigPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export const payloadIsACircleConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE;
  }
  return false;
};

export interface CircleConfigPayload extends VectorConfigPayload {
  latitude: number;

  longitude: number;

  options: L.CircleMarkerOptions;
}

export const payloadIsACircleMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleMarkerConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE_MARKER;
  }
  return false;
};

export interface CircleMarkerConfigPayload extends VectorConfigPayload {
  latitude: number;

  longitude: number;

  options: L.CircleMarkerOptions;
}

export const payloadIsAMarkerConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerConfigPayload => {
  if (payloadIsAMarkerConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.MARKER;
  }
  return false;
};

export interface MarkerConfigPayload extends VectorConfigPayload {
  latitude: number;

  longitude: number;

  options: L.MarkerOptions;
}

export const payloadIsAPolygonConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYGON;
  }
  return false;
};

export interface PolygonConfigPayload extends VectorConfigPayload {
  points: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][];

  options: L.PolylineOptions;
}

export const payloadIsAPolylineConfig = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylineConfigPayload => {
  if (payloadIsAVectorConfig(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYLINE;
  }
  return false;
};

export interface PolylineConfigPayload extends VectorConfigPayload {
  points: L.LatLngExpression[] | L.LatLngExpression[][];

  options: L.PolylineOptions;
}

export class VectorConfigPayload extends PayloadBaseClass {
  type: string;

  id?: string;

  constructor(event: EventStringId, handlerName: string | null, type: string, id?: string) {
    if (!validEvents.includes(event)) throw new Error(`VectorConfigPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.type = type;
    this.id = id;
  }

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

  static forMarker = (
    event: EventStringId,
    handlerName: string | null,
    latitude: number,
    longitude: number,
    options: L.MarkerOptions,
    id?: string
  ): CircleMarkerConfigPayload => {
    const markerConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.MARKER, id) as CircleMarkerConfigPayload;
    markerConfigPayload.latitude = latitude;
    markerConfigPayload.longitude = longitude;
    markerConfigPayload.options = options;
    return markerConfigPayload;
  };

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

  static forPolyline = (
    event: EventStringId,
    handlerName: string | null,
    points: L.LatLngExpression[] | L.LatLngExpression[][],
    options: L.PolylineOptions,
    id?: string
  ): PolylineConfigPayload => {
    const polylineConfigPayload = new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON, id) as PolylineConfigPayload;
    polylineConfigPayload.points = points;
    polylineConfigPayload.options = options;
    return polylineConfigPayload;
  };
}

export const vectorConfigPayload = (event: EventStringId, handlerName: string | null, type: string, id?: string): VectorConfigPayload => {
  return new VectorConfigPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON, id);
};
