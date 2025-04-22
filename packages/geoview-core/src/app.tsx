import React from 'react';
import { Root, createRoot } from 'react-dom/client';

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
import { MapConfigLayerEntry, TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import * as UI from '@/ui';

import AppStart from '@/core/app-start';
import { API } from '@/api/api';
import { TypeCGPV, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { Config } from '@/core/utils/config/config';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import { addGeoViewStore } from '@/core/stores/stores-managers';
import i18n from '@/core/translation/i18n';
import { logger } from '@/core/utils/logger';
import { getLocalizedMessage, removeCommentsFromJSON } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

// The next export allow to import the exernal-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/external-types';

export const api = new API();

const reactRoot: Record<string, Root> = {};

let cgpvCallbackMapInit: (mapId: string) => void | undefined;
let cgpvCallbackMapReady: (mapId: string) => void | undefined;
let cgpvCallbackLayersProcessed: (mapId: string) => void | undefined;
let cgpvCallbackLayersLoaded: (mapId: string) => void | undefined;

/**
 * Checks if a root is mounted for a given map ID
 *
 * @param {string} mapId - The map identifier
 * @returns {boolean} True if the root exists and is mounted
 */
const isRootMounted = (mapId: string): boolean => {
  return !!reactRoot[mapId];
};

/**
 * Safely unmounts a map and cleans up its resources
 *
 * @param {string} mapId - The map id to unmount
 */
export function unmountMap(mapId: string, mapContainer: HTMLElement): void {
  if (isRootMounted(mapId)) {
    try {
      reactRoot[mapId].unmount();
      logger.logInfo(`Map ${mapId} is unmounted...`);
    } catch (error) {
      logger.logError(`Error unmounting map ${mapId}:`, error);
    } finally {
      // Remove React-specific attributes
      mapContainer.removeAttribute('data-react-root');
      mapContainer.removeAttribute('data-zustand-devtools');

      delete reactRoot[mapId];
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
  let mapConfig: MapFeatureConfig = api.config.getDefaultMapFeatureConfig(lang);

  // check what type of config is provided (data-config, data-config-url or data-shared)
  if (mapElement.hasAttribute('data-config')) {
    // configurations from inline div is provided
    const configData = mapElement.getAttribute('data-config');

    // Erase comments in the config file then process
    const configObjStr = removeCommentsFromJSON(configData!);
    mapConfig = await api.config.createMapConfig(configObjStr, lang);

    // TODO: refactor - remove this injection once config is done, remove the casting to unknown
    let tempStr = removeCommentsFromJSON(configData!);
    tempStr = tempStr.replace(/(?<!\\)'/gm, '"');
    tempStr = tempStr.replace(/\\'/gm, "'");
    mapConfig.map.listOfGeoviewLayerConfig = (JSON.parse(tempStr) as unknown as MapFeatureConfig).map.listOfGeoviewLayerConfig
      ? (JSON.parse(tempStr) as unknown as MapFeatureConfig).map.listOfGeoviewLayerConfig
      : [];
  } else if (mapElement.hasAttribute('data-config-url')) {
    // configurations file url is provided, fetch then process
    const configUrl = mapElement.getAttribute('data-config-url');
    const configObject = await Fetch.fetchJsonAs<string | TypeJsonObject>(configUrl!);
    mapConfig = await api.config.createMapConfig(configObject, lang);

    // TODO: refactor - remove this injection once config is done, remove the casting to unknown
    mapConfig.map.listOfGeoviewLayerConfig = (configObject as unknown as MapFeatureConfig).map.listOfGeoviewLayerConfig
      ? (configObject as unknown as MapFeatureConfig).map.listOfGeoviewLayerConfig
      : [];
  } else if (mapElement.getAttribute('data-shared')) {
    // configurations from the URL parameters is provided, extract then process (replace HTLM characters , && :)
    const urlParam = new URLSearchParams(window.location.search).toString().replace(/%2C/g, ',').replace(/%3A/g, ':') || '';
    mapConfig = await api.config.getConfigFromUrl(urlParam);
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
 * Function to render the map for inline map and map create from a function call
 *
 * @param {Element} mapElement - The html element div who will contain the map
 */
async function renderMap(mapElement: Element): Promise<void> {
  // if a config is provided from either inline div, url params or json file, validate it with against the schema
  // otherwise return the default config
  const configuration = await getMapConfig(mapElement);

  // Read the map id
  const { mapId } = configuration;

  // TODO: refactor - remove this config once we get layers from the new one
  // create a new config for this map element
  const lang = mapElement.hasAttribute('data-lang') ? (mapElement.getAttribute('data-lang')! as TypeDisplayLanguage) : 'en';

  // Set the i18n language to the language specified in the config
  await i18n.changeLanguage(lang);

  const config = new Config(lang);
  const configObj = config.initializeMapConfig(
    mapId,
    configuration!.map!.listOfGeoviewLayerConfig! as MapConfigLayerEntry[], // TODO: refactor - remove cast after
    (errorKey: string, params: string[]) => {
      // Wait for the map viewer to get loaded in the api
      api
        .getMapViewerAsync(mapId)
        .then(() => {
          // Log it
          logger.logError(`- Map ${mapId}: ${getLocalizedMessage(AppEventProcessor.getDisplayLanguage(mapId), errorKey, params)}`);

          // Show the error
          api.getMapViewer(mapId).notifications.showError(errorKey, params);
        })
        .catch((error) => {
          // Log promise failed
          logger.logPromiseFailed('Promise failed in getMapViewerAsync in config.initializeMapConfig in app.renderMap', error);
        });
    }
  );
  configuration.map.listOfGeoviewLayerConfig = configObj!;

  // render the map with the config
  reactRoot[mapId] = createRoot(mapElement!);

  // add config to store
  addGeoViewStore(configuration);

  // Create a promise to be resolved when the MapViewer is initialized via the AppStart component
  return new Promise<void>((resolve) => {
    reactRoot[mapId].render(<AppStart mapFeaturesConfig={configuration} onMapViewerInit={(): void => resolve()} />);
  });
}

/**
 * Initialize a basic div from a function call.
 * GV The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param {HTMLElement} mapDiv - The basic div to initialise
 * @param {string} mapConfig - The new config passed in from the function call
 */
export async function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): Promise<void> {
  // If the div doesn't have a geoview-map class (therefore isn't supposed to be loaded via init())
  if (!mapDiv.classList.contains('geoview-map')) {
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
    await renderMap(mapDiv);
  } else {
    // Log warning
    logger.logWarning(`Div with id ${mapDiv.id} has a class 'geoview-map' and should be initialized via a cgpv.init() call.`);
  }
}

/**
 * Initializes the cgpv and render it to root element
 *
 * @param {(mapId: string) => void} callbackMapInit optional callback function to run once the map rendering is ready
 * @param {(mapId: string) => void} callbackMapLayersLoaded optional callback function to run once layers are loaded on the map
 */
function init(callbackMapInit?: (mapId: string) => void, callbackMapLayersLoaded?: (mapId: string) => void): void {
  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements on the page
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;
    if (!mapElement.classList.contains('geoview-map-func-call')) {
      // Render the map
      const promiseMapInit = renderMap(mapElement);

      // The callback for the map init when the promiseMapInit will resolve
      const theCallbackMapInit = cgpvCallbackMapInit;

      // The callback for the map ready when the promiseMapInit will resolve
      const theCallbackMapReady = cgpvCallbackMapReady;

      // The callback for the layers processed when the promiseMapInit will resolve
      const theCallbackLayersProcessed = cgpvCallbackLayersProcessed;

      // The callback for the layers loaded when the promiseMapInit will resolve
      const theCallbackLayersLoaded = cgpvCallbackLayersLoaded;

      // When the map init is done
      promiseMapInit
        .then(() => {
          // Log
          const mapId = mapElement.getAttribute('id')!;
          logger.logInfo('Map initialized', mapId);

          // Callback about it
          theCallbackMapInit?.(mapId);
          callbackMapInit?.(mapId); // TODO: Obsolete call, remove it eventually

          // Register when the map viewer will have a map ready
          api.getMapViewer(mapId).onMapReady((mapViewer) => {
            logger.logInfo('Map ready / layers registered', mapViewer.mapId);

            // Callback for that particular map
            theCallbackMapReady?.(mapViewer.mapId);
          });

          // Register when the map viewer will have loaded layers
          api.getMapViewer(mapId).onMapLayersProcessed((mapViewer) => {
            logger.logInfo('Map layers processed', mapViewer.mapId);

            // Callback for that particular map
            theCallbackLayersProcessed?.(mapViewer.mapId);
          });

          // Register when the map viewer will have loaded layers
          api.getMapViewer(mapId).onMapLayersLoaded((mapViewer) => {
            logger.logInfo('Map layers loaded', mapViewer.mapId);

            // Callback for that particular map
            theCallbackLayersLoaded?.(mapViewer.mapId);
            callbackMapLayersLoaded?.(mapViewer.mapId); // TODO: Obsolete call, remove it eventually
          });
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('promiseMapInit in init in App', error);
        });
    }
  }
}

/**
 * Registers a callback when the map has been initialized
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export function onMapInit(callback: (mapId: string) => void): void {
  // Keep the callback
  cgpvCallbackMapInit = callback;
}

/**
 * Registers a callback when the map has turned ready / layers were registered
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export function onMapReady(callback: (mapId: string) => void): void {
  // Keep the callback
  cgpvCallbackMapReady = callback;
}

/**
 * Registers a callback when the layers have been processed
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export function onLayersProcessed(callback: (mapId: string) => void): void {
  // Keep the callback
  cgpvCallbackLayersProcessed = callback;
}

/**
 * Registers a callback when the layers have been loaded
 * @param {(mapId: string) => void} callback - The callback to be called
 */
export function onLayersLoaded(callback: (mapId: string) => void): void {
  // Keep the callback
  cgpvCallbackLayersLoaded = callback;
}

// cgpv object to be exported with the api for outside use
export const cgpv: TypeCGPV = {
  init,
  onMapInit,
  onMapReady,
  onLayersProcessed,
  onLayersLoaded,
  api,
  react: React,
  createRoot,
  ui: {
    useTheme,
    useMediaQuery,
    useWhatChanged,
    elements: UI,
  },
  logger,
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
window.cgpv = cgpv;
