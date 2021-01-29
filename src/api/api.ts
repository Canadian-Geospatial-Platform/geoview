import { Event, EVENT_NAMES } from './event';

import { Projection, PROJECTION_NAMES } from './projection';

import { LayerTypes } from '../common/layers/layer';

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

    /**
     * Initiate the event and projection objects
     */
    constructor() {
        this.event = new Event();
        this.projection = new Projection();
    }
}

export const api = new API();
