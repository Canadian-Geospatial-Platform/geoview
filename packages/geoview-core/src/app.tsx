import React from 'react'; // This is the real React that's exported
import { Root, createRoot } from 'react-dom/client'; // This is the real React-DOM that's exported
import * as translate from 'react-i18next'; // This is the real translate that's exported

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import * as UI from '@/ui';

import AppStart from '@/core/app-start';
import { API } from '@/api/api';
import { ConfigApi } from '@/api/config/config-api';
import { createI18nInstance } from '@/core/translation/i18n';
import { MapViewerDelegate, TypeCGPV, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { Config } from '@/core/utils/config/config';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import { addGeoViewStore } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';
import { generateId, getLocalizedMessage, removeCommentsFromJSON, watchHtmlElementRemoval } from '@/core/utils/utilities';
import { InitMapWrongCallError } from '@/core/exceptions/geoview-exceptions';
import { Fetch } from '@/core/utils/fetch-helper';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { MapViewer } from '@/geo/map/map-viewer';

// The next export allow to import the exernal-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/external-types';

export const api = new API();

const reactRoots: Record<string, Root> = {};

let cgpvCallbackMapInit: MapViewerDelegate;
let cgpvCallbackMapReady: MapViewerDelegate;

/**
 * Checks if a root is mounted for a given map ID
 *
 * @param {string} mapId - The map identifier
 * @returns {boolean} True if the root exists and is mounted
 */
const isRootMounted = (mapId: string): boolean => {
  return !!reactRoots[mapId];
};

/**
 * Safely unmounts a map and cleans up its resources
 * @param {string} mapId - The map id to unmount
 * @param {HTMLElement?} mapContainer - Optional, the html element where the map was mounted
 */
export function unmountMap(mapId: string, mapContainer?: HTMLElement): void {
  if (isRootMounted(mapId)) {
    try {
      reactRoots[mapId].unmount();
      logger.logInfo(`Map ${mapId} is unmounted...`);
    } catch (error: unknown) {
      logger.logError(`Error unmounting map ${mapId}:`, error);
    } finally {
      // Remove React-specific attributes
      mapContainer?.removeAttribute('data-react-root');
      mapContainer?.removeAttribute('data-zustand-devtools');
      delete reactRoots[mapId];
    }
  }
}

/**
 * Function to get a configuration from a div element who contains attributes to read from.
 * If the div has one of the following atttributes data-config, data-config-url or data-shared,
 * it will try to get a valid configuration from the attribute content. If there is no such attributes,
 * it will return a default config. If the data-geocore is present, it will inject the layer in the
 * configuration automatically.
 *
 * @param {Element} mapElement - Div map element with attributes
 * @returns {Promise<TypeMapFeaturesConfig>} A promise that contains the configuration to use
 */
async function getMapConfig(mapElement: Element): Promise<TypeMapFeaturesConfig> {
  // get language in wich we need to have the config file (if not provided, default to English)
  const lang = mapElement.hasAttribute('data-lang') ? (mapElement.getAttribute('data-lang')! as TypeDisplayLanguage) : 'en';

  // create a new config object and apply default
  let mapConfig: MapFeatureConfig = api.config.getDefaultMapFeatureConfig();

  // check what type of config is provided (data-config, data-config-url or data-shared)
  if (mapElement.hasAttribute('data-config')) {
    // configurations from inline div is provided
    let mapConfigStr = mapElement.getAttribute('data-config');
    // Erase comments in the config file then process
    mapConfigStr = removeCommentsFromJSON(mapConfigStr!);
    mapConfig = ConfigApi.validateMapConfig(mapConfigStr);
  } else if (mapElement.hasAttribute('data-config-url')) {
    // configurations file url is provided, fetch then process
    const configUrl = mapElement.getAttribute('data-config-url');
    const configObj = await Fetch.fetchJsonAs<TypeJsonObject>(configUrl!);
    mapConfig = ConfigApi.validateMapConfig(configObj);
  } else if (mapElement.getAttribute('data-shared')) {
    // configurations from the URL parameters is provided, extract then process (replace HTLM characters , && :)
    const urlParam = new URLSearchParams(window.location.search).toString().replace(/%2C/g, ',').replace(/%3A/g, ':') || '';
    mapConfig = await api.config.getConfigFromUrl(urlParam);
    mapConfig = ConfigApi.validateMapConfig(mapConfig);
  }

  // inject 'data-geocore-keys' inside the config for later processing by the ConfigApi
  if (mapElement.hasAttribute('data-geocore-keys')) {
    const geocoreKeys = mapElement.getAttribute('data-geocore-keys')?.split(',');
    geocoreKeys?.forEach((key: string) => {
      // Create the geocore snippet as any because at this point it does not contain all the attributes for the type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const layer: any = {
        geoviewLayerType: 'geoCore',
        geoviewLayerId: key,
      };

      mapConfig.map.listOfGeoviewLayerConfig.push(layer);
    });
  }

  // add the map display language and the map id to config (extend the MapFeatureConfig)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapConfigExtend: any = mapConfig;
  const id = mapElement.getAttribute('id')!;
  mapConfigExtend.mapId = id;
  mapConfigExtend.displayLanguage = lang;

  return mapConfigExtend as unknown as TypeMapFeaturesConfig;
}

