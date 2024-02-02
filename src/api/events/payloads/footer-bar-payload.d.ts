import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeTabs } from '@/ui/tabs/tabs';
/**
 * type guard function that redefines a PayloadBaseClass as a FooteBarPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAFooterBar: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is FooterBarPayload;
/**
 * Class definition for FooterBarPayload
 *
 * @exports
 * @class FooterBarPayload
 */
export declare class FooterBarPayload extends PayloadBaseClass {
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
 * Helper function used to instanciate a FooterBarPayload object. This function
 * avoids the "new FooterBarPayload" syntax.
 *
 * @param {EventStringId} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 * @param {TypeTabs} tab the the tab properties carried by the payload
 *
 * @returns {FooterBarPayload} the FooterBarPayload object created
 */
export declare const footerBarPayload: (event: EventStringId, handlerName: string | null, tab: TypeTabs) => FooterBarPayload;
