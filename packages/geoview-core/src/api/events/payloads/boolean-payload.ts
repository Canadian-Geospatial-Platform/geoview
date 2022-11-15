import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create BooleanPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENABLE_DISABLE,
  EVENT_NAMES.OVERVIEW_MAP.EVENT_OVERVIEW_MAP_TOGGLE,
  EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_EXPAND_COLLAPSE,
  EVENT_NAMES.MAP.EVENT_MAP_FIX_NORTH,
];

/**
 * type guard function that redefines a PayloadBaseClass as a BooleanPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsABoolean = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is BooleanPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for BooleanPayload
 *
 * @exports
 * @class BooleanPayload
 */
export class BooleanPayload extends PayloadBaseClass {
  status: boolean;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {boolean} status the boolean value carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, status: boolean) {
    if (!validEvents.includes(event)) throw new Error(`BooleanPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.status = status;
  }
}

/**
 * Helper function used to instanciate a BooleanPayload object. This function
 * avoids the "new BooleanPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {boolean} status the boolean value carried by the payload
 *
 * @returns {BooleanPayload} the BooleanPayload object created
 */
export const booleanPayload = (event: EventStringId, handlerName: string | null, status: boolean): BooleanPayload => {
  return new BooleanPayload(event, handlerName, status);
};
