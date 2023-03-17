import EventEmitter from 'eventemitter3';

import { EventStringId } from './event-types';
import { PayloadBaseClass } from './payloads/payload-base-class';

export type TypeEventHandlerFunction = (payload: PayloadBaseClass) => void;

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
  events: Record<string, string> = {};

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
   *
   * @returns {TypeEventHandlerFunction} The event handler listener function associated to the event created.
   */
  on = (eventName: EventStringId, listener: TypeEventHandlerFunction, handlerName?: string): TypeEventHandlerFunction => {
    const eventNameId = `${eventName}${handlerName ? `/${handlerName}` : ''}`;
    if (!this.events[eventNameId]) this.events[eventNameId] = handlerName || '';

    this.eventEmitter.on(eventNameId, listener);
    return listener;
  };

  /**
   * Listen to emitted events once
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener the callback function
   * @param {string} [handlerName] the handler name to return data from
   *
   * @returns {TypeEventHandlerFunction} The event handler listener function associated to the event created.
   */
  once = (eventName: EventStringId, listener: TypeEventHandlerFunction, handlerName?: string): TypeEventHandlerFunction => {
    const eventNameId = `${eventName}${handlerName ? `/${handlerName}` : ''}`;
    if (!this.events[eventNameId]) this.events[eventNameId] = handlerName || '';

    this.eventEmitter.once(eventNameId, listener);
    return listener;
  };

  /**
   * Will remove the specified @listener from @eventname list
   *
   * @param {string} eventName the event name of the event to be removed
   * @param {string} handlerName the name of the handler an event needs to be removed from
   * @param {TypeEventHandlerFunction} listener The event handler listener function associated to the event created.
   */
  off = (eventName: EventStringId, handlerName?: string, listener?: TypeEventHandlerFunction): void => {
    const eventNameId = `${eventName}${handlerName ? `/${handlerName}` : ''}`;

    this.eventEmitter.off(eventNameId, listener);

    delete this.events[eventNameId];
  };

  /**
   * Unregister all events whose handler names start with the string passed in parameter.
   *
   * @param {string} handlerNamePrefix the handler name prefix for which you need to unregister from the event
   */
  offAll = (handlerNamePrefix: string): void => {
    Object.keys(this.events).forEach((eventNameId) => {
      if (this.events[eventNameId].startsWith(handlerNamePrefix)) {
        this.off(eventNameId as EventStringId);
      }
    });
  };

  /**
   * Will emit the event on the event name with the @payload
   *
   * @param {object} payload a payload (data) to be emitted for the event
   */
  emit = (payload: PayloadBaseClass): void => {
    const { handlerName, event } = payload;
    const eventName = `${event}${handlerName ? `/${handlerName}` : ''}`;
    this.eventEmitter.emit(eventName, { ...payload, handlerName }, handlerName);
  };
}
