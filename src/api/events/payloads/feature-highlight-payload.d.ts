import { PayloadBaseClass } from './payload-base-class';
import { EventStringId } from '../event-types';
import { TypeFeatureInfoEntry } from '@/app';
/**
 * type guard function that redefines a PayloadBaseClass as a FeatureHighlightPayload
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {PayloadBaseClass} verifyIfPayload object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const payloadIsAFeatureHighlight: (verifyIfPayload: PayloadBaseClass) => verifyIfPayload is FeatureHighlightPayload;
/**
 * Class definition for FeatureHighlightPayload
 *
 * @exports
 * @class FeatureHighlightPayload
 */
export declare class FeatureHighlightPayload extends PayloadBaseClass {
    feature: TypeFeatureInfoEntry;
    /**
     * Constructor for the class
     *
     * @param {EventStringId} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler name
     * @param {TypeFeatureInfoEntry} feature the feature to highlight
     */
    constructor(event: EventStringId, handlerName: string | null, feature: TypeFeatureInfoEntry);
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
export declare const featureHighlightPayload: (event: EventStringId, handlerName: string | null, feature: TypeFeatureInfoEntry) => FeatureHighlightPayload;
