import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeOfVector } from '../../../core/types/cgpv-types';
export declare const payloadIsAVectorConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is VectorConfigPayload;
export declare const payloadIsACircleConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is CircleConfigPayload;
export interface CircleConfigPayload extends VectorConfigPayload {
    latitude: number;
    longitude: number;
    options: L.CircleMarkerOptions;
}
export declare const payloadIsACircleMarkerConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is CircleMarkerConfigPayload;
export interface CircleMarkerConfigPayload extends VectorConfigPayload {
    latitude: number;
    longitude: number;
    options: L.CircleMarkerOptions;
}
export declare const payloadIsAMarkerConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MarkerConfigPayload;
export interface MarkerConfigPayload extends VectorConfigPayload {
    latitude: number;
    longitude: number;
    options: L.MarkerOptions;
}
export declare const payloadIsAPolygonConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PolygonConfigPayload;
export interface PolygonConfigPayload extends VectorConfigPayload {
    points: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][];
    options: L.PolylineOptions;
}
export declare const payloadIsAPolylineConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is PolylineConfigPayload;
export interface PolylineConfigPayload extends VectorConfigPayload {
    points: L.LatLngExpression[] | L.LatLngExpression[][];
    options: L.PolylineOptions;
}
export declare class VectorConfigPayload extends PayloadBaseClass {
    type: TypeOfVector;
    id?: string;
    constructor(event: EventStringId, handlerName: string | null, type: TypeOfVector, id?: string);
    static forCircle: (event: EventStringId, handlerName: string | null, latitude: number, longitude: number, options: L.CircleMarkerOptions, id?: string | undefined) => CircleConfigPayload;
    static forCircleMarker: (event: EventStringId, handlerName: string | null, latitude: number, longitude: number, options: L.CircleMarkerOptions, id?: string | undefined) => CircleMarkerConfigPayload;
    static forMarker: (event: EventStringId, handlerName: string | null, latitude: number, longitude: number, options: L.MarkerOptions, id?: string | undefined) => MarkerConfigPayload;
    static forPolygon: (event: EventStringId, handlerName: string | null, points: L.LatLngExpression[] | L.LatLngExpression[][] | L.LatLngExpression[][][], options: L.PolylineOptions, id?: string | undefined) => PolygonConfigPayload;
    static forPolyline: (event: EventStringId, handlerName: string | null, points: L.LatLngExpression[] | L.LatLngExpression[][], options: L.PolylineOptions, id?: string | undefined) => PolylineConfigPayload;
}
export declare const vectorConfigPayload: (event: EventStringId, handlerName: string | null, type: TypeOfVector, id?: string | undefined) => VectorConfigPayload;
