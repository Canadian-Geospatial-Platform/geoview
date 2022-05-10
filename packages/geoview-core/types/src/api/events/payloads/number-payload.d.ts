import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsANumber: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is NumberPayload;
export declare class NumberPayload extends PayloadBaseClass {
    value: number;
    constructor(event: EventStringId, handlerName: string | null, value: number);
}
export declare const numberPayload: (event: EventStringId, handlerName: string | null, value: number) => NumberPayload;
