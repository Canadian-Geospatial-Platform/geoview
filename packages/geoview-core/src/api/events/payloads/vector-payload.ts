import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { CONST_VECTOR_TYPES } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.VECTOR.EVENT_VECTOR_ADDED];

export const payloadIsAVector = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is VectorPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export const payloadIsACircle = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CirclePayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE;
  }
  return false;
};

export interface CirclePayload extends VectorPayload {
  circle: L.Circle;
}

export const payloadIsACircleMarker = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is CircleMarkerPayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.CIRCLE_MARKER;
  }
  return false;
};

export interface CircleMarkerPayload extends VectorPayload {
  circleMarker: L.CircleMarker;
}

export const payloadIsAMarker = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is MarkerPayload => {
  if (payloadIsAMarker(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.MARKER;
  }
  return false;
};

export interface MarkerPayload extends VectorPayload {
  marker: L.Marker;
}

export const payloadIsAPolygon = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolygonPayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYGON;
  }
  return false;
};

export interface PolygonPayload extends VectorPayload {
  polygon: L.Polygon;
}

export const payloadIsAPolyline = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is PolylinePayload => {
  if (payloadIsAVector(verifyIfPayload)) {
    return verifyIfPayload.type === CONST_VECTOR_TYPES.POLYLINE;
  }
  return false;
};

export interface PolylinePayload extends VectorPayload {
  polyline: L.Polyline;
}

export class VectorPayload extends PayloadBaseClass {
  type: string;

  constructor(event: EventStringId, handlerName: string | null, type: string) {
    if (!validEvents.includes(event)) throw new Error(`VectorPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.type = type;
  }

  static forCircle = (event: EventStringId, handlerName: string | null, circle: L.Circle): CirclePayload => {
    const circlePayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.CIRCLE) as CirclePayload;
    circlePayload.circle = circle;
    return circlePayload;
  };

  static forCircleMarker = (event: EventStringId, handlerName: string | null, circleMarker: L.CircleMarker): CircleMarkerPayload => {
    const circleMarkerPayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.CIRCLE_MARKER) as CircleMarkerPayload;
    circleMarkerPayload.circleMarker = circleMarker;
    return circleMarkerPayload;
  };

  static forMarker = (event: EventStringId, handlerName: string | null, marker: L.Marker): MarkerPayload => {
    const markerPayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.MARKER) as MarkerPayload;
    markerPayload.marker = marker;
    return markerPayload;
  };

  static forPolygon = (event: EventStringId, handlerName: string | null, polygon: L.Polygon): PolygonPayload => {
    const polygonPayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON) as PolygonPayload;
    polygonPayload.polygon = polygon;
    return polygonPayload;
  };

  static forPolyline = (event: EventStringId, handlerName: string | null, polyline: L.Polyline): PolylinePayload => {
    const polylinePayload = new VectorPayload(event, handlerName, CONST_VECTOR_TYPES.POLYGON) as PolylinePayload;
    polylinePayload.polyline = polyline;
    return polylinePayload;
  };
}

export const vectorPayload = (event: EventStringId, handlerName: string | null, type: string): VectorPayload => {
  return new VectorPayload(event, handlerName, type);
};
