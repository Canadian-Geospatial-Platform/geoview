import { ConfigApi } from '@/api/config/config-api';

import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { Plugin } from '@/api/plugin/plugin';

import { DateMgt } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import * as Utilities from '@/core/utils/utilities';

import { Projection } from '@/geo/utils/projection';
import type { MapViewer } from '@/geo/map/map-viewer';
import { GeoUtilities } from '@/geo/utils/utilities';
import { LayerApi } from '@/geo/layer/layer';

import { initMapDivFromFunctionCall, unmountMap } from '@/app';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { removeGeoviewStore } from '@/core/stores/stores-managers';
import { InitDivNotExistError, MapViewerAlreadyExistsError, MapViewerNotFoundError } from '@/core/exceptions/geoview-exceptions';
import type { TypeMapFeaturesInstance } from '@/api/types/map-schema-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/**
 * Class used to handle api calls (events, functions etc...)
 *
 * @exports
 * @class API
 */
export class API {
  // ConfigApi static class
  config = ConfigApi;

  // LayerApi static class
  layer = LayerApi;

  // list of available maps
  #maps: Record<string, MapViewer> = {};

  // load plugins API
  plugin: typeof Plugin;

  // utilities object
  utilities;

  /**
   * Initializes the API instance with core utilities, plugins, and keyboard navigation.
   * Sets up references to ConfigApi, LayerApi, Plugin system, and utility namespaces.
   * Establishes keyboard focus management for accessibility compliance.
   * @constructor
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
   * Retrieves the list of all map IDs currently registered in the API.
   * Useful for iterating through all active maps or checking which maps exist.
   * @returns {string[]} Array of map identifiers for all registered MapViewer instances
   */
  getMapViewerIds(): string[] {
    return Object.keys(this.#maps);
  }

  /**
   * Checks if a MapViewer instance exists for the specified map ID.
   * Use this method before attempting to access a map to avoid errors.
   * @param {string} mapId - The unique identifier of the map to check
   * @returns {boolean} True if a MapViewer exists with the given ID, false otherwise
   */
  hasMapViewer(mapId: string): boolean {
    return this.getMapViewerIds().includes(mapId);
  }

  /**
   * Retrieves the MapViewer instance for the specified map ID.
   * The MapViewer provides access to the OpenLayers map, layers, controls, and all map-related APIs.
   * Used throughout the application to interact with map functionality.
   * @param {string} mapId - The unique identifier of the map instance to retrieve
   * @returns {MapViewer} The MapViewer instance containing the map and its APIs
   * @throws {MapViewerNotFoundError} When no map exists with the given ID
   */
  getMapViewer(mapId: string): MapViewer {
    // Get the map instance
    const map = this.#maps[mapId];

    // Validate the map viewer was found. If not throw MapViewerNotFoundError
    if (!map) throw new MapViewerNotFoundError(mapId);

    // Return it
    return map;
  }

  /**
   * Registers a new MapViewer instance in the API's collection.
   * Called internally during map creation to track the MapViewer.
   * Prevents duplicate map IDs to maintain uniqueness.
   * @param {string} mapId - The unique identifier to assign to this map
   * @param {MapViewer} mapViewer - The MapViewer instance to register
   * @returns {void}
   * @throws {MapViewerAlreadyExistsError} When a map with the given ID already exists
   */
  setMapViewer(mapId: string, mapViewer: MapViewer): void {
    // If alredy existing
    if (this.hasMapViewer(mapId)) throw new MapViewerAlreadyExistsError(mapId);

    // Set it
    this.#maps[mapId] = mapViewer;
  }

  /**
   * Asynchronously retrieves the MapViewer instance for the specified map ID.
   * Waits for the MapViewer to be available if it's still being created.
   * Useful when accessing a map immediately after creation or in initialization code.
   * @param {string} mapId - The unique identifier of the map instance to retrieve
   * @returns {Promise<MapViewer>} Promise resolving to the MapViewer instance when available
   * @throws {MapViewerNotFoundError} When no map exists with the given ID after waiting
   */
  async getMapViewerAsync(mapId: string): Promise<MapViewer> {
    // Wait for the MapViewer to be available
    await Utilities.whenThisThen(() => this.hasMapViewer(mapId));

    // Return the now available MapViewer
    return this.getMapViewer(mapId);
  }

  /**
   * Deletes a MapViewer instance and cleans up all associated resources.
   * This method:
   * - Calls the MapViewer's delete method to clean up OpenLayers resources
   * - Removes the MapViewer from the API's collection
   * - Unmounts the React component from the DOM
   * - Removes the Zustand store and event processors
   * - Optionally deletes the HTML container element
   * @param {string} mapId - The unique identifier of the map to delete
   * @param {boolean} deleteContainer - True to remove the div element from the page, false to keep it for reuse
   * @returns {Promise<void>} Promise that resolves when the map viewer is fully deleted
   */
  async deleteMapViewer(mapId: string, deleteContainer: boolean): Promise<void> {
    if (!this.hasMapViewer(mapId)) {
      logger.logWarning(`MapViewer ${mapId} couldn't be found.`);
      return;
    }

    // Get the div container
    const divContainer = document.getElementById(mapId) || undefined;

    // Delete the map
    await this.getMapViewer(mapId).delete();

    // Delete the map instance from the maps array
    delete this.#maps[mapId];

    // Unmount the map
    unmountMap(mapId, divContainer);

    // GV Now that we're unmounted, we can remove the store, best practice
    try {
      // Delete store and event processor
      removeGeoviewStore(mapId);
    } catch (error: unknown) {
      // Failed to remove the store, eat the exception and continue
      logger.logError('Failed to remove the store', error);
    }

    // If the div container was found
    if (divContainer) {
      // Remove geoview-class if we need to reuse the div
      divContainer.classList.remove('geoview-map');

      // If we have a data-config-url and a data-config attribute
      if (divContainer.getAttribute('data-config-url') && divContainer.getAttribute('data-config')) {
        // Delete the data-config property, because it'll clash with the data-config-url if we try to reload a map in the current div
        divContainer.removeAttribute('data-config');
      }

      // If deleteContainer, delete the HTML div
      if (deleteContainer) divContainer.remove();
    }
  }

  /**
   * Creates a new map in the specified div element using the provided configuration.
   * This method:
   * - Validates the target div exists
   * - Ensures no map already exists with the same ID
   * - Optionally sets the div height
   * - Initializes the MapViewer from the configuration
   * - Waits for onMapInit to complete before resolving
   * GV Note: The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
   * If present, the div will be created with a default config.
   * @param {string} divId - ID of the div element to create map in (becomes the mapId)
   * @param {string} mapConfig - Configuration as JSON string or URL path to a config file
   * @param {number} [divHeight] - Optional height in pixels for the div (mandatory if the map reloads)
   * @returns {Promise<MapViewer>} Promise resolving to the MapViewer instance after onMapInit is triggered
   * @throws {InitDivNotExistError} When the specified div element doesn't exist
   * @throws {MapViewerAlreadyExistsError} When a map already exists with the given divId
   */
  // This function is called by the template, and since the template use the instance of the object from cgpv.api, this function has to be on the instance, not static. Refactor this?
  async createMapFromConfig(divId: string, mapConfig: string, divHeight?: number): Promise<MapViewer> {
    // Get the map div
    const mapDiv = document.getElementById(divId);
    if (!mapDiv) throw new InitDivNotExistError(divId);

    // If a map was already created for the divId
    if (this.hasMapViewer(divId)) throw new MapViewerAlreadyExistsError(divId);

    // Get the height
    if (divHeight) mapDiv.style.height = `${divHeight}px`;

    // Init by function call
    const mapViewer = await initMapDivFromFunctionCall(mapDiv, mapConfig);

    // Wait for onMapInit to be triggered
    await new Promise<void>((resolve) => {
      mapViewer.onMapInit(() => resolve());
    });

    return mapViewer;
  }

  /**
   * Reloads a map by deleting and recreating it with the specified or stored configuration.
   * This method:
   * - Uses provided config or retrieves the original from the store
   * - Preserves the map height to maintain consistent dimensions
   * - Deletes the existing MapViewer (keeping the div element)
   * - Creates a new MapViewer with the configuration
   * @param {string} mapId - The unique identifier of the map to reload
   * @param {TypeMapFeaturesConfig | TypeMapFeaturesInstance} [mapConfig] - Optional configuration to use for reload; if omitted, uses the stored original config
   * @returns {Promise<MapViewer>} Promise resolving to the newly created MapViewer instance
   */
  async reload(mapId: string, mapConfig?: TypeMapFeaturesConfig | TypeMapFeaturesInstance): Promise<MapViewer> {
    // If no config is provided, get the original from the store
    const config = mapConfig || MapEventProcessor.getGeoViewMapConfig(mapId);

    // Get the map viewer
    const mapViewer = this.getMapViewer(mapId);

    // Get map height
    // GV: This is important because on reload, the mapHeight is set to 0px then reset to a bad value.
    // GV.CONT: This fix maintain the height on reload for the createMapFromConfig function. On first past the optional
    // GV.CONT: does not have to be provided because the div exist and map will take its height.
    const height = mapViewer.map.getSize() !== undefined ? mapViewer.map.getSize()![1] : 800;

    // Delete the map
    await this.deleteMapViewer(mapId, false);

    // TODO: There is still a problem with bad config schema value and layers loading... should be refactor when config is done
    return this.createMapFromConfig(mapId, JSON.stringify(config), height);
  }

  /**
   * Reloads a map using a configuration generated from the current map state.
   * Creates a snapshot of the current map state and uses it to reload the map.
   * Useful for preserving user changes (layer visibility, order, etc.) during reload.
   * @param {string} mapId - The unique identifier of the map to reload
   * @param {boolean} [maintainGeocoreLayerNames=true] - When true, preserves current geocore layer names; when false, resets to defaults (useful after language changes)
   * @returns {Promise<MapViewer>} Promise resolving to the newly created MapViewer instance
   */
  reloadWithCurrentState(mapId: string, maintainGeocoreLayerNames: boolean = true): Promise<MapViewer> {
    // Get the map viewer
    const mapViewer = this.getMapViewer(mapId);

    // Get the current map config
    const currentMapConfig = mapViewer.createMapConfigFromMapState(maintainGeocoreLayerNames);

    // Redirect
    return this.reload(mapId, currentMapConfig);
  }

  /**
   * Manages keyboard focus styling and crosshair functionality for accessibility.
   * This method:
   * - Adds 'keyboard-focused' class to elements when Tab key is used
   * - Removes the class when mouse or focus-out events occur
   * - Enables/disables map crosshair based on map focus state
   * - Supports WCAG keyboard navigation requirements
   * Code adapted from: https://github.com/MaxMaeder/keyboardFocus.js
   * @returns {void}
   * @static
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

          // Only log if map is in focus, if not... too much logging
          if (mapFocus) logger.logInfo(`Map ${mapId} focus and crosshair is enabled`, [mapFocus]);
          AppEventProcessor.setAppIsCrosshairActive(mapId, mapFocus);
        }
      }
    });

    // Remove the class when the user interacts with the page with their mouse, or when the page looses focus
    document.addEventListener('click', removeFocusedClass);
    document.addEventListener('focusout', removeFocusedClass);
  }
}
