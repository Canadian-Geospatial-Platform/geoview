import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event';
import { TypeJsonObject, TypeSnackbarMessage } from '../../../core/types/cgpv-types';
export declare const payloadIsASnackbarMessage: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is SnackbarMessagePayload;
export declare class SnackbarMessagePayload extends PayloadBaseClass {
    message: TypeSnackbarMessage;
    options?: TypeJsonObject;
    button?: TypeJsonObject;
    constructor(event: EventStringId, handlerName: string | null, message: TypeSnackbarMessage, options?: TypeJsonObject, button?: TypeJsonObject);
}
export declare const snackbarMessagePayload: (event: EventStringId, handlerName: string | null, message: TypeSnackbarMessage, options?: TypeJsonObject | undefined, button?: TypeJsonObject | undefined) => SnackbarMessagePayload;
