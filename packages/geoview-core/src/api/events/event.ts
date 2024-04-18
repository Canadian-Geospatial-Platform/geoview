import EventEmitter from 'eventemitter3';

import { logger } from '@/core/utils/logger';

export type TypeEventHandlerFunction<T> = (payload: T) => void;

type TypeEventNode = {
  context: EventEmitter;
  fn: TypeEventHandlerFunction<unknown>;
  once: boolean;
};

interface IEventEmitter extends EventEmitter {
  _events: Record<string, TypeEventNode>;
  _eventsCount: number;
}

const SEPARATOR = '||';

/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @exports
 * @class Event
 */
export class Event {
  // Event emitter object, used to handle emitting/subscribing to events
  #eventEmitter: IEventEmitter;

  /**
   * Initiate the event emitter
   */
  constructor() {
    // Create the EventEmitter
    this.#eventEmitter = new EventEmitter() as IEventEmitter;
  }

  /**
   * Emits the event on the event name with the given payload information
   * @param {string} eventName - The event name to listen to
   * @param {string} [handlerName] - The handler name to return data from
   * @param {T} payload - A payload (data) to be emitted for the event
   * @private
   */
  #emit<T>(eventName: string, handlerName: string, payload: T): void {
    const eventNameId = `${eventName}${SEPARATOR}${handlerName}`;
    this.#eventEmitter.emit(eventNameId, payload);
  }

  /**
   * Registers the specified event name, handler name, and callback.
   *
   * @param {string} eventName - The event name to listen to
   * @param {string} [handlerName] - The handler name to return data from
   * @param {TypeEventHandlerFunction<T>} callback the callback function
   * @private
   */
  #on<T>(eventName: string, handlerName: string, callback: TypeEventHandlerFunction<T>): void {
    const eventNameId = `${eventName}${SEPARATOR}${handlerName}`;
    this.#eventEmitter.on(eventNameId, callback);
  }

  /**
   * Unregisters the specified event name, handler name, and callback.
   *
   * @param {string} eventName - The event name of the event to be removed
   * @param {string} handlerName - The name of the handler an event needs to be removed from
   * @param {TypeEventHandlerFunction<T>} callback The callback function associated to the event created.
   * @private
   */
  #off<T>(eventName: string, handlerName: string, callback: TypeEventHandlerFunction<T>): void {
    const eventNameId = `${eventName}${SEPARATOR}${handlerName}`;
    this.#eventEmitter.off(eventNameId, callback);
  }

  /**
   * Unregisters all events for the given handler name.
   *
   * @param {string} handlerName - The name of the handler an event needs to be removed from
   */
  offAll(handlerName: string): void {
    // eslint-disable-next-line no-underscore-dangle
    (Object.keys(this.#eventEmitter._events) as string[]).forEach((eventNameId) => {
      // Parse the string
      const theEventName = eventNameId.substring(0, eventNameId.indexOf(SEPARATOR));
      const theHandlerName = eventNameId.substring(eventNameId.indexOf(SEPARATOR) + SEPARATOR.length);
      if (handlerName === theHandlerName) {
        // eslint-disable-next-line no-underscore-dangle
        this.#off(theEventName, theHandlerName, this.#eventEmitter._events[eventNameId].fn);
      }
    });
  }

  /**
   * Helper function to register an EventStringId and check the payload on response before calling back.
   * @param {string} eventName - The event name of the event to be removed
   * @param {string} handlerName - The name of the handler an event needs to be removed from
   * @param {TypeEventHandlerFunction<T>} callback - The callback executed when the event is raised and the payload has been validated
   * @private
   */
  #onMapHelperHandler<T>(eventName: string, handlerName: string, callback: TypeEventHandlerFunction<T>): void {
    // Register a generic event
    this.#on<T>(eventName, handlerName, (payload) => {
      // Log (this is the only place in all the code base where this function is called)
      logger.logTraceCoreAPIEvent(eventName, payload);

      // Sure callback
      callback(payload);
    });
  }

  // #region SPECIALIZED EVENTS - IMPORTANT
  // GV These events exists to communicate between the Shell/App/MapViewer components.

  // #endregion
}
