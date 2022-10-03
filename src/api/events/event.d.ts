import EventEmitter from 'eventemitter3';
import { EventStringId } from './event-types';
import { PayloadBaseClass } from './payloads/payload-base-class';
/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @exports
 * @class Event
 */
export declare class Event {
    eventEmitter: EventEmitter;
    events: Record<string, Record<string, PayloadBaseClass>>;
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
     * @param {string[]} args optional additional arguments
     */
    on: (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string, ...args: string[]) => void;
    /**
     * Listen to emitted events once
     *
     * @param {string} eventName the event name to listen to
     * @param {function} listener the callback function
     * @param {string} [handlerName] the handler name to return data from
     * @param {string[]} args optional additional arguments
     */
    once: (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string, ...args: string[]) => void;
    /**
     * Will remove the specified @listener from @eventname list
     *
     * @param {string} eventName the event name of the event to be removed
     * @param {string} handlerName the name of the handler an event needs to be removed from
     * @param {string[]} args optional additional arguments
     */
    off: (eventName: EventStringId, handlerName?: string, ...args: string[]) => void;
    /**
     * Unsubscribe from all events on the map
     *
     * @param {string} handlerName the id of the map to turn unsubscribe the event from
     */
    offAll: (handlerName: string) => void;
    /**
     * Will emit the event on the event name with the @payload
     *
     * @param {object} payload a payload (data) to be emitted for the event
     * @param {string[]} args optional additional arguments
     */
    emit: (payload: PayloadBaseClass, ...args: string[]) => void;
    /**
     * Get all the event handler names on a specified event
     * @param eventName the event name to get all it's handler names
     * @returns an array of all the event handler names
     */
    getHandlerNames: (eventName: string) => Array<string>;
    /**
     * Get all events with their data and event handler names
     * @returns all the events with their data and handler names
     */
    getEvents: () => Record<string, Record<string, PayloadBaseClass>>;
}
