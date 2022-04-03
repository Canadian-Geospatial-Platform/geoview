import EventEmitter from 'eventemitter3';

import { generateId } from '../core/utils/utilities';
import { TypeJsonString, TypeJSONValue, TypeJSONObject } from '../core/types/cgpv-types';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
  /**
   * Event triggered when map is loaded and api ready
   */
  EVENT_MAP_LOADED: 'map/loaded',

  /**
   * Event triggered to reload the map
   */
  EVENT_MAP_RELOAD: 'map/reload',

  /**
   * Event triggered when a user stops moving the map
   */
  EVENT_MAP_MOVE_END: 'map/moveend',

  /**
   * Event triggered when a user stops zooming the map
   */
  EVENT_MAP_ZOOM_END: 'map/zoomend',

  /**
   * Event triggered when a user wants to add a component
   */
  EVENT_MAP_ADD_COMPONENT: 'map/add_component',

  /**
   * Event triggered when a user wants to remove a component
   */
  EVENT_MAP_REMOVE_COMPONENT: 'map/remove_component',

  /**
   * Event triggered when a user end a select box
   */
  EVENT_BOX_SELECT_END: 'box/zoom_or_select_end',

  /**
   * Event triggered when a user focus the map with keyboard (WCAG)
   */
  EVENT_MAP_IN_KEYFOCUS: 'map/inkeyfocus',

  /**
   * Event triggered to enable / disable crosshair
   */
  EVENT_MAP_CROSSHAIR_ENABLE_DISABLE: 'map/crosshair_enable_disable',

  /**
   * Event triggered when the overview map is toggled
   */
  EVENT_OVERVIEW_MAP_TOGGLE: 'overview_map/toggle',

  /**
   * Event triggered when a drawer opens/closes
   */
  EVENT_DRAWER_OPEN_CLOSE: 'drawer/open_close',

  /**
   * Event triggered when a new appbar panel has been created
   */
  EVENT_APPBAR_PANEL_CREATE: 'appbar/panel_create',

  /**
   * Event triggered when an appbar button panel has been removed
   */
  EVENT_APPBAR_PANEL_REMOVE: 'appbar/panel_remove',

  /**
   * Event triggered when a new navbar button or panel has been created
   */
  EVENT_NAVBAR_BUTTON_PANEL_CREATE: 'navbar/button_panel_create',
  /**
   * Event triggered when a navbar button or button panel has been removed
   */
  EVENT_NAVBAR_BUTTON_PANEL_REMOVE: 'navbar/button_panel_remove',

  /**
   * Event triggered when a request is made to open a panel
   */
  EVENT_PANEL_OPEN: 'panel/open',
  /**
   * Event triggered when a request is made to close a panel
   */
  EVENT_PANEL_CLOSE: 'panel/close',
  /**
   * Event triggered when a request is made to add an action button
   */
  EVENT_PANEL_ADD_ACTION: 'panel/add_action',
  /**
   * Event triggered when a request is made to remove an action button
   */
  EVENT_PANEL_REMOVE_ACTION: 'panel/remove_action',
  /**
   * Event triggered when a request is made to change panel content
   */
  EVENT_PANEL_CHANGE_CONTENT: 'panel/change_content',

  /**
   * Event triggered when adding a new layer
   */
  EVENT_LAYER_ADD: 'layer/add',
  /**
   * Event triggered when adding a new layer
   */
  EVENT_LAYER_ADDED: 'layer/added',
  /**
   * Event triggered when removing a layer
   */
  EVENT_REMOVE_LAYER: 'layer/remove',
  /**
   * Event triggered when getting all layers
   */
  EVENT_GET_LAYERS: 'layer/get_layers',

  /**
   * Event triggered when a request is made to add a vector
   */
  EVENT_VECTOR_ADD: 'vector/add',
  /**
   * Event triggered when a request is made to remove a vector
   */
  EVENT_VECTOR_REMOVE: 'vector/remove',
  /**
   * Event is triggered when a vector has been added
   */
  EVENT_VECTOR_ADDED: 'vector/added',
  /**
   * Event is triggered when you want to turn off all visible vectors
   */
  EVENT_VECTOR_OFF: 'vector/off',
  /**
   * Event is triggered when you want to turn on all visible vectors
   */
  EVENT_VECTOR_ON: 'vector/on',

  /**
   * Event triggered when a request is made to add a cluster element
   */
  EVENT_CLUSTER_ELEMENT_ADD: 'cluster_element/add',
  /**
   * Event triggered when a request is made to remove a cluster element
   */
  EVENT_CLUSTER_ELEMENT_REMOVE: 'cluster_element/remove',
  /**
   * Event is triggered when a cluster element has been added
   */
  EVENT_CLUSTER_ELEMENT_ADDED: 'cluster_element/added',
  /**
   * Event is triggered when a cluster element start blinking
   */
  EVENT_CLUSTER_ELEMENT_START_BLINKING: 'cluster_element/start_blinking',
  /**
   * Event is triggered when a cluster element stop blinking
   */
  EVENT_CLUSTER_ELEMENT_STOP_BLINKING: 'cluster_element/stop_blinking',
  /**
   * Event is triggered when a cluster element selection indicator changes
   */
  EVENT_CLUSTER_ELEMENT_SELECTION_HAS_CHANGED: 'cluster_element/selection_has_changed',

  /**
   * Event is triggered when updating the basemap layers
   */
  EVENT_BASEMAP_LAYERS_UPDATE: 'basemap/layers_update',

  /**
   * Event is triggered when a snackbar notification opens
   */
  EVENT_SNACKBAR_OPEN: 'snackbar/open',

  /**
   * Event is triggered when a user press enter on a crosshair to open details panel
   */
  EVENT_DETAILS_PANEL_CROSSHAIR_ENTER: 'details_panel/crosshair_enter',

  /**
   * Event is triggered when a call is made to show a marker on map click in details panel
   */
  EVENT_MARKER_ICON_SHOW: 'marker_icon/show',
  /**
   * Event is triggered when a call is made to hide the marker
   */
  EVENT_MARKER_ICON_HIDE: 'marker_icon/hide',

  /**
   * Event is triggered when a new modal is created
   */
  EVENT_MODAL_CREATE: 'modal/create',
  /**
   * Event is triggered when a modal opens
   */
  EVENT_MODAL_OPEN: 'modal/open',
  /**
   * Event is triggered when a modal is closed
   */
  EVENT_MODAL_CLOSE: 'modal/close',
  /**
   * Event is triggered when a modal is updated
   */
  EVENT_MODAL_UPDATE: 'modal/update',
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
  events: TypeJSONObject = {};

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
  on = (eventName: string, listener: (payload: TypeJSONObject) => void, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: TypeJSONObject) => {
      let listenerPayload: TypeJSONObject;

      // if a handler name was specified, callback will return that data if found
      if (handlerName && (payload.handlerName as TypeJsonString) === handlerName) {
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
  once = (eventName: string, listener: (payload: TypeJSONValue) => void, handlerName?: string): void => {
    const eName = eventName + (handlerName && handlerName.length > 0 ? `/${handlerName}` : '');

    /**
     * Listen callback, sets the data that will be returned back
     * @param payload payload being passed when emitted
     */
    const listen = (payload: TypeJSONValue) => {
      let listenerPayload: TypeJSONValue;

      // if a handler name was specefieid, callback will return that data if found
      if (handlerName && (payload as Record<string, unknown>).handlerName === handlerName) {
        listenerPayload = this.events[eName][handlerName] as TypeJSONValue;
      } else {
        listenerPayload = payload;
      }

      listener(listenerPayload);
    };

    this.eventEmitter.once(eName, listen);
  };

  /**
   * Listen to an event emitted by multiple handlers
   * Return the data from multiple emitters with the same event
   *
   * @param {string} eventName the event name to listen to
   * @param {function} listener callback function passing data for multiple handlers
   *
   * @returns An array containing the data from single / multiple handlers
   */
  all = (eventName: string, listener: (payload: TypeJSONValue[]) => void): void => {
    /**
     * callback function to handle adding the data for multiple handlers
     */
    const listen = () => {
      // array containing the data
      const data: TypeJSONValue[] = [];

      // loop through events with same event name and get their data
      for (let i = 0; i < Object.keys(this.events[eventName]).length; i++) {
        const handlerName = Object.keys(this.events[eventName])[i];

        data.push(this.events[eventName][handlerName] as TypeJSONValue);
      }

      // call the callback function
      listener(data);
    };

    // listen to the events by event name
    this.eventEmitter.on(eventName, listen);
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
    const hName = generateId(handlerName as string | undefined);

    if (!this.events[event]) {
      this.events[eventName] = {};
    }

    if (!this.events[eventName][hName]) {
      this.events[eventName][hName] = {};
    }

    // store the emitted event to the events array
    this.events[eventName][hName] = {
      handlerName,
      ...payload,
    } as TypeJSONValue as TypeJSONObject;

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
