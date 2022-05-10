import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsALatLng: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is LatLngPayload;
export declare class LatLngPayload extends PayloadBaseClass {
    latLng: L.LatLng;
    constructor(event: EventStringId, handlerName: string | null, latLng: L.LatLng);
}
export declare const latLngPayload: (event: EventStringId, handlerName: string | null, latLng: L.LatLng) => LatLngPayload;
