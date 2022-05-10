import { EventStringId } from '../event';
export declare class PayloadBaseClass {
    event: EventStringId;
    handlerName: string | null;
    constructor(event: EventStringId, handlerName: string | null);
}
export declare const payloadBaseClass: (event: EventStringId, handlerName: string | null) => PayloadBaseClass;
