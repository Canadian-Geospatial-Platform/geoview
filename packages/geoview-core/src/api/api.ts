import { ConfigApi } from '@config/config-api';

import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { Plugin } from '@/api/plugin/plugin';

import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import * as Utilities from '@/core/utils/utilities';

import { Projection } from '@/geo/utils/projection';
import { MapViewer } from '@/geo/map/map-viewer';
import * as GeoUtilities from '@/geo/utils/utilities';

import { initMapDivFromFunctionCall } from '@/app';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';

/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export class API {
  // ConfigApi static class
  config = ConfigApi;

  // list of available maps
  #maps: Record<string, MapViewer> = {};

  // load plugins API
  plugin: typeof Plugin;

  // utilities object
  utilities;

  // Keep all callback delegates references
  #onMapViewerReadyHandlers: MapViewerReadyDelegate[] = [];

  // Keep all callback delegates references
  #onMapAddedToDivHandlers: MapAddedToDivDelegate[] = [];

  /**
   * Initiate the event and projection objects
   */
  constructor() {
    // TODO: Check - Maybe move plugin inside utilities?
    this.plugin = Plugin;

    this.utilities = {
      core: Utilities,
      geo: GeoUtilities,
      projection: Projection,
      date: DateMgt,
    };

    // apply focus to element when keyboard navigation is use
    API.#manageKeyboardFocus();
  }

  /**
   * Gets the list of all map IDs currently in the collection.
   *
   * @returns {string[]} Array of map IDs
   */
  getMapViewerIds(): string[] {
    return Object.keys(this.#maps);
  }

  /**
   * Gets a map viewer instance by its ID.
   *
   * @param {string} mapId - The unique identifier of the map to retrieve
   * @returns {MapViewer} The map viewer instance if found
   * @throws {Error} If the map with the specified ID is not found
   */
  getMapViewer(mapId: string): MapViewer {
    const map = this.#maps[mapId];
    if (!map) throw new Error(`Map with ID ${mapId} not found`);

    return map;
  }

  /**
   * Delete a map viewer instance by its ID.
   *
   * @param {string} mapId - The unique identifier of the map to delete
   * @param {boolean} deleteContainer - True if we want to delete div from the page
   * @returns {Promise<HTMLElement>} The Promise containing the HTML element
   */
  deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<HTMLElement | void> {
    if (!this.hasMapViewer(mapId)) {
      logger.logWarning(`Cannot delete map. Map with ID ${mapId} does not exist`);
      return Promise.resolve();
    }

    // Only delete from #maps after successful removal
    return this.getMapViewer(mapId)
      .remove(deleteContainer)
      .then((element: HTMLElement) => {
        // Delete the map instance from the maps array, will delete attached plugins
        delete this.#maps[mapId];

        return element;
      });
  }

  /**
   * Return true if a map id is already registered.
   *
   * @param {string} mapId - The unique identifier of the map to retrieve
   * @returns {boolean} True if map exist
   */
  hasMapViewer(mapId: string): boolean {
    return mapId in this.#maps;
  }

  /**
   * Sets a map viewer in maps.
   * @param {string} mapId - ID of the map
   * @param {MapViewer} mapViewer - The viewer to be added
   * @param {(mapViewer: MapViewer) => void} onMapViewerInit - Function to run on map init
   */
  setMapViewer(mapId: string, mapViewer: MapViewer, onMapViewerInit?: (mapViewer: MapViewer) => void): void {
    if (this.hasMapViewer(mapId)) logger.logError(`Cannot add map. Map with ID ${mapId} already exists`);
    else {
      this.#maps[mapId] = mapViewer;

      // Register a handler (which will only happen once) for when the map viewer will get initialized.
      // At the time of writing, this happens later, asynchronously, via the components/map/map.tsx when 'MapViewer.initMap()' is called.
      // That should be fixed eventually, but that refactoring is out of the scope at the time of writing. So, I'm doing like this for now.
      this.#maps[mapId].onMapInit((viewer) => {
        // MapViewer has been created and initialized, callback about it
        onMapViewerInit?.(viewer);
        // Emit that viewer is ready
        this.#emitMapViewerReady({ mapId });
      });
    }
  }

  /**
   * Apply outline to elements when keyboard is use to navigate
   * Code from: https://github.com/MaxMaeder/keyboardFocus.js
   * @private
   */
  static #manageKeyboardFocus(): void {
    // Remove the 'keyboard-focused' class from any elements that have it
    function removeFocusedClass(): void {
      const previouslyFocusedElement = document.getElementsByClassName('keyboard-focused')[0];
      if (previouslyFocusedElement) previouslyFocusedElement.classList.toggle('keyboard-focused');
    }

    // Add event listener for when tab pressed
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

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
  }

  /**
   * Create a new map in a given div id.
   * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
   * If is present, the div will be created with a default config
   *
   * @param {string} divId - id of the div to create map in
   * @param {string} mapConfig - config passed in from the function call (string or url of a config path)
   * @param {number} divHeight - height of the div to inject the map in (mandatory if the map reloads)
   */
  // This function is called by the template, and since the template use the instance of the object from cgpv.api, this function has to be on the instance, not static. Refactor this?
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  async createMapFromConfig(divId: string, mapConfig: string, divHeight?: number): Promise<void> {
    // Get the map div
    const mapDiv = document.getElementById(divId);
    if (divHeight) mapDiv!.style.height = `${divHeight}px`;

    // If found the map div
    if (mapDiv) {
      // Init by function call
      await initMapDivFromFunctionCall(mapDiv, mapConfig);
      this.#emitMapAddedToDiv({ mapId: divId });
      return Promise.resolve();
    }

    return Promise.reject(new Error(`Div with id ${divId} does not exist`));
  }

  /**
   * Emits a map viewer ready event to all handlers.
   * @private
   */
  #emitMapViewerReady(event: MapViewerReadyEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapViewerReadyHandlers, event);
  }

  /**
   * Registers a map viewer ready event callback.
   * @param {MapViewerReadyDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapViewerReady(callback: MapViewerReadyDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapViewerReadyHandlers, callback);
  }

  /**
   * Unregisters a map viewer ready event callback.
   * @param {MapViewerReadyDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapViewerReady(callback: MapViewerReadyDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapViewerReadyHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {MapAddedToDivEvent} event - The event to emit
   * @private
   */
  #emitMapAddedToDiv(event: MapAddedToDivEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapAddedToDivHandlers, event);
  }

  /**
   * Registers a map added to div event handler.
   * @param {MapAddedToDivDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapAddedToDiv(callback: MapAddedToDivDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapAddedToDivHandlers, callback);
  }

  /**
   * Unregisters a map added to div event handler.
   * @param {MapAddedToDivdDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapAddedToDiv(callback: MapAddedToDivDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapAddedToDivHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type MapViewerReadyDelegate = EventDelegateBase<API, MapViewerReadyEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapViewerReadyEvent = {
  // The added map
  mapId: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapAddedToDivDelegate = EventDelegateBase<API, MapAddedToDivEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapAddedToDivEvent = {
  // The added map
  mapId: string;
};
