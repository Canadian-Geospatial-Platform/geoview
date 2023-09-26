/* eslint-disable no-underscore-dangle */
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
export class Event {
  // event emitter object, used to handle emitting/subscribing to events
  eventEmitter: TypeEventEmitter;

  /**
   * Initiate the event emitter
   */
  constructor() {
    this.eventEmitter = new EventEmitter() as TypeEventEmitter;
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
    const eventNameId = `${handlerName ? `${handlerName}/` : ''}${eventName}`;

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
    const eventNameId = `${handlerName ? `${handlerName}/` : ''}${eventName}`;

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
    const eventNameId = `${handlerName ? `${handlerName}/` : ''}${eventName}`;

    this.eventEmitter.off(eventNameId, listener);
  };

  /**
   * Unregister all events whose handler names start with the string passed in parameter.
   *
   * @param {string} handlerNamePrefix the handler name prefix for which you need to unregister from the event
   */
  offAll = (handlerNamePrefix: string): void => {
    (Object.keys(this.eventEmitter._events) as EventStringId[]).forEach((eventNameId) => {
      if (eventNameId.startsWith(handlerNamePrefix)) {
        this.off(eventNameId);
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
    const eventName = `${handlerName ? `${handlerName}/` : ''}${event}`;
    this.eventEmitter.emit(eventName, { ...payload, handlerName }, handlerName);
  };
}
