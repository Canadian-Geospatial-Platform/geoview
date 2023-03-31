import { ModifyEvent as OLModifyEvent } from 'ol/interaction/Modify';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create ModifyPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.INTERACTION.EVENT_MODIFY_STARTED, EVENT_NAMES.INTERACTION.EVENT_MODIFY_ENDED];

/**
 * type guard function that redefines a PayloadBaseClass as a ModifyPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAModify = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ModifyPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for ModifyPayload
 *
 * @exports
 * @class ModifyPayload
 */
export class ModifyPayload extends PayloadBaseClass {
  modifyInfo: OLModifyEvent;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {OLModifyEvent} modifyInfo the boolean value carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, modifyInfo: OLModifyEvent) {
    if (!validEvents.includes(event)) throw new Error(`ModifyPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.modifyInfo = modifyInfo;
  }
}

/**
 * Helper function used to instanciate a ModifyPayload object. This function
 * avoids the "new ModifyPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLModifyEvent} modify the modifying information carried by the payload
 *
 * @returns {ModifyPayload} the ModifyPayload object created
 */
export const modifyPayload = (event: EventStringId, handlerName: string | null, modify: OLModifyEvent): ModifyPayload => {
  return new ModifyPayload(event, handlerName, modify);
};
