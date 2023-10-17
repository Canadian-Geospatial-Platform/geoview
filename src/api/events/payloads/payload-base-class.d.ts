import { EventStringId } from '../event-types';
/**
 * Class definition for PayloadBaseClass
 *
 * @exports
 * @class PayloadBaseClass
 */
export declare class PayloadBaseClass<T = EventStringId> {
    event: T;
    handlerName: string | null;
    /**
     * Constructor for the class
     *
     * @param {T} event the event identifier for which the payload is constructed
     * @param {string | null} handlerName the handler Name
     */
    constructor(event: T, handlerName: string | null);
}
/**
 * Helper function used to instanciate a PayloadBaseClass object. This function
 * avoids the "new PayloadBaseClass" syntax.
 *
 * @param {T} event the event identifier for which the payload is constructed
 * @param {string | null} handlerName the handler Name
 *
 * @returns {PayloadBaseClass} the PayloadBaseClass object created
 */
type FunctionType<T = EventStringId> = (event: T, handlerName: string | null) => PayloadBaseClass;
export declare const payloadBaseClass: FunctionType;
export {};
