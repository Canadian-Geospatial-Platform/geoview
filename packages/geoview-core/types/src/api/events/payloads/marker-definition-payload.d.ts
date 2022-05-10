import L from 'leaflet';
import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeJsonObject } from '../../../core/types/cgpv-types';
export declare const payloadIsAMarkerDefinition: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MarkerDefinitionPayload;
export declare class MarkerDefinitionPayload extends PayloadBaseClass {
    latlng: L.LatLng;
    symbology: TypeJsonObject;
    constructor(event: EventStringId, handlerName: string | null, latlng: L.LatLng, symbology: TypeJsonObject);
}
export declare const markerDefinitionPayload: (event: EventStringId, handlerName: string | null, latlng: L.LatLng, symbology: TypeJsonObject) => MarkerDefinitionPayload;
