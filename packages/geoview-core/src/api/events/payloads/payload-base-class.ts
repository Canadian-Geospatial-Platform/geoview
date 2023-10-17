import { EventStringId } from '../event-types';

/**
 * Class definition for PayloadBaseClass
 *
 * @exports
 * @class PayloadBaseClass
 */
export class PayloadBaseClass<T = EventStringId> {
  // Type of payload
  event: T;

  // the event handler name of the payload
  handlerName: string | null;

  /**
   * Constructor for the class
   *
   * @param {T} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   */
  constructor(event: T, handlerName: string | null) {
    this.event = event;
    this.handlerName = handlerName;
  }
}

/**
 * Helper function used to instanciate a PayloadBaseClass object. This function
 * avoids the "new PayloadBaseClass" syntax.
 *
 * @param {T} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {PayloadBaseClass} the PayloadBaseClass object created
 */
type FunctionType<T = EventStringId> = (event: T, handlerName: string | null) => PayloadBaseClass;
export const payloadBaseClass: FunctionType = <T = EventStringId>(event: T, handlerName: string | null) => {
  return new PayloadBaseClass<T>(event, handlerName);
};
