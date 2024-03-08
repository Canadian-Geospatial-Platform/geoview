import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

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

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

/**
 * Snackbar button properties interface
 */
export interface ISnackbarButton {
  label?: string;
  action?: () => void;
}

/**
 * Class definition for SnackbarMessagePayload
 *
 * @exports
 * @class SnackbarMessagePayload
 */
export class SnackbarMessagePayload extends PayloadBaseClass {
  snackbarType: SnackbarType;

  message: string;

  button?: ISnackbarButton;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {SnackbarType} snackbarType the  type of snackbar
   * @param {string} message the snackbar message
   * @param {ISnackbarButton} button optional snackbar button
   */
  constructor(event: EventStringId, handlerName: string | null, snackbarType: SnackbarType, message: string, button?: ISnackbarButton) {
    if (!validEvents.includes(event)) throw new Error(`SnackbarMessagePayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.snackbarType = snackbarType;
    this.message = message;
    this.button = button;
  }
}

/**
 * Helper function used to instanciate a SnackbarMessagePayload object. This function
 * avoids the "new SnackbarMessagePayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {SnackbarType} snackbarType the  type of snackbar
 * @param {string} message the snackbar message
 * @param {ISnackbarButton} button optional snackbar button
 *
 * @returns {SnackbarMessagePayload} the SnackbarMessagePayload object created
 */
export const snackbarMessagePayload = (
  event: EventStringId,
  handlerName: string | null,
  snackbarType: SnackbarType,
  message: string,
  button?: ISnackbarButton
): SnackbarMessagePayload => {
  return new SnackbarMessagePayload(event, handlerName, snackbarType, message, button);
};
