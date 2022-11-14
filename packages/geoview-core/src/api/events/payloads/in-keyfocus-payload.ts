import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create InKeyfocusPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS];

/**
 * type guard function that redefines a PayloadBaseClass as a InKeyfocusPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAInKeyfocus = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is InKeyfocusPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for InKeyfocusPayload
 *
 * @exports
 * @class InKeyfocusPayload
 */
export class InKeyfocusPayload extends PayloadBaseClass {
  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   */
  constructor(event: EventStringId, handlerName: string | null) {
    if (!validEvents.includes(event)) throw new Error(`InKeyfocusPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
  }
}

/**
 * Helper function used to instanciate a InKeyfocusPayload object. This function
 * avoids the "new InKeyfocusPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {InKeyfocusPayload} the InKeyfocusPayload object created
 */
export const inKeyfocusPayload = (event: EventStringId, handlerName: string | null): InKeyfocusPayload => {
  return new InKeyfocusPayload(event, handlerName);
};