/**
 * Handles when the div containing the MapViewer disappears from the DOM, likely by a dev manipulation.
 * @param {string} mapId - The MapId of the MapViewer which had its div disappear from the DOM.
 */
function handleMapViewerDivRemoved(mapId: string): void {
  // If the MapViewer is still present
  if (api.hasMapViewer(mapId)) {
    // Delete the MapViewer to clean up, sending 'false', because the div is already gone.
    api.deleteMapViewer(mapId, false).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in deleteMapViewer in handleMapDivRemoved', error);
    });
  }
}

/**
 * Function to render the map for inline map and map create from a function call
 *
 * @param {HTMLElement} mapElement - The html element div who will contain the map
 */
async function renderMap(mapElement: HTMLElement): Promise<MapViewer> {
  // if a config is provided from either inline div, url params or json file, validate it with against the schema
  // otherwise return the default config
  const configuration = await getMapConfig(mapElement);

  // Read the map id
  const { mapId } = configuration;

  // TODO: refactor - remove this config once we get layers from the new one
  // create a new config for this map element
  const lang = mapElement.hasAttribute('data-lang') ? (mapElement.getAttribute('data-lang')! as TypeDisplayLanguage) : 'en';

  const config = new Config(lang);
  const configObj = config.initializeMapConfig(mapId, configuration.map.listOfGeoviewLayerConfig, (errorKey: string, params: string[]) => {
    // Wait for the map viewer to get loaded in the api
    api
      .getMapViewerAsync(mapId)
      .then(() => {
        // Get the message for the logger
        const message = getLocalizedMessage(lang, errorKey, params);

        // Log it
        logger.logError(`- Map ${mapId}: ${message}`);

        // Show the error using its key (which will get translated)
        api.getMapViewer(mapId).notifications.showError(errorKey, params);
      })
      .catch((error: unknown) => {
        // Log promise failed
        logger.logPromiseFailed('Promise failed in getMapViewerAsync in config.initializeMapConfig in app.renderMap', error);
      });
  });
  configuration.map.listOfGeoviewLayerConfig = configObj!;

  // Create i18n istance for the map
  const i18n = await createI18nInstance(lang);

  // render the map with the config
  reactRoots[mapId] = createRoot(mapElement);

  // add config to store
  addGeoViewStore(configuration);

  // create a new map viewer instance and add it to the api
  const mapViewer = new MapViewer(configuration, i18n);
  api.setMapViewer(mapId, mapViewer);

  // Create a promise to be resolved when the MapViewer is initialized via the AppStart component
  reactRoots[mapId].render(<AppStart mapFeaturesConfig={configuration} i18nLang={i18n} />);

  // Set up MutationObserver to watch for removal of the map div where our MapViewer is mounted
  watchHtmlElementRemoval(mapId, mapElement, handleMapViewerDivRemoved);

  // Return the map viewer
  return mapViewer;
}

/**
 * Initialize a basic div from a function call.
 * GV The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param {HTMLElement} mapDiv - The basic div to initialise
 * @param {string} mapConfig - The new config passed in from the function call
 */
