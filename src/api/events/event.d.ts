import EventEmitter from 'eventemitter3';
import { EventStringId } from './event-types';
import { PayloadBaseClass } from './payloads/payload-base-class';
export type TypeEventHandlerFunction = (payload: PayloadBaseClass) => void;
type TypeEventNode = {
    context: EventEmitter;
    fn: TypeEventHandlerFunction;
    once: boolean;
};
interface TypeEventEmitter extends EventEmitter {
    _events: Record<string, TypeEventNode | TypeEventNode[]>;
    _eventsCount: number;
}
/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @exports
 * @class Event
 */
export declare class Event {
    eventEmitter: TypeEventEmitter;
    /**
     * Initiate the event emitter
     */
    constructor();
    /**
     * Listen to emitted events
     *
     * @param {string} eventName the event name to listen to
     * @param {function} listener the callback function
     * @param {string} [handlerName] the handler name to return data from
     *
     * @returns {TypeEventHandlerFunction} The event handler listener function associated to the event created.
     */
    on: (eventName: EventStringId, listener: TypeEventHandlerFunction, handlerName?: string) => TypeEventHandlerFunction;
    /**
     * Listen to emitted events once
     *
     * @param {string} eventName the event name to listen to
     * @param {function} listener the callback function
     * @param {string} [handlerName] the handler name to return data from
     *
     * @returns {TypeEventHandlerFunction} The event handler listener function associated to the event created.
     */
    once: (eventName: EventStringId, listener: TypeEventHandlerFunction, handlerName?: string) => TypeEventHandlerFunction;
    /**
     * Will remove the specified @listener from @eventname list
     *
     * @param {string} eventName the event name of the event to be removed
     * @param {string} handlerName the name of the handler an event needs to be removed from
     * @param {TypeEventHandlerFunction} listener The event handler listener function associated to the event created.
     */
    off: (eventName: EventStringId, handlerName?: string, listener?: TypeEventHandlerFunction) => void;
    /**
     * Unregister all events whose handler names start with the string passed in parameter.
     *
     * @param {string} handlerNamePrefix the handler name prefix for which you need to unregister from the event
     * @param {string} eventTypeToKeep the handler name prefix composed of handlerNamePrefix/eventTypeToKeep to keep
     */
    offAll: (handlerNamePrefix: string, eventTypeToKeep?: string) => void;
    /**
     * Will emit the event on the event name with the @payload
     *
     * @param {object} payload a payload (data) to be emitted for the event
     */
    emit: (payload: PayloadBaseClass) => void;
}
export {};
