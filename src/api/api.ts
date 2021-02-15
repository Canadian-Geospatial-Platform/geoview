import React from 'react';

import * as ReactTranslate from 'react-i18next';

import * as MaterialUI from '@material-ui/core/styles';

import * as Babel from '@babel/standalone';

import { Map } from 'leaflet';

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

    // timeout number used to check if everything is ready to make API calls
    isReady = 0;

    // callback function to call after everything is ready
    readyCallback: () => void = () => undefined;

    /**
     * Initiate the event and projection objects
     */
    constructor() {
        this.event = new Event();
        this.projection = new Projection();
    }

    /**
     * Check if map rendering / drawing is ready then run the callback function
     * Timeout does not effect rendering speed, each map will cancel the previous timer after it renders
     * so timing of rendering will be based on device specs.
     *
     */
    ready = (): void => {
        // Clear our timeout throughout the event change
        window.clearTimeout(this.isReady);

        // Set a timeout to run after render ends
        // this will only be called after the last map renders so no delay in rendering and performance will happen
        this.isReady = window.setTimeout(() => {
            // Run the callback
            if (this.readyCallback) this.readyCallback();
        }, 1000);
    };

    /**
     * Get the instance of a map by it's ID to access API functions
     *
     * @param {string} id the map id
     *
     * @returns map api functions
     */
    map = (id: string): unknown => {
        for (let i = 0; i < this.maps.length; i++) {
            if (this.maps[i].id === id) {
                this.selectedMapInstance = this.maps[i];

                break;
            }
        }

        return {
            ...this.selectedMapInstance,
            ...this.selectedMapInstance.vector,
            ...this.selectedMapInstance.buttonPanel,
            ...this.selectedMapInstance.basemap,
        };
    };

    /**
     * Get the instance of a map by a leaflet instance to access API functions
     *
     * @param {Map} map the leaflet map instance
     *
     * @returns map api functions
     */
    mapInstance = (map: Map): unknown => {
        for (let i = 0; i < this.maps.length; i++) {
            if (this.maps[i].map === map) {
                this.selectedMapInstance = this.maps[i];

                break;
            }
        }

        return {
            ...this.selectedMapInstance,
            ...this.selectedMapInstance.vector,
            ...this.selectedMapInstance.buttonPanel,
            ...this.selectedMapInstance.basemap,
        };
    };

    /**
     * Load a react component file from url
     *
     * @param {string} url the url of the react component file
     * @param {Record<string, unknown>} props an optional properties to be passed to the component
     *
     * @returns a React Component
     */
    loadRemoteComponent = async (url: string, props?: Record<string, unknown>): Promise<React.ReactNode> => {
        const result = await fetch(url);

        if (!result.ok) {
            return result.status === 404 ? 'plugin file not found / fichier plugin introuvable' : result.statusText;
        }

        const source = await result.text();

        const exports = {};
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function require(name: string) {
            switch (name) {
                case 'react':
                    return React;
                case 'react-i18next':
                    return ReactTranslate;
                case '@material-ui/core/styles':
                    return MaterialUI;
                default:
                    return React;
            }

            // eslint-disable-next-line no-throw-literal
            throw `can't use modules other than "react" in remote component.`;
        }
        const transformedSource = Babel.transform(source, {
            presets: ['react', 'es2015', ['stage-2', { decoratorsLegacy: true }]],
        }).code;

        // eslint-disable-next-line no-eval
        eval(transformedSource || '');

        // eslint-disable-next-line no-underscore-dangle
        const plugin = exports.__esModule ? exports.default : exports;

        // eslint-disable-next-line no-underscore-dangle
        return React.createElement(plugin, props || {});
    };
}

export const api = new API();
