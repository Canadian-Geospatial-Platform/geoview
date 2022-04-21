import { EventStringId } from '../event';

/* ******************************************************************************************************************************
 * Class definition for PayloadBaseClass
 */
export class PayloadBaseClass {
  // Type of payload
  event: EventStringId;

  // the event handler name of the payload
  handlerName: string | null;

  /*
   * Constructor for the class
   *
   * @param {EventStringId} the event identifier for which the payload is constructed
   * @param {string | null} the handler Name
   *
   * @returns {PayloadBaseClass} the PayloadBaseClass object created
   */
  constructor(event: EventStringId, handlerName: string | null) {
    this.event = event;
    this.handlerName = handlerName;
  }
}

/* ******************************************************************************************************************************
 * Helper function used to instanciate a PayloadBaseClass object. This function
 * avoids the "new PayloadBaseClass" syntax.
 *
 * @param {EventStringId} the event identifier for which the payload is constructed
 * @param {string | null} the handler Name
 *
 * @returns {PayloadBaseClass} the PayloadBaseClass object created
 */
export const payloadBaseClass = (event: EventStringId, handlerName: string | null): PayloadBaseClass => {
  return new PayloadBaseClass(event, handlerName);
};
