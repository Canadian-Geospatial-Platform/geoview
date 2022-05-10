import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsAMap: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapPayload;
export declare class MapPayload extends PayloadBaseClass {
    map: L.Map;
    constructor(event: EventStringId, handlerName: string | null, map: L.Map);
}
export declare const mapPayload: (event: EventStringId, handlerName: string | null, map: L.Map) => MapPayload;
