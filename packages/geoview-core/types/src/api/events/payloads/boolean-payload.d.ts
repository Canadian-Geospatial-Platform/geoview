import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsABoolean: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is BooleanPayload;
export declare class BooleanPayload extends PayloadBaseClass {
    status: boolean;
    constructor(event: EventStringId, handlerName: string | null, status: boolean);
}
export declare const booleanPayload: (event: EventStringId, handlerName: string | null, status: boolean) => BooleanPayload;
