import { PayloadBaseClass } from './payload-base-class';

import { EventStringId, EVENT_NAMES } from '../event-types';

import { TypeTabs } from '../../../ui/tabs/tabs';

/** Valid events that can create FooterTabPayload */
const validEvents: EventStringId[] = [
  EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE,
  EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE,
  EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_SELECT,
];

/**
 * type guard function that redefines a PayloadBaseClass as a FooterTabPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export const payloadIsAFooterTab = (verifyIfPayload: PayloadBaseClass): verifyIfPayload is FooterTabPayload => {
  return validEvents.includes(verifyIfPayload?.event);
};

/**
 * Class definition for FooterTabPayload
 *
 * @exports
 * @class FooterTabPayload
 */
export class FooterTabPayload extends PayloadBaseClass {
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
    if (!validEvents.includes(event)) throw new Error(`FooterTabPayload can't be instanciated for event of type ${event}`);
    super(event, handlerName);
    this.tab = tab;
  }
}

/**
 * Helper function used to instanciate a FooterTabPayload object. This function
 * avoids the "new FooterTabPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeTabs} tab the the tab properties carried by the payload
 *
 * @returns {FooterTabPayload} the FooterTabPayload object created
 */
export const footerTabPayload = (event: EventStringId, handlerName: string | null, tab: TypeTabs): FooterTabPayload => {
  return new FooterTabPayload(event, handlerName, tab);
};
