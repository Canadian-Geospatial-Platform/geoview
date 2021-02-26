/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import EventEmitter from 'eventemitter3';

/**
 * constant contains event names
 */
export const EVENT_NAMES = {
    /**
     * Event triggered when a user stops moving the map
     */
    EVENT_MAP_MOVE_END: 'map/moveend',

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
     * Event triggered when a panel has been opened or closed
     */
    EVENT_PANEL_OPEN_CLOSE: 'panel/open_close',
    /**
     * Event triggered when a request is made to open a panel
     */
    EVENT_PANEL_OPEN: 'panel/open',
    /**
     * Event triggered when a request is made to close a panel
     */
    EVENT_PANEL_CLOSE: 'panel/close',

    /**
     * Event triggered when adding a new layer
     */
    EVENT_LAYER_ADD: 'layer/add',
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
     * Event is triggered when updating the basemap layers
     */
    EVENT_BASEMAP_LAYERS_UPDATE: 'basemap/layers_update',

    /**
     * Event is triggered when a snackbar notification opens
     */
    EVENT_SNACKBAR_OPEN: 'snackbar/open',
};

/**
 * Class used to handle event emitting and subscribing for the API
 *
 * @export
 * @class Event
 */
export class Event {
    // eventemitter3 object, used to handle emitting/subscribing to events
    eventEmitter: EventEmitter;

    // events object containing all registered events
    events: Record<string, Record<string, unknown>> = {};

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
    on = (eventName: string, listener: (...args: any[]) => void, handlerName?: string): void => {
        /**
         * Listen callback, sets the data that will be returned back
         * @param args payload being passed when emitted
         */
        const listen = (args: unknown) => {
            let data;

            // if a handler name was specified, callback will return that data if found
            if (handlerName && (args as Record<string, unknown>).handlerName === handlerName) {
                data = this.events[eventName][handlerName];
            } else {
                data = args;
            }

            listener(data);
        };

        this.eventEmitter.on(eventName, listen);
    };

    /**
     * Listen to emitted events once
     *
     * @param {string} eventName the event name to listen to
     * @param {function} listener the callback function
     * @param {string} [handlerName] the handler name to return data from
     */
    once = (eventName: string, listener: (...args: any[]) => void, handlerName?: string): void => {
        /**
         * Listen callback, sets the data that will be returned back
         * @param args payload being passed when emitted
         */
        const listen = (args: unknown) => {
            let data;

            // if a handler name was specefieid, callback will return that data if found
            if (handlerName && (args as Record<string, unknown>).handlerName === handlerName) {
                data = this.events[eventName][handlerName];
            } else {
                data = args;
            }

            listener(data);
        };

        this.eventEmitter.once(eventName, listen);
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
    all = (eventName: string, listener: (...args: any[]) => void): void => {
        /**
         * callback function to handle adding the data for multiple handlers
         */
        const listen = () => {
            // array containing the data
            const data = [];

            // loop through events with same event name and get their data
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < Object.keys(this.events[eventName]).length; i++) {
                const handlerName = Object.keys(this.events[eventName])[i];

                data.push(this.events[eventName][handlerName]);
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
     */
    off = (eventName: string): void => {
        this.eventEmitter.off(eventName);
    };

    /**
     * Will emit the event on the event name with the @payload
     *
     * @param {string} event the event name to emit
     * @param {string} handlerName the event handler, used if there are multiple emitters with same event name
     * @param {object} payload a payload (data) to be emitted with the event
     */
    emit = (event: string, handlerName: string | undefined | null, payload: Record<string, unknown>): void => {
        // handler name, registers a unique handler to be used when multiple events emit with same event name
        let hName = handlerName;

        if (!this.events[event]) {
            this.events[event] = {};
        }

        // TODO check if this value was null, undefined then generate a meaniningful name
        if (!hName) {
            hName = new Date().getTime().toString();
        }

        if (!this.events[event][hName]) {
            this.events[event][hName] = {};
        }

        // store the emitted event to the events array
        this.events[event][hName] = {
            handlerName,
            ...payload,
        };

        this.eventEmitter.emit(event, { ...payload, handlerName }, handlerName);
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
