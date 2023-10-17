import { EVENT_NAMES } from './events/event-types';
import { Event } from './events/event';

import { Projection, PROJECTION_NAMES } from '@/geo/projection/projection';

import { MapViewer } from '@/geo/map/map-viewer';

import { Plugin } from './plugin/plugin';
import { GeoUtilities } from '@/geo/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';

import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import * as Utilities from '../core/utils/utilities';
// TODO: Refactor - Remove this following import and the class attributes, now that we have the higher level utilities import :)
import { generateId, addUiComponent, showMessage } from '@/core/utils/utilities';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
import { GeoViewLayerPayload, payloadIsTestGeoViewLayers } from './events/payloads/geoview-layer-payload';
import { createMapFromConfig } from '@/core/utils/create-map-from-config';

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
  readyCallback?: (mapId?: string) => void;

  // load plugins API
  plugin: Plugin;

  // utilities object
  utilities = Utilities;

  // geo utilities object
  geoUtilities: GeoUtilities;

  // dates utilities object
  dateUtilities: DateMgt;

  // generateId function
  generateId = generateId;

  // create map in a chosen div
  createMapFromConfig = createMapFromConfig;

  // add ui component to a custom div
  addUiComponent = addUiComponent;

  // show message function
  showMessage = showMessage;

  // FeatureInfo layer set instanciator
  getFeatureInfoLayerSet = FeatureInfoLayerSet.get;

  // Legends layer set instanciator
  getLegendsLayerSet = LegendsLayerSet.get;

  /**
   * Initiate the event and projection objects
   */
  constructor() {
    this.event = new Event();
    this.projection = new Projection();
    this.plugin = new Plugin();
    this.geoUtilities = new GeoUtilities();
    this.dateUtilities = new DateMgt();

    // Run the callback for maps that have the triggerReadyCallback set to true and when all the maps are ready
    this.event.once(
      EVENT_NAMES.LAYER.EVENT_IF_CONDITION,
      (payload) => {
        if (payloadIsTestGeoViewLayers(payload)) {
          let readyCallbackHasRun4AllMaps = false;
          const intervalId = setInterval(() => {
            let allMapsAreReady = true;
            Object.keys(this.maps).forEach((mapId) => {
              if (this.maps[mapId].mapIsReady()) {
                this.event.emit(GeoViewLayerPayload.createTestGeoviewLayersPayload(`${mapId}/visibilityTest`));
                // Run the callback for maps that have the triggerReadyCallback set using the mapId for the parameter value
                if (this.maps[mapId].mapFeaturesConfig.triggerReadyCallback && !this.maps[mapId].readyCallbackHasRun) {
                  if (this.readyCallback) this.readyCallback(mapId);
                  this.maps[mapId].readyCallbackHasRun = true;
                }
              } else allMapsAreReady = false;
            });

            // Run the callback when all the maps are ready using allMaps for the parameter value
            if (allMapsAreReady && !readyCallbackHasRun4AllMaps && this.readyCallback) {
              clearInterval(intervalId);
              readyCallbackHasRun4AllMaps = true;
              this.readyCallback('allMaps');
            }
          }, 250);
        }
      },
      'run cgpv.init callback?'
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
}
