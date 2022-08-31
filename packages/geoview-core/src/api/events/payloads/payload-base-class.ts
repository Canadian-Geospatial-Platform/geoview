import { EventStringId } from '../event-types';

/**
 * Class definition for PayloadBaseClass
 *
 * @exports
 * @class PayloadBaseClass
 */
export class PayloadBaseClass {
  // Type of payload
  event: EventStringId;

  // the event handler name of the payload
  handlerName: string | null;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   */
  constructor(event: EventStringId, handlerName: string | null) {
    this.event = event;
    this.handlerName = handlerName;
  }
}

/**
 * Helper function used to instanciate a PayloadBaseClass object. This function
 * avoids the "new PayloadBaseClass" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {PayloadBaseClass} the PayloadBaseClass object created
 */
export const payloadBaseClass = (event: EventStringId, handlerName: string | null): PayloadBaseClass => {
  return new PayloadBaseClass(event, handlerName);
};
