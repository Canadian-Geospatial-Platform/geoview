import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeJsonObject, TypeSnackbarMessage } from '../../../core/types/cgpv-types';

// Valid events that can create SnackbarMessagePayload
const validEvents: EventStringId[] = [EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a SnackbarMessagePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsASnackbarMessage = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SnackbarMessagePayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for SnackbarMessagePayload
 */
export class SnackbarMessagePayload extends PayloadBaseClass {
  message: TypeSnackbarMessage;

  options?: TypeJsonObject;

  button?: TypeJsonObject;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {TypeSnackbarMessage} the snackbar message
   * @param {TypeJsonObject} optional snackbar options
   * @param {TypeJsonObject} optional snackbar button
   *
   * @returns {SnackbarMessagePayload} the SnackbarMessagePayload object created
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

/* ******************************************************************************************************************************
 * Helper function used to instanciate a SnackbarMessagePayload object. This function
 * avoids the "new SnackbarMessagePayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {TypeSnackbarMessage} the snackbar message
 * @param {TypeJsonObject} optional snackbar options
 * @param {TypeJsonObject} optional snackbar button
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
