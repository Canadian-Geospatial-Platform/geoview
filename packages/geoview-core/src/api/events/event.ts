import EventEmitter from 'eventemitter3';

import { generateId } from '../../core/utils/utilities';

import { MAP } from './constants/map';
import { LAYER } from './constants/layer';
import { APPBAR } from './constants/appbar';
import { NAVBAR } from './constants/navbar';
import { SNACKBAR } from './constants/snackbar';
import { BASEMAP } from './constants/basemap';
import { OVERVIEW_MAP } from './constants/overview-map';
import { DETAILS_PANEL } from './constants/details-panel';
import { MARKER_ICON } from './constants/marker-icon';
import { CLUSTER_ELEMENT } from './constants/cluster-element';
import { DRAWER } from './constants/drawer';
import { MODAL } from './constants/modal';
import { PANEL } from './constants/panel';
import { VECTOR } from './constants/vector';
import { PayloadBaseClass } from './payloads/payload-base-class';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
  MAP,
  LAYER,
  APPBAR,
  NAVBAR,
  SNACKBAR,
  BASEMAP,
  OVERVIEW_MAP,
  DETAILS_PANEL,
  MARKER_ICON,
  CLUSTER_ELEMENT,
  DRAWER,
  MODAL,
  PANEL,
  VECTOR,
};

export type EventStringId =
  | 'map/loaded'
  | 'map/reload'
  | 'map/moveend'
  | 'map/zoomend'
  | 'map/add_component'
  | 'map/remove_component'
  | 'map/inkeyfocus'
  | 'map/crosshair_enable_disable'
  | 'layer/add'
  | 'layer/added'
  | 'layer/remove'
  | 'layer/get_layers'
  | 'appbar/panel_create'
  | 'appbar/panel_remove'
  | 'navbar/button_panel_create'
  | 'navbar/button_panel_remove'
  | 'navbar/toggle_controls'
  | 'snackbar/open'
  | 'basemap/layers_update'
  | 'overview_map/toggle'
  | 'details_panel/crosshair_enter'
  | 'marker_icon/show'
  | 'marker_icon/hide'
  | 'cluster_element/add'
  | 'cluster_element/remove'
  | 'cluster_element/added'
  | 'cluster_element/start_blinking'
  | 'cluster_element/stop_blinking'
  | 'cluster_element/selection_has_changed'
  | 'box/zoom_or_select_end'
  | 'drawer/open_close'
  | 'modal/create'
  | 'modal/open'
  | 'modal/close'
  | 'modal/update'
  | 'panel/open'
  | 'panel/close'
  | 'panel/add_action'
  | 'panel/remove_action'
  | 'panel/change_content'
  | 'vector/add'
  | 'vector/remove'
  | 'vector/added'
  | 'vector/off'
  | 'vector/on';

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
   */
  on = (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: PayloadBaseClass) => {
      let listenerPayload: PayloadBaseClass;

      // if a handler name was specified, callback will return that data if found
      if (handlerName && payload.handlerName === handlerName) {
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
  once = (eventName: EventStringId, listener: (payload: PayloadBaseClass) => void, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: PayloadBaseClass) => {
      let listenerPayload: PayloadBaseClass;

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
  off = (eventName: EventStringId, handlerName?: string): void => {
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
        this.off(event as EventStringId);
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
  emit = (payload: PayloadBaseClass): void => {
    const { handlerName, event } = payload;

    // event name
    const eventName = event + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    // handler name, registers a unique handler to be used when multiple events emit with same event name
    const hName = generateId(handlerName);

    if (!this.events[event]) {
      this.events[eventName] = {};
    }

    // YC Check if needed
    if (!this.events[eventName][hName]) {
      this.events[eventName][hName] = {} as PayloadBaseClass;
    }

    // store the emitted event to the events array
    this.events[eventName][hName] = {
      ...payload,
    } as PayloadBaseClass;

    this.eventEmitter.emit(eventName, { ...payload }, handlerName);
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
