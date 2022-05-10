import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeOfVector } from '../../../core/types/cgpv-types';
export declare const payloadIsAVector: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is VectorPayload;
export declare const payloadIsACircle: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is CirclePayload;
export interface CirclePayload extends VectorPayload {
    circle: L.Circle;
}
export declare const payloadIsACircleMarker: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is CircleMarkerPayload;
export interface CircleMarkerPayload extends VectorPayload {
    circleMarker: L.CircleMarker;
}
export declare const payloadIsAMarker: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MarkerPayload;
export interface MarkerPayload extends VectorPayload {
    marker: L.Marker;
}
export declare const payloadIsAPolygon: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PolygonPayload;
export interface PolygonPayload extends VectorPayload {
    polygon: L.Polygon;
}
export declare const payloadIsAPolyline: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PolylinePayload;
export interface PolylinePayload extends VectorPayload {
    polyline: L.Polyline;
}
export declare class VectorPayload extends PayloadBaseClass {
    type: TypeOfVector;
    constructor(event: EventStringId, handlerName: string | null, type: TypeOfVector);
    static forCircle: (event: EventStringId, handlerName: string | null, circle: L.Circle) => CirclePayload;
    static forCircleMarker: (event: EventStringId, handlerName: string | null, circleMarker: L.CircleMarker) => CircleMarkerPayload;
    static forMarker: (event: EventStringId, handlerName: string | null, marker: L.Marker) => MarkerPayload;
    static forPolygon: (event: EventStringId, handlerName: string | null, polygon: L.Polygon) => PolygonPayload;
    static forPolyline: (event: EventStringId, handlerName: string | null, polyline: L.Polyline) => PolylinePayload;
}
export declare const vectorPayload: (event: EventStringId, handlerName: string | null, type: TypeOfVector) => VectorPayload;
