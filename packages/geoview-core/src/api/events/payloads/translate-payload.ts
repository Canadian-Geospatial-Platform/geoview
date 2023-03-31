import { TranslateEvent as OLTranslateEvent } from 'ol/interaction/Translate';

import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

/** Valid events that can create TranslatePayload */
const validEvents: EventStringId[] = [EVENT_NAMES.INTERACTION.EVENT_TRANSLATE_STARTED, EVENT_NAMES.INTERACTION.EVENT_TRANSLATE_ENDED];

/**
 * type guard function that redefines a PayloadBaseClass as a TranslatePayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsATranslate = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is TranslatePayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for TranslatePayload
 *
 * @exports
 * @class TranslatePayload
 */
export class TranslatePayload extends PayloadBaseClass {
  translateInfo: OLTranslateEvent;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {OLTranslateEvent} translateInfo the translate information carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, translateInfo: OLTranslateEvent) {
    if (!validEvents.includes(event)) throw new Error(`TranslatePayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.translateInfo = translateInfo;
  }
}

/**
 * Helper function used to instanciate a TranslatePayload object. This function
 * avoids the "new TranslatePayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {OLTranslateEvent} translateInfo the translate information carried by the payload
 *
 * @returns {TranslatePayload} the Translate Payload object created
 */
export const translatePayload = (event: EventStringId, handlerName: string | null, translate: OLTranslateEvent): TranslatePayload => {
  return new TranslatePayload(event, handlerName, translate);
};
