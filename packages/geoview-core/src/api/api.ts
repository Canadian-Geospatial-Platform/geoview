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
import { FeatureInfoLayerSet } from '../geo/utils/feature-info-layer-set';
import { LegendsLayerSet } from '../geo/utils/legend-layer-set';
import { payloadIsAGeoViewLayer } from './events/payloads/geoview-layer-payload';

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

  // FeatureInfo layer set instanciator
  createFeatureInfoLayerSet = FeatureInfoLayerSet.create;

  // Legends layer set instanciator
  createLegendsLayerSet = LegendsLayerSet.create;

  /**
   * Initiate the event and projection objects
   */
  constructor() {
    this.event = new Event();
    this.projection = new Projection();
    this.plugin = new Plugin();
    this.geoUtilities = new GeoUtilities();
    this.dateUtilities = new DateMgt();

    // Run the callback if all maps are ready
    this.event.on(
      EVENT_NAMES.LAYER.EVENT_LAYER_ADDED,
      (payload) => {
        if (payloadIsAGeoViewLayer(payload)) {
          let allMapsAreReady = true;
          Object.keys(this.maps).forEach((mapKey) => {
            allMapsAreReady &&= this.maps[mapKey].nbConfigLayers === 0;
          });
          if (allMapsAreReady && this.readyCallback) this.readyCallback();
        }
      },
      'all-map-ready?'
    );
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
    Object.keys(this.maps).forEach((mapKey) => this.maps[mapKey].mapReady());
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
