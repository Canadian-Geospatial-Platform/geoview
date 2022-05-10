import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeMapConfigProps } from '../../../core/types/cgpv-types';
export declare const payloadIsAMapConfig: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is MapConfigPayload;
export declare class MapConfigPayload extends PayloadBaseClass {
    config: TypeMapConfigProps;
    constructor(event: EventStringId, handlerName: string | null, config: TypeMapConfigProps);
}
export declare const mapConfigPayload: (event: EventStringId, handlerName: string | null, config: TypeMapConfigProps) => MapConfigPayload;
