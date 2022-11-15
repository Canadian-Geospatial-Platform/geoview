import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeSnackbarMessage } from '../../../ui/snackbar/snackbar-types';
import { TypeJsonObject } from '../../../core/types/global-types';

/** Valid events that can create SnackbarMessagePayload */
const validEvents: EventStringId[] = [EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN];

/**
 * type guard function that redefines a PayloadBaseClass as a SnackbarMessagePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsASnackbarMessage = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SnackbarMessagePayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for SnackbarMessagePayload
 *
 * @exports
 * @class SnackbarMessagePayload
 */
export class SnackbarMessagePayload extends PayloadBaseClass {
  message: TypeSnackbarMessage;

  options?: TypeJsonObject;

  button?: TypeJsonObject;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeSnackbarMessage} message the snackbar message
   * @param {TypeJsonObject} options optional snackbar options
   * @param {TypeJsonObject} button optional snackbar button
   */
  constructor(
    event: EventStringId,
    handlerName: string | null,
    message: TypeSnackbarMessage,
    options?: TypeJsonObject,
    button?: TypeJsonObject
  ) {
    if (!validEvents.includes(event)) throw new Error(`SnackbarMessagePayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.message = message;
    this.options = options;
    this.button = button;
  }
}

/**
 * Helper function used to instanciate a SnackbarMessagePayload object. This function
 * avoids the "new SnackbarMessagePayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeSnackbarMessage} message the snackbar message
 * @param {TypeJsonObject} options optional snackbar options
 * @param {TypeJsonObject} button optional snackbar button
 *
 * @returns {SnackbarMessagePayload} the SnackbarMessagePayload object created
 */
export const snackbarMessagePayload = (
  event: EventStringId,
  handlerName: string | null,
  message: TypeSnackbarMessage,
  options?: TypeJsonObject,
  button?: TypeJsonObject
): SnackbarMessagePayload => {
  return new SnackbarMessagePayload(event, handlerName, message, options, button);
};
