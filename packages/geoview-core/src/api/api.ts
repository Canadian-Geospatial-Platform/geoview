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

/** Class used to handle api calls (events, functions etc...). */
export class API {
  /** ConfigApi static class */
  config = ConfigApi;

  /** LayerApi static class */
  layer = LayerApi;

  /** Load plugins API */
  plugin = Plugin;

  /** Utilities object */
  utilities = {
    core: Utilities,
    geo: GeoUtilities,
    projection: Projection,
    date: DateMgt,
  };

  /** List of available maps */
  #maps: Record<string, MapViewer> = {};

  /**
   * Initiates the event and projection objects.
   */
  constructor() {
    // apply focus to element when keyboard navigation is use
    API.#manageKeyboardFocus();
  }

  /**
   * Gets the list of all map IDs currently in the collection.
   *
   * @returns Array of map IDs
   */
  getMapViewerIds(): string[] {
    return Object.keys(this.#maps);
  }

  /**
   * Returns true if a map id is already registered.
   *
   * @param mapId - The unique identifier of the map to retrieve
   * @returns True if map exist
   */
  hasMapViewer(mapId: string): boolean {
    return this.getMapViewerIds().includes(mapId);
  }

  /**
   * Gets a map viewer instance by its ID.
   *
   * @param mapId - The unique identifier of the map to retrieve
   * @returns The map viewer instance if found
   * @throws {MapViewerNotFoundError} When the map with the specified ID is not found
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
   * Sets a map viewer in maps.
   *
   * @param mapId - ID of the map
   * @param mapViewer - The viewer to be added
   */
  setMapViewer(mapId: string, mapViewer: MapViewer): void {
    // If alredy existing
    if (this.hasMapViewer(mapId)) throw new MapViewerAlreadyExistsError(mapId);

    // Set it
    this.#maps[mapId] = mapViewer;
  }

  /**
   * Asynchronously gets a map viewer instance by its ID.
   *
   * @param mapId - The unique identifier of the map to retrieve
   * @returns A promise that resolves with the map viewer instance when/if found
   * @throws {Error} When the map with the specified ID is not found
   */
  async getMapViewerAsync(mapId: string): Promise<MapViewer> {
    // Wait for the MapViewer to be available
    await Utilities.whenThisThen(() => this.hasMapViewer(mapId));

    // Return the now available MapViewer
    return this.getMapViewer(mapId);
  }

  /**
   * Deletes a map viewer instance by its ID and unmounts it from the DOM - for React.
   *
   * @param mapId - The unique identifier of the map to delete
   * @param deleteContainer - True if we want to delete div from the page
   * @returns A promise that resolves when the map viewer is deleted
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
   * Creates a new map in a given div id.
   *
   * GV The div MUST NOT have a geoview-map class or a warning will be shown when initMapDivFromFunctionCall is called.
   * If is present, the div will be created with a default config.
   *
   * @param divId - Id of the div to create map in (becomes the mapId)
   * @param mapConfig - Config passed in from the function call (string or url of a config path)
   * @param divHeight - Optional height of the div to inject the map in (mandatory if the map reloads)
   * @returns A promise that resolves with the MapViewer (after the onMapReady is triggered) which will be created from the configuration
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

    // Wait for onMapReady to be triggered
    await new Promise<void>((resolve) => {
      mapViewer.onMapReady(() => resolve());
    });

    return mapViewer;
  }

  /**
   * Reload a map from a config object stored in store, or provided. It first removes then recreates the map.
   *
   * @param mapId - The unique identifier of the map to reload
   * @param mapConfig - Optional map config to use for reload
   * @returns A promise that resolves with the MapViewer which will be created once reloaded
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
   * Reload a map from a config object created using current map state. It first removes then recreates the map.
   *
   * @param mapId - The unique identifier of the map to reload
   * @param maintainGeocoreLayerNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   *                                    Set to false after a language change to update the layer names with the new language
   * @returns A promise that resolves with the MapViewer which will be created once reloaded
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
   * Applies outline to elements when keyboard is used to navigate.
   *
   * Code from: https://github.com/MaxMaeder/keyboardFocus.js
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
