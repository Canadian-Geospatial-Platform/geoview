import EventEmitter from 'eventemitter3';

import { generateId } from '../../core/utils/utilities';
import { EventStringId } from './event-types';
import { PayloadBaseClass } from './payloads/payload-base-class';

/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @exports
 * @class Event
 */
export class Event {
  // eventemitter object, used to handle emitting/subscribing to events
  eventEmitter: EventEmitter;

  // events object containing all registered events
  events: Record<string, Record<string, PayloadBaseClass>> = {};

  /**
   * Initiate the event emitter
   */
  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Listen to emitted events
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener the callback function
   * @param {string} [handlerName] the handler name to return data from
   * @param {string[]} args optional additional arguments
   */
  on = (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string, ...args: string[]): void => {
    let eventNameId = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    // check if args provided
    for (let argIndex = 0; argIndex < args.length; argIndex++) {
      eventNameId = `${eventNameId}/${args[argIndex]}`;
    }

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: PayloadBaseClass) => {
      let listenerPayload: PayloadBaseClass;

      // if a handler name was specified, callback will return that data if found
      if (handlerName && payload.handlerName === handlerName && this.events[eventNameId] && this.events[eventNameId][handlerName]) {
        listenerPayload = this.events[eventNameId][handlerName];
      } else {
        listenerPayload = payload;
      }

      listener(listenerPayload);
    };

    this.eventEmitter.on(eventNameId, listen);
  };

  /**
   * Listen to emitted events once
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener the callback function
   * @param {string} [handlerName] the handler name to return data from
   * @param {string[]} args optional additional arguments
   */
  once = (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string, ...args: string[]): void => {
    let eventNameId = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    // check if args provided
    for (let argIndex = 0; argIndex < args.length; argIndex++) {
      eventNameId = `${eventNameId}/${args[argIndex]}`;
    }

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: PayloadBaseClass) => {
      let listenerPayload: PayloadBaseClass;

      // if a handler name was specefieid, callback will return that data if found
      if (handlerName && payload.handlerName === handlerName && this.events[eventNameId] && this.events[eventNameId][handlerName]) {
        listenerPayload = this.events[eventNameId][handlerName];
      } else {
        listenerPayload = payload;
      }

      listener(listenerPayload);
    };

    this.eventEmitter.once(eventNameId, listen);
  };

  /**
   * Will remove the specified @listener from @eventname list
   *
   * @param {string} eventName the event name of the event to be removed
   * @param {string} handlerName the name of the handler an event needs to be removed from
   * @param {string[]} args optional additional arguments
   */
  off = (eventName: EventStringId, handlerName?: string, ...args: string[]): void => {
    let eventNameId = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    // check if args provided
    for (let argIndex = 0; argIndex < args.length; argIndex++) {
      eventNameId = `${eventNameId}/${args[argIndex]}`;
    }

    this.eventEmitter.off(eventNameId);

    delete this.events[eventNameId];
  };

  /**
   * Unsubscribe from all events on the map
   *
   * @param {string} handlerName the id of the map to turn unsubscribe the event from
   */
  offAll = (handlerName: string): void => {
    Object.keys(this.events).forEach((event) => {
      if (event.includes(handlerName)) {
        this.off(event as EventStringId);
      }
    });
  };

  /**
   * Will emit the event on the event name with the @payload
   *
   * @param {object} payload a payload (data) to be emitted for the event
   * @param {string[]} args optional additional arguments
   */
  emit = (payload: PayloadBaseClass, ...args: string[]): void => {
    const { handlerName, event } = payload;

    let customHandlerNames: string | undefined;

    // event name
    let eventName = event + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    // check if args provided
    for (let argIndex = 0; argIndex < args.length; argIndex++) {
      eventName = `${eventName}/${args[argIndex]}`;

      customHandlerNames = `${customHandlerNames ? `${customHandlerNames}/` : ''}${args[argIndex]}`;
    }

    // handler name, registers a unique handler to be used when multiple events emit with same event name
    const handlerNameId = generateId(handlerName || customHandlerNames);

    if (!this.events[eventName]) {
      this.events[eventName] = {};
    }

    // store the emitted event to the events array
    this.events[eventName][handlerNameId] = {
      ...payload,
      handlerName: handlerName || customHandlerNames,
    } as PayloadBaseClass;

    this.eventEmitter.emit(eventName, { ...payload, handlerName: handlerName || customHandlerNames }, handlerName || customHandlerNames);
  };

  /**
   * Get all the event handler names on a specified event
   * @param eventName the event name to get all it's handler names
   * @returns an array of all the event handler names
   */
  getHandlerNames = (eventName: string): Array<string> => {
    if (this.events && this.events[eventName]) {
      return Object.keys(this.events[eventName]);
    }

    return [];
  };

  /**
   * Get all events with their data and event handler names
   * @returns all the events with their data and handler names
   */
  getEvents = (): Record<string, Record<string, PayloadBaseClass>> => {
    return this.events;
  };
}
