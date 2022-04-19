import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';
import { TypeJsonObject, TypeSnackbarMessage } from '../../../core/types/cgpv-types';

const validEvents: EventStringId[] = [EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN];

export const payloadIsASnackbarMessage = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SnackbarMessagePayload => {
  return validEvents.includes(verifyIfPayload.event);
};

export class SnackbarMessagePayload extends PayloadBaseClass {
  message: TypeSnackbarMessage;

  options?: TypeJsonObject;

  button?: TypeJsonObject;

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

export const snackbarMessagePayload = (
  event: EventStringId,
  handlerName: string | null,
  message: TypeSnackbarMessage,
  options?: TypeJsonObject,
  button?: TypeJsonObject
): SnackbarMessagePayload => {
  return new SnackbarMessagePayload(event, handlerName, message, options, button);
};
