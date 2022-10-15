import { EVENT_NAMES } from './events/event-types';
import { Event } from './events/event';

import { Projection, PROJECTION_NAMES } from '../geo/projection/projection';

import { MapViewer } from '../geo/map/map';

import { Plugin } from './plugin/plugin';
import { GeoUtilities } from '../geo/utils/utilities';
import { DateMgt } from '../core/utils/date-mgt';

import { CONST_LAYER_TYPES } from '../geo/layer/geoview-layers/abstract-geoview-layers';
import * as MarkerDefinitions from '../core/types/marker-definitions';
import { generateId, addUiComponent } from '../core/utils/utilities';

/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
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
  layerTypes = CONST_LAYER_TYPES;

  // list of available maps
  maps: Record<string, MapViewer> = {};

  // timeout number used to check if everything is ready to make API calls
  isReady = 0;

  // callback function to call after everything is ready
  readyCallback?: () => void;

  // load plugins API
  plugin: Plugin;

  // utilities object
  geoUtilities: GeoUtilities;

  // dates utilities object
  dateUtilities: DateMgt;

  // used to access marker definitions
  markerDefinitions = MarkerDefinitions;

  // generateId function
  generateId = generateId;

  // add ui component to a custom div
  addUiComponent = addUiComponent;

  /**
   * Initiate the event and projection objects
   */
  constructor() {
    this.event = new Event();
    this.projection = new Projection();
    this.plugin = new Plugin();
    this.geoUtilities = new GeoUtilities();
    this.dateUtilities = new DateMgt();
  }

  /**
   */
  /**
   * Check if map rendering / drawing is ready then run the callback function
   * Timeout does not effect rendering speed, each map will cancel the previous timer after it renders
   * so timing of rendering will be based on device specs.
   *
   * @param callback a callback to make once the map has rendered
   */
  ready = (callback: () => void): void => {
    // Clear our timeout throughout the event change
    window.clearTimeout(this.isReady);

    // Set a timeout to run after render ends
    // this will only be called after the last map renders so no delay in rendering and performance will happen
    this.isReady = window.setTimeout(() => {
      // call the callback function to load plugins
      if (callback) callback();
    }, 500);
  };

  /**
   * Call map ready functions and the init callback once everything is done loading
   * including plugins
   */
  callInitCallback = () => {
    // run the map ready function on each map instance
    for (let mapIndex = 0; mapIndex < Object.keys(this.maps).length; mapIndex++) {
      const mapId = Object.keys(this.maps)[mapIndex];

      this.map(mapId).mapReady();
    }

    // Run the callback
    if (this.readyCallback) this.readyCallback();
  };

  /**
   * Get the instance of a map by it's ID to access API functions
   *
   * @param {string} mapId the map id
   *
   * @returns map api functions
   */
  map = (mapId: string): MapViewer => {
    return this.maps[mapId];
  };
}