export function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): Promise<MapViewer> {
  // If the div has a geoview-map class (therefore is supposed to be loaded via init())
  if (mapDiv.classList.contains('geoview-map')) throw new InitMapWrongCallError(mapDiv.id);

  // Check if it is a url for a config file or a config string
  const url = mapConfig.match('.json$') !== null;

  // Create a data-config attribute and set config value on the div
  const att = document.createAttribute(url ? 'data-config-url' : 'data-config');
  // Clean apostrophes in the config if not escaped already
  att.value = mapConfig.replaceAll(/(?<!\\)'/g, "\\'");
  mapDiv.setAttributeNode(att);

  // Set the geoview-map class on the div so that this class name is standard for all maps (either created via init or via func call)
  mapDiv.classList.add('geoview-map');

  // Add a compatibility flag on the div so that when a map is loaded via function call, it's subsequently ignored in eventual init() calls.
  // This is useful in case that a html first calls for example `cgpv.api.createMapFromConfig('LNG1', config, divHeight);` and then
  // calls `cgpv.init()` (let's say for other maps on the page), the map LNG1 isn't being initialized twice.
  // Remember that init() grabs all maps with geoview-map class and we just added that class manually above, so we need that flag.
  mapDiv.classList.add('geoview-map-func-call');

  // Render the map
  return renderMap(mapDiv);
}

/**
 * Initializes the cgpv and render it to root element
 */
function init(): void {
  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements on the page
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as HTMLElement;
    if (!mapElement.classList.contains('geoview-map-func-call')) {
      // Render the map
      const promiseMapViewer = renderMap(mapElement);

      // The callback for the map init when the promiseMapInit will resolve
      const theCallbackMapInit = cgpvCallbackMapInit;

      // The callback for the map ready when the promiseMapInit will resolve
      const theCallbackMapReady = cgpvCallbackMapReady;

      // When the map viewer is created
      promiseMapViewer
        .then((theMapViewer) => {
          // Register when the map will be init
          theMapViewer.onMapInit((mapViewer) => {
            try {
              // Log
              logger.logInfo('Map initialized', mapViewer.mapId);

              // Callback about it
              theCallbackMapInit?.(theMapViewer);
            } catch (error: unknown) {
              // Log
              logger.logError('An error happened in the initialization callback.', error);
            }
          });

          // Register when the map viewer will have a map ready
          theMapViewer.onMapReady((mapViewer) => {
            // Log
            logger.logInfo('Map ready / layers registered', mapViewer.mapId);

            // Callback for that particular map
            theCallbackMapReady?.(mapViewer);
          });
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('promiseMapViewer in init in App', error);
        });
    }
  }
}

/**
 * Registers a callback when the map has been initialized
 * @param {MapViewerDelegate} callback - The callback to be called
 */
export function onMapInit(callback: MapViewerDelegate): void {
  // Keep the callback
  cgpvCallbackMapInit = callback;
}

/**
 * Registers a callback when the map has turned ready / layers were registered
 * @param {MapViewerDelegate} callback - The callback to be called
 */
export function onMapReady(callback: MapViewerDelegate): void {
  // Keep the callback
  cgpvCallbackMapReady = callback;
}

// cgpv object to be exported with the api for outside use
export const cgpv = {
  init,
  onMapInit,
  onMapReady,
  api,
  reactUtilities: {
    react: React,
    createRoot,
  },
  translate,
  ui: {
    useTheme,
    useMediaQuery,
    useWhatChanged,
    elements: UI,
  },
  logger,
} satisfies TypeCGPV;

// Tag the React with the cgpv flag to indicate it's Geoview's
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(cgpv.reactUtilities.react as any).geoview = `this is geoview's react ${generateId()}`;

// GV For debugging purposes with integration on various websites, we're keeping an array of cgpvs for now
window.cgpvs = window.cgpvs || [];
window.cgpvs.push(cgpv);
// If more than 1, log an error
if (window.cgpvs.length > 1) logger.logError('Multiple instances of cgpv loaded. Make sure you only inject cgpv-main.js once.');

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
window.cgpv = cgpv;
