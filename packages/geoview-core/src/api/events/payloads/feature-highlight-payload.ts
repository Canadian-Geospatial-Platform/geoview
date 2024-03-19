import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';
import { TypeFeatureInfoEntry } from './get-feature-info-payload';

/** Valid events that can create FeatureHighlightPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE];

/**
 * type guard function that redefines a PayloadBaseClass as a FeatureHighlightPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAFeatureHighlight = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is FeatureHighlightPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for FeatureHighlightPayload
 *
 * @exports
 * @class FeatureHighlightPayload
 */
export class FeatureHighlightPayload extends PayloadBaseClass {
  // the feature to highlight
  feature: TypeFeatureInfoEntry;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler name
   * @param {TypeFeatureInfoEntry} feature the feature to highlight
   */
  constructor(event: EventStringId, handlerName: string | null, feature: TypeFeatureInfoEntry) {
    if (!validEvents.includes(event)) throw new Error(`FeatureHighlightPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.feature = feature;
  }
}

/**
 * Helper function used to instanciate a FeatureHighlightPayload object. This function
 * avoids the "new FeatureHighlightPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler name
 * @param {TypeFeatureInfoEntry} feature the feature to highlight
 *
 * @returns {FeatureHighlightPayload} the FeatureHighlightPayload object created
 */
export const featureHighlightPayload = (
  event: EventStringId,
  handlerName: string | null,
  feature: TypeFeatureInfoEntry
): FeatureHighlightPayload => {
  return new FeatureHighlightPayload(event, handlerName, feature);
};
