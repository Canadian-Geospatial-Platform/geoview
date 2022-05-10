import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeBasemapLayer } from '../../../core/types/cgpv-types';
export declare const payloadIsABasemapLayerArray: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is BasemapLayerArrayPayload;
export declare class BasemapLayerArrayPayload extends PayloadBaseClass {
    layers: TypeBasemapLayer[];
    constructor(event: EventStringId, handlerName: string | null, layers: TypeBasemapLayer[]);
}
export declare const basemapLayerArrayPayload: (event: EventStringId, handlerName: string | null, layers: TypeBasemapLayer[]) => BasemapLayerArrayPayload;
