import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeJsonObject } from '@/core/types/global-types';
/**
 * type guard function that redefines a PayloadBaseClass as a SnackbarMessagePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsASnackbarMessage: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is SnackbarMessagePayload;
export type SnackbarType = 'success' | 'error' | 'info' | 'warning';
/**
 * Class definition for SnackbarMessagePayload
 *
 * @exports
 * @class SnackbarMessagePayload
 */
export declare class SnackbarMessagePayload extends PayloadBaseClass {
    snackbarType: SnackbarType;
    message: string;
    button?: TypeJsonObject;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {SnackbarType} snackbarType the  type of snackbar
     * @param {string} message the snackbar message
     * @param {TypeJsonObject} button optional snackbar button
     */
    constructor(event: EventStringId, handlerName: string | null, snackbarType: SnackbarType, message: string, button?: TypeJsonObject);
}
/**
 * Helper function used to instanciate a SnackbarMessagePayload object. This function
 * avoids the "new SnackbarMessagePayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {SnackbarType} snackbarType the  type of snackbar
 * @param {string} message the snackbar message
 * @param {TypeJsonObject} button optional snackbar button
 *
 * @returns {SnackbarMessagePayload} the SnackbarMessagePayload object created
 */
export declare const snackbarMessagePayload: (event: EventStringId, handlerName: string | null, snackbarType: SnackbarType, message: string, button?: TypeJsonObject) => SnackbarMessagePayload;
