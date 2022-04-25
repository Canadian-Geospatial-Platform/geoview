import EventEmitter from 'eventemitter3';

import { generateId } from '../core/utils/utilities';
import { toJsonObject, TypeJsonValue, TypeJsonObject } from '../core/types/cgpv-types';

import { MAP } from './events/map';
import { LAYER } from './events/layer';
import { APPBAR } from './events/appbar';
import { NAVBAR } from './events/navbar';
import { SNACKBAR } from './events/snackbar';
import { BASEMAP } from './events/basemap';
import { OVERVIEW_MAP } from './events/overview-map';
import { DETAILS_PANEL } from './events/details-panel';
import { MARKER_ICON } from './events/marker-icon';
import { CLUSTER_ELEMENT } from './events/cluster-element';
import { DRAWER } from './events/drawer';
import { MODAL } from './events/modal';
import { PANEL } from './events/panel';
import { VECTOR } from './events/vector';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
  MAP,
  LAYER,
  APPBAR,
  NAVBAR,
  MARKER_ICON,
  CLUSTER_ELEMENT,
  PANEL,
  MODAL,
  OVERVIEW_MAP,
  DETAILS_PANEL,
  SNACKBAR,
  BASEMAP,
  DRAWER,
  VECTOR,
};

/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @export
 * @class Event
 */
export class Event {
  // eventemitter object, used to handle emitting/subscribing to events
  eventEmitter: EventEmitter;

  // events object containing all registered events
  events: TypeJsonObject = {};

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
   */
  on = (eventName: string, listener: (payload: TypeJsonObject) => void, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: TypeJsonObject) => {
      let listenerPayload: TypeJsonObject;

      // if a handler name was specified, callback will return that data if found
      if (handlerName && (payload.handlerName as string) === handlerName) {
        listenerPayload = this.events[eName][handlerName];
      } else {
        listenerPayload = payload;
      }

      listener(listenerPayload);
    };

    this.eventEmitter.on(eName, listen);
  };

  /**
   * Listen to emitted events once
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener the callback function
   * @param {string} [handlerName] the handler name to return data from
   */
  once = (eventName: string, listener: (payload: TypeJsonValue) => void, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: TypeJsonObject) => {
      let listenerPayload: TypeJsonObject;

      // if a handler name was specefieid, callback will return that data if found
      if (handlerName && payload.handlerName === handlerName) {
        listenerPayload = this.events[eName][handlerName];
      } else {
        listenerPayload = payload;
      }

      listener(listenerPayload);
    };

    this.eventEmitter.once(eName, listen);
  };

  /**
   * Will remove the specified @listener from @eventname list
   *
   * @param {string} eventName the event name of the event to be removed
   * @param {string} handlerName the name of the handler an event needs to be removed from
   */
  off = (eventName: string, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    this.eventEmitter.off(eName);

    delete this.events[eName];
  };

  /**
   * Unsubscribe from all events on the map
   *
   * @param {string} handlerName the id of the map to turn unsubscribe the event from
   */
  offAll = (handlerName: string): void => {
    Object.keys(this.events).forEach((event) => {
      if (event.includes(handlerName)) {
        this.off(event);
      }
    });
  };

  /**
   * Will emit the event on the event name with the @payload
   *
   * @param {string} event the event name to emit
   * @param {string} handlerName the event handler, used if there are multiple emitters with same event name
   * @param {object} payload a payload (data) to be emitted with the event
   */
  emit = (event: string, handlerName: string | undefined | null, payload: Record<string, unknown>): void => {
    // event name
    const eventName = event + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    // handler name, registers a unique handler to be used when multiple events emit with same event name
    const hName = generateId(handlerName);

    if (!this.events[event]) {
      this.events[eventName] = {};
    }

    if (!this.events[eventName][hName]) {
      this.events[eventName][hName] = {};
    }

    // store the emitted event to the events array
    this.events[eventName][hName] = toJsonObject({
      handlerName,
      ...payload,
    });

    this.eventEmitter.emit(eventName, { ...payload, handlerName }, handlerName);
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
  getEvents = (): Record<string, Record<string, unknown>> => {
    return this.events;
  };
}
