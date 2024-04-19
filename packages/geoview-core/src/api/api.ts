import { ConfigApi } from 'geoview-config/src/config/config-api';
import { Event } from './events/event';

import { Projection } from '@/geo/projection/projection';

import { MapViewer } from '@/geo/map/map-viewer';

import { Plugin } from './plugin/plugin';
import { DateMgt } from '@/core/utils/date-mgt';

import * as Utilities from '@/core/utils/utilities';
import * as GeoUtilities from '@/geo/utils/utilities';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';
import { initMapDivFromFunctionCall } from '@/app';

/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export class API {
  // ConfigApi instance
  configApi = ConfigApi;

  // event object used to handle triggering events, subscribing to an event etc...
  event: Event;

  // list of available maps
  maps: Record<string, MapViewer> = {};

  // load plugins API
  plugin: Plugin;

  // utilities object
  utilities;

  /**
   * Initiate the event and projection objects
   */
  constructor() {
    this.event = new Event();
    this.plugin = new Plugin();

    this.utilities = {
      core: Utilities,
      geo: GeoUtilities,
      projection: new Projection(),
      date: new DateMgt(),
    };

    // apply focus to element when keyboard navigation is use
    this.#manageKeyboardFocus();
  }

  /**
   * Apply outline to elements when keyboard is use to navigate
   * Code from: https://github.com/MaxMaeder/keyboardFocus.js
   * @private
   */
  #manageKeyboardFocus = (): void => {
    // Remove the 'keyboard-focused' class from any elements that have it
    function removeFocusedClass(): void {
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
          const mapFocus = activeEl?.getAttribute('id') === `mapTargetElement-${mapId}`;
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
   * Create a new map in a given div id.
   * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
   * If is present, the div will be created with a default config
   *
   * @param {string} divId the id of the div to create map in
   * @param {string} mapConfig the config passed in from the function call
   */
  createMapFromConfig = (divId: string, mapConfig: string): Promise<void> => {
    // Get the map div
    const mapDiv = document.getElementById(divId);

    // If found the map div
    if (mapDiv) {
      // Init by function call
      return initMapDivFromFunctionCall(mapDiv, mapConfig);
    }

    // Log error
    logger.logError(`Div with id ${divId} does not exist`);
    return Promise.reject(new Error(`Div with id ${divId} does not exist`));
  };
}
