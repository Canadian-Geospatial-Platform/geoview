import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { AbstractWebLayersClass } from '../../../core/types/abstract/abstract-web-layers';
export declare const payloadIsAWebLayer: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is WebLayerPayload;
export declare class WebLayerPayload extends PayloadBaseClass {
    webLayer: AbstractWebLayersClass;
    constructor(event: EventStringId, handlerName: string | null, webLayer: AbstractWebLayersClass);
}
export declare const webLayerPayload: (event: EventStringId, handlerName: string | null, webLayer: AbstractWebLayersClass) => WebLayerPayload;
