import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsAMarkerClusterConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MarkerClusterConfigPayload;
export declare class MarkerClusterConfigPayload extends PayloadBaseClass {
    id?: string;
    latitude: number;
    longitude: number;
    options: L.MarkerClusterElementOptions;
    constructor(event: EventStringId, handlerName: string | null, latitude: number, longitude: number, options: L.MarkerClusterElementOptions, id?: string);
}
export declare const markerClusterConfigPayload: (event: EventStringId, handlerName: string | null, latitude: number, longitude: number, options: L.MarkerClusterElementOptions, id?: string | undefined) => MarkerClusterConfigPayload;
