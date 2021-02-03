/* eslint-disable no-plusplus */
import { Event, EVENT_NAMES } from './event';

import { Projection, PROJECTION_NAMES } from './projection';

import { LayerTypes } from '../common/layers/layer';

import { MapViewer } from '../common/map-viewer';

/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @export
 * @class API
 */
export class API {
    // event object used to handle triggering events, subscribing to an event etc...
    event: Event;

    // available event names
    eventNames = EVENT_NAMES;

    // project object used to handle transforming projects
    projection: Projection;

    // available projection names
    projectNames = PROJECTION_NAMES;

    // available layer types
    layerTypes = LayerTypes;

    // list of available maps
    maps: MapViewer[] = [];

    // set selected map instance / app
    selectedMapInstance!: MapViewer;

    /**
     * Initiate the event and projection objects
     */
    constructor() {
        this.event = new Event();
        this.projection = new Projection();
    }

    /**
     * Get the instance of a map by it's ID to access API functions
     *
     * @param {string} id the map id
     *
     * @returns an instance of map
     */
    map = (id: string): unknown => {
        for (let i = 0; i < this.maps.length; i++) {
            if (this.maps[i].mapInstance.id === id) {
                this.selectedMapInstance = this.maps[i];

                break;
            }
        }

        return { ...this.selectedMapInstance, ...this.selectedMapInstance.vector };
    };
}

export const api = new API();
