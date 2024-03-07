import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create ModalPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MODAL.EVENT_MODAL_OPEN, EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE];

/**
 * type guard function that redefines a PayloadBaseClass as a ModalPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAModal = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ModalPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for ModalPayload
 *
 * @exports
 * @class ModalPayload
 */
export class ModalPayload extends PayloadBaseClass {
  // the modal identifier
  modalId: string;

  // Optional flag used to specify if the modal is open
  open?: boolean;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} modalId the modal identifier
   * @param {boolean} open optional flag used to specify if the modal is open
   */
  constructor(event: EventStringId, handlerName: string | null, modalId: string, open?: boolean) {
    if (!validEvents.includes(event)) throw new Error(`ModalPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.modalId = modalId;
    this.open = open;
  }
}

/**
 * Helper function used to instanciate a ModalPayload object. This function
 * avoids the "new ModalPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {string} modalId the modal identifier
 * @param {boolean} open optional flag used to specify if the modal is open
 *
 * @returns {ModalPayload} the ModalPayload object created
 */
export const modalPayload = (event: EventStringId, handlerName: string | null, modalId: string, open?: boolean): ModalPayload => {
  return new ModalPayload(event, handlerName, modalId, open);
};
