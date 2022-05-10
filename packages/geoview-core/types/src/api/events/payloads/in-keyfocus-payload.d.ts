import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsAInKeyfocus: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is InKeyfocusPayload;
export declare class InKeyfocusPayload extends PayloadBaseClass {
    constructor(event: EventStringId, handlerName: string | null);
}
export declare const inKeyfocusPayload: (event: EventStringId, handlerName: string | null) => InKeyfocusPayload;
