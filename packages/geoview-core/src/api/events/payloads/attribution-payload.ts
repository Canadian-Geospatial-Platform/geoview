import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create AttributionPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.ATTRIBUTION.EVENT_ATTRIBUTION_UPDATE];

/**
 * type guard function that redefines a PayloadBaseClass as a AttributionPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAttribution = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is AttributionPayload => {
  return validEvents.includes(verifyIfPayload.event);
};

/**
 * Class definition for AttributionPayload
 *
 * @exports
 * @class AttributionPayload
 */
export class AttributionPayload extends PayloadBaseClass {
  attribution: string;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {string} attribution attribution text
   */
  constructor(event: EventStringId, handlerName: string | null, attribution: string) {
    if (!validEvents.includes(event)) throw new Error(`AttributionPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.attribution = attribution;
  }
}

/**
 * Helper function used to instanciate a AttributionPayload object. This function
 * avoids the "new AttributionPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler name
 * @param {string} attribution the attribution text
 *
 * @returns {AttributionPayload} the AttributionPayload object created
 */
export const attributionPayload = (event: EventStringId, handlerName: string | null, attribution: string): AttributionPayload => {
  return new AttributionPayload(event, handlerName, attribution);
};
