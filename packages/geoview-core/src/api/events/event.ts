import EventEmitter from 'eventemitter3';

import { logger } from '@/core/utils/logger';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';

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

const EVENT_MAP_RELOAD = 'map/reload';
const EVENT_MAP_RECONSTRUCT = 'map/reconstruct';
const SEPARATOR = '||';

/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @exports
 * @class Event
 */
export class Event {
  // event emitter object, used to handle emitting/subscribing to events
  eventEmitter: IEventEmitter;

  /**
   * Initiate the event emitter
   */
  constructor() {
    this.eventEmitter = new EventEmitter() as IEventEmitter;
  }

  /**
   * Emits the event on the event name with the given payload information
   * @param {T} payload a payload (data) to be emitted for the event
   * @private
   */
  #emit = <T>(eventName: string, handlerName: string, payload: T): void => {
    const eventNameId = `${eventName}${SEPARATOR}${handlerName}`;
    this.eventEmitter.emit(eventNameId, payload);
  };

  /**
   * Listen to emitted events
   *
   * @param {string} eventName the event name to listen to
   * @param {string} [handlerName] the handler name to return data from
   * @param {function} callback the callback function
   *
   * @returns {TypeEventHandlerFunction} The callback function associated to the event created.
   * @private
   */
  #on = <T>(eventName: string, handlerName: string, callback: TypeEventHandlerFunction<T>): TypeEventHandlerFunction<T> => {
    const eventNameId = `${eventName}${SEPARATOR}${handlerName}`;
    this.eventEmitter.on(eventNameId, callback);
    return callback;
  };

  /**
   * Will remove the specified @callback from @eventname list
   *
   * @param {string} eventName the event name of the event to be removed
   * @param {string} handlerName the name of the handler an event needs to be removed from
   * @param {TypeEventHandlerFunction} callback The callback function associated to the event created.
   * @private
   */
  #off = <T>(eventName: string, handlerName: string, callback: TypeEventHandlerFunction<T>): void => {
    const eventNameId = `${eventName}${SEPARATOR}${handlerName}`;
    this.eventEmitter.off(eventNameId, callback);
  };

  /**
   * Unregister all events whose handler names start with the string passed in parameter.
   *
   * @param {string} handlerName the handler name prefix for which you need to unregister from the event
   */
  offAll = (handlerName: string): void => {
    // eslint-disable-next-line no-underscore-dangle
    (Object.keys(this.eventEmitter._events) as string[]).forEach((eventNameId) => {
      // Parse the string
      const theEventName = eventNameId.substring(0, eventNameId.indexOf(SEPARATOR));
      const theHandlerName = eventNameId.substring(eventNameId.indexOf(SEPARATOR) + SEPARATOR.length);
      if (handlerName === theHandlerName) {
        // eslint-disable-next-line no-underscore-dangle
        this.#off(theEventName, theHandlerName, this.eventEmitter._events[eventNameId].fn);
      }
    });
  };

  /**
   * Helper function to register an EventStringId and check the payload on response before calling back.
   * @param {string} handlerName - A unique handler event name to match the emit with the on
   * @param {string} eventStringId - The Event String Id
   * @param {(typedPayload: T) => void} callback - The callback executed when the event is raised and the payload has been validated
   * @private
   */
  #onMapHelperHandler = <T>(eventName: string, handlerName: string, callback: TypeEventHandlerFunction<T>) => {
    // Register a generic event
    this.#on<T>(eventName, handlerName, (payload) => {
      // Log (this is the only place in all the code base where this function is called)
      logger.logTraceCoreAPIEvent(eventName, payload);

      // Sure callback
      callback(payload);
    });
  };

  // #region SPECIALIZED EVENTS - IMPORTANT
  // GV These events exists to communicate between the Shell/App/MapViewer components.

  /**
   * Emits a map reload event to all handlers.
   * @private
   */
  emitMapReload = (mapId: string, mapFeaturesConfig: TypeMapFeaturesConfig) => {
    // Emit the event
    this.#emit(EVENT_MAP_RELOAD, mapId, mapFeaturesConfig);
  };

  /**
   * Registers a map reload event callback.
   * @param {TypeEventHandlerFunction<TypeMapFeaturesConfig>} callback - The callback to be executed whenever the event is emitted
   */
  onMapReload = (mapId: string, callback: TypeEventHandlerFunction<TypeMapFeaturesConfig>) => {
    // Register the event callback
    this.#onMapHelperHandler(EVENT_MAP_RELOAD, mapId, callback);
  };

  /**
   * Unregisters a map reload event callback.
   * @param {TypeEventHandlerFunction<TypeMapFeaturesConfig>} callback - The callback to be removed whenever the event is emitted
   */
  offMapReload = (mapId: string, callback: TypeEventHandlerFunction<TypeMapFeaturesConfig>) => {
    // Unregister the event callback
    this.#off(EVENT_MAP_RELOAD, mapId, callback);
  };

  /**
   * Emits a map reconstruct event to all handlers.
   * @private
   */
  emitMapReconstruct = (mapId: string, mapFeaturesConfig: TypeMapFeaturesConfig) => {
    // Emit the event
    this.#emit(EVENT_MAP_RECONSTRUCT, mapId, mapFeaturesConfig);
  };

  /**
   * Registers a map reconstruct event callback.
   * @param {TypeEventHandlerFunction<TypeMapFeaturesConfig>} callback - The callback to be executed whenever the event is emitted
   */
  onMapReconstruct = (mapId: string, callback: TypeEventHandlerFunction<TypeMapFeaturesConfig>) => {
    // Register the event callback
    this.#onMapHelperHandler(EVENT_MAP_RECONSTRUCT, mapId, callback);
  };

  /**
   * Unregisters a map reconstruct event callback.
   * @param {TypeEventHandlerFunction<TypeMapFeaturesConfig>} callback - The callback to be removed whenever the event is emitted
   */
  offMapReconstruct = (mapId: string, callback: TypeEventHandlerFunction<TypeMapFeaturesConfig>) => {
    // Unregister the event callback
    this.#off(EVENT_MAP_RECONSTRUCT, mapId, callback);
  };

  // #endregion
}
