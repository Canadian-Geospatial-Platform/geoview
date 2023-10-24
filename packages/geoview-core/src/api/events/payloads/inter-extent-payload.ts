import { ExtentEvent as OLExtentEvent } from 'ol/interaction/Extent';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create ExtentPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.INTERACTION.EVENT_EXTENT];

/**
 * type guard function that redefines a PayloadBaseClass as a ExtentPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAnExtent = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is ExtentPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for ExtentPayload
 *
 * @exports
 * @class ExtentPayload
 */
export class ExtentPayload extends PayloadBaseClass {
  extentInfo: OLExtentEvent;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {OLExtentEvent} extentInfo the extent information carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, extentInfo: OLExtentEvent) {
    if (!validEvents.includes(event)) throw new Error(`ExtentPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.extentInfo = extentInfo;
  }
}

/**
 * Helper function used to instanciate a ExtentPayload object. This function
 * avoids the "new ExtentPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLExtentEvent} extent the extent information carried by the payload
 *
 * @returns {ExtentPayload} the ExtentPayload object created
 */
export const extentPayload = (event: EventStringId, handlerName: string | null, extent: OLExtentEvent): ExtentPayload => {
  return new ExtentPayload(event, handlerName, extent);
};
