import { PayloadBaseClass } from './payload-base-class';
import { EventStringId, EVENT_NAMES } from '../event';

// Valid events that can create ModalPayload
const validEvents: EventStringId[] = [
  EVENT_NAMES.MODAL.EVENT_MODAL_CREATE,
  EVENT_NAMES.MODAL.EVENT_MODAL_OPEN,
  EVENT_NAMES.MODAL.EVENT_MODAL_CLOSE,
  EVENT_NAMES.MODAL.EVENT_MODAL_UPDATE,
];

/* ******************************************************************************************************************************
 * Type Gard function that redefines a PayloadBaseClass as a ModalPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} polymorphic object to test in order to determine if the type ascention is valid
 */
export const payloadIsAModal = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ModalPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/* ******************************************************************************************************************************
 * Class definition for ModalPayload
 */
export class ModalPayload extends PayloadBaseClass {
  // the modal identifier
  id: string;

  // Optional flag used to specify if the modal is open
  open?: boolean;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   * @param {string} the modal identifier
   * @param {boolean} Optional flag used to specify if the modal is open
   *
   * @returns {ModalPayload} the ModalPayload object created
   */
  constructor(event: EventStringId, handlerName: string | null, id: string, open?: boolean) {
    if (!validEvents.includes(event)) throw new Error(`ModalPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.id = id;
    this.open = open;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a ModalPayload object. This function
 * avoids the "new ModalPayload" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 * @param {string} the modal identifier
 * @param {boolean} Optional flag used to specify if the modal is open
 *
 * @returns {ModalPayload} the ModalPayload object created
 */
export const modalPayload = (event: EventStringId, handlerName: string | null, id: string, open?: boolean): ModalPayload => {
  return new ModalPayload(event, handlerName, id, open);
};
