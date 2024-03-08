import { EVENT_NAMES } from './events/event-types';
import { Event } from './events/event';

import { Projection, PROJECTION_NAMES } from '@/geo/projection/projection';

import { MapViewer } from '@/geo/map/map-viewer';

import { Plugin } from './plugin/plugin';
import { GeoUtilities } from '@/geo/utils/utilities';
import { DateMgt } from '@/core/utils/date-mgt';

import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import * as Utilities from '../core/utils/utilities';
import { GeoViewLayerPayload, payloadIsTestGeoViewLayers } from './events/payloads/geoview-layer-payload';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';
import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/utils/hover-feature-info-layer-set';
import { AllFeatureInfoLayerSet } from '@/geo/utils/all-feature-info-layer-set';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { initMapDivFromFunctionCall } from '@/core/types/cgpv-types';

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

  // Legends layer set instanciator
  getLegendsLayerSet = LegendsLayerSet.get;

  // HoverFeatureInfoLayerSet instanciator
  getHoverFeatureInfoLayerSet = HoverFeatureInfoLayerSet.get;

  // AllFeatureInfoLayerSet instanciator
  getAllFeatureInfoLayerSet = AllFeatureInfoLayerSet.get;

  // FeatureInfoLayerSet instanciator
  getFeatureInfoLayerSet = FeatureInfoLayerSet.get;

  /**
   * Initiate the event and projection objects
   */
  constructor() {
    this.event = new Event();
    this.projection = new Projection();
    this.plugin = new Plugin();
    this.geoUtilities = new GeoUtilities();
    this.dateUtilities = new DateMgt();

    // apply focus to element when keyboard navigation is use
    this.manageKeyboardFocus();

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
   * Apply outline to elements when keyboard is use to navigate
   * Code from: https://github.com/MaxMaeder/keyboardFocus.js
   */
  private manageKeyboardFocus = (): void => {
    // Remove the 'keyboard-focused' class from any elements that have it
    function removeFocusedClass() {
      const previouslyFocusedElement = document.getElementsByClassName('keyboard-focused')[0];
      if (previouslyFocusedElement) previouslyFocusedElement.classList.toggle('keyboard-focused');
    }

    // Add event listener for when tab pressed
    document.addEventListener('keyup', (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      // get array of map elements
      const elements: Element[] = Array.from(document.getElementsByClassName('geoview-map'));
      const activeEl = document.activeElement;

      if (elements.some((element) => element.contains(activeEl))) {
        // Remove class on previous element then add the 'keyboard-focused' class to the currently focused element
        removeFocusedClass();
        activeEl?.classList.toggle('keyboard-focused');

        // Check if the focus element is a map and set store value for crosshair
        const mapId =
          activeEl?.closest('.geoview-shell') !== null ? activeEl?.closest('.geoview-shell')!.getAttribute('id')?.split('-')[1] : undefined;

        if (mapId !== undefined) {
          const mapFocus = activeEl?.getAttribute('id') === `mapbox-${mapId}`;
          logger.logInfo(`Map ${mapId} focus and crosshair is enabled`, [mapFocus]);
          AppEventProcessor.setAppIsCrosshairActive(mapId, mapFocus);
        }
      }
    });

    // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
    document.addEventListener('click', removeFocusedClass);
    document.addEventListener('focusout', removeFocusedClass);
  };

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
   * Create a new map in a given div id.
   * !The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
   * If is present, the div will be created with a default config
   *
   * @param {string} divId the id of the div to create map in
   * @param {string} mapConfig the config passed in from the function call
   */
  createMapFromConfig = (divId: string, mapConfig: string): void => {
    // Get the map div
    const mapDiv = document.getElementById(divId);

    // If found the map div
    if (mapDiv) {
      // Init by function call
      initMapDivFromFunctionCall(mapDiv, mapConfig);
    } else {
      logger.logError(`Div with id ${divId} does not exist`);
    }
  };
}
