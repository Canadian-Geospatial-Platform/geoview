import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

import { TypeTabs } from '@/ui/tabs/tabs';

/** Valid events that can create FooterBarPayload */
const validEvents: EventStringId[] = [EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE];

/**
 * type guard function that redefines a PayloadBaseClass as a FooteBarPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAFooterBar = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is FooterBarPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for FooterBarPayload
 *
 * @exports
 * @class FooterBarPayload
 */
export class FooterBarPayload extends PayloadBaseClass {
  // the tab properties
  tab: TypeTabs;

  /**
   * Constructor for the class
   *
   * @param {EventStringId} event the event identifier for which the payload is constructed
   * @param {string | null} handlerName the handler Name
   * @param {TypeTabs} tab the the tab properties carried by the payload
   *
   */
  constructor(event: EventStringId, handlerName: string | null, tab: TypeTabs) {
    if (!validEvents.includes(event)) throw new Error(`FooterBarPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.tab = tab;
  }
}

/**
 * Helper function used to instanciate a FooterBarPayload object. This function
 * avoids the "new FooterBarPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeTabs} tab the the tab properties carried by the payload
 *
 * @returns {FooterBarPayload} the FooterBarPayload object created
 */
export const footerBarPayload = (event: EventStringId, handlerName: string | null, tab: TypeTabs): FooterBarPayload => {
  return new FooterBarPayload(event, handlerName, tab);
};
