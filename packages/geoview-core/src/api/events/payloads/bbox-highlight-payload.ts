import { Extent } from 'ol/extent';
import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create BBoxHighlightPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_BBOX];

/**
 * type guard function that redefines a PayloadBaseClass as a BBoxHighlightPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsABBoxHighlight = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is BBoxHighlightPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for BBoxHighlightPayload
 *
 * @exports
 * @class BBoxHighlightPayload
 */
export class BBoxHighlightPayload extends PayloadBaseClass {
  // the bounding box to highlight
  bbox: Extent;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler name
   * @param {Extent} bbox the bounding box to highlight
   */
  constructor(event: EventStringId, handlerName: string | null, bbox: Extent) {
    if (!validEvents.includes(event)) throw new Error(`BBoxHighlightPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.bbox = bbox;
  }
}

/**
 * Helper function used to instanciate a BBoxHighlightPayload object. This function
 * avoids the "new BBoxHighlightPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler name
 * @param {Extent} bbox the bounding box to highlight
 *
 * @returns {BBoxHighlightPayload} the BBoxHighlightPayload object created
 */
export const bboxHighlightPayload = (event: EventStringId, handlerName: string | null, bbox: Extent): BBoxHighlightPayload => {
  return new BBoxHighlightPayload(event, handlerName, bbox);
};
