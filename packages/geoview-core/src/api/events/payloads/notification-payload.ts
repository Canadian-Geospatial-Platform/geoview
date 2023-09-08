import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create NotificationPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD, EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_REMOVE];

/**
 * type guard function that redefines a PayloadBaseClass as a NotificationPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsANotification = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is NotificationPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Class definition for NotificationPayload
 *
 * @exports
 * @class NotificationPayload
 */
export class NotificationPayload extends PayloadBaseClass {
  message: string;

  notificationType: NotificationType;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {NotificationType} notificationType the  type of notification
   * @param {string} message the notification message
   */
  constructor(event: EventStringId, handlerName: string | null, notifType: NotificationType, message: string) {
    if (!validEvents.includes(event)) throw new Error(`NotificationPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.message = message;
    this.notificationType = notifType;
  }
}

/**
 * Helper function used to instanciate a NotificationPayload object. This function
 * avoids the "new NotificationPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {NotificationType} notificationType the  type of notification
 * @param {string} message the notification message
 *
 * @returns {NotificationPayload} the NotificationPayload object created
 */
export const notificationPayload = (
  event: EventStringId,
  handlerName: string | null,
  notificationType: NotificationType,
  message: string
): NotificationPayload => {
  return new NotificationPayload(event, handlerName, notificationType, message);
};
