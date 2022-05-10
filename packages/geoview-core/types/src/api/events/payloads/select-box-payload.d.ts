import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsASelectBox: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is SelectBoxPayload;
export declare class SelectBoxPayload extends PayloadBaseClass {
    selectBoxBounds: L.LatLngBounds;
    constructor(event: EventStringId, handlerName: string | null, selectBoxBounds: L.LatLngBounds);
}
export declare const selectBoxPayload: (event: EventStringId, handlerName: string | null, selectBoxBounds: L.LatLngBounds) => SelectBoxPayload;
