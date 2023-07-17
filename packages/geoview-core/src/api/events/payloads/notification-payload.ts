import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeJsonObject } from '../../../core/types/global-types';

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
export const payloadIsASnackbarMessage = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is NotificationPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for NotificationPayload
 *
 * @exports
 * @class NotificationPayload
 */
export class NotificationPayload extends PayloadBaseClass {
  message: string;

  options?: TypeJsonObject;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} message the notification message
   * @param {TypeJsonObject} options optional notification options
   */
  constructor(event: EventStringId, handlerName: string | null, message: string, options?: TypeJsonObject) {
    if (!validEvents.includes(event)) throw new Error(`NotificationPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.message = message;
    this.options = options;
  }
}

/**
 * Helper function used to instanciate a NotificationPayload object. This function
 * avoids the "new NotificationPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} message the notification message
 * @param {TypeJsonObject} options optional notification options
 *
 * @returns {NotificationPayload} the NotificationPayload object created
 */
export const notificationPayload = (
  event: EventStringId,
  handlerName: string | null,
  message: string,
  options?: TypeJsonObject
): NotificationPayload => {
  return new NotificationPayload(event, handlerName, message, options);
};
