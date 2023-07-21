import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeTabs } from '@/ui/tabs/tabs';
/**
 * type guard function that redefines a PayloadBaseClass as a FooterTabPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAFooterTab: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is FooterTabPayload;
/**
 * Class definition for FooterTabPayload
 *
 * @exports
 * @class FooterTabPayload
 */
export declare class FooterTabPayload extends PayloadBaseClass {
    tab: TypeTabs;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     * @param {TypeTabs} tab the the tab properties carried by the payload
     *
     */
    constructor(event: EventStringId, handlerName: string | null, tab: TypeTabs);
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
export declare const footerTabPayload: (event: EventStringId, handlerName: string | null, tab: TypeTabs) => FooterTabPayload;
