import { SelectEvent as OLSelectEvent } from 'ol/interaction/Select';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create SelectPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.INTERACTION.EVENT_SELECTED];

/**
 * type guard function that redefines a PayloadBaseClass as a SelectPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsASelect = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is SelectPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for SelectPayload
 *
 * @exports
 * @class SelectPayload
 */
export class SelectPayload extends PayloadBaseClass {
  selectInfo: OLSelectEvent;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {OLSelectEvent} selectInfo the selection information carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, selectInfo: OLSelectEvent) {
    if (!validEvents.includes(event)) throw new Error(`SelectPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.selectInfo = selectInfo;
  }
}

/**
 * Helper function used to instanciate a SelectPayload object. This function
 * avoids the "new SelectPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLSelectEvent} select the select information carried by the payload
 *
 * @returns {SelectPayload} the SelectPayload object created
 */
export const selectPayload = (event: EventStringId, handlerName: string | null, select: OLSelectEvent): SelectPayload => {
  return new SelectPayload(event, handlerName, select);
};
