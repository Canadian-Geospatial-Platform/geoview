import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
/**
 * type guard function that redefines a PayloadBaseClass as a NotificationPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsANotification: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is NotificationPayload;
export type NotificationType = 'success' | 'error' | 'info' | 'warning';
/**
 * Class definition for NotificationPayload
 *
 * @exports
 * @class NotificationPayload
 */
export declare class NotificationPayload extends PayloadBaseClass {
    message: string;
    description?: string;
    notificationType: NotificationType;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {NotificationType} notificationType the  type of notification
     * @param {string} message the notification message
     * @param {string} description optional notification description
     */
    constructor(event: EventStringId, handlerName: string | null, notifType: NotificationType, message: string, description?: string);
}
/**
 * Helper function used to instanciate a NotificationPayload object. This function
 * avoids the "new NotificationPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {NotificationType} notificationType the  type of notification
 * @param {string} message the notification message
 * @param {string} description optional notification description
 *
 * @returns {NotificationPayload} the NotificationPayload object created
 */
export declare const notificationPayload: (event: EventStringId, handlerName: string | null, notificationType: NotificationType, message: string, description?: string) => NotificationPayload;
