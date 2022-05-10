import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeLayerConfig } from '../../../core/types/cgpv-types';
export declare const payloadIsALayerConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is LayerConfigPayload;
export declare class LayerConfigPayload extends PayloadBaseClass {
    layerConfig: TypeLayerConfig;
    constructor(event: EventStringId, handlerName: string | null, layerConfig: TypeLayerConfig);
}
export declare const layerConfigPayload: (event: EventStringId, handlerName: string | null, layerConfig: TypeLayerConfig) => LayerConfigPayload;
