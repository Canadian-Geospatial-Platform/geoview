import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
export declare const payloadIsAModal: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is ModalPayload;
export declare class ModalPayload extends PayloadBaseClass {
    id: string;
    open?: boolean;
    constructor(event: EventStringId, handlerName: string | null, id: string, open?: boolean);
}
export declare const modalPayload: (event: EventStringId, handlerName: string | null, id: string, open?: boolean | undefined) => ModalPayload;
