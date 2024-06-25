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

import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import * as UI from '@/ui';

import AppStart from '@/core/app-start';
import { API } from '@/api/api';
import { TypeCGPV, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { Config } from '@/core/utils/config/config';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import { addGeoViewStore } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';
import { removeCommentsFromJSON } from '@/core/utils/utilities';

// The next export allow to import the exernal-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/external-types';

export const api = new API();

const reactRoot: Record<string, Root> = {};

/**
 * Function to unmount a map element
 *
 * @param {string} mapId - The map id to unmount
 */
export function unmountMap(mapId: string): void {
  // Unmount the react root
  reactRoot[mapId]?.unmount();
}

/**
 * Function to read the configuration specified
 *
 * @param {string} configUrl - url to fetch the config from
 * @returns configuration string
 */
async function fetchConfigFile(configUrl: string): Promise<string> {
  const response = await fetch(configUrl);
  const result = await response.json();

  return result;
}

/**
 * Function to get a configuration from a div element who contains attributes to read from.
 * If the div has one of the folllowing atttributes data-config, data-config-url or data-shared,
 * it will try to get a valide configuration from the attribute content. If there is no such attributes,
 * it will return a default config. If the data-geocore is present, it will inject the layer in the
 * consifuration automatically
 *
 * @param {Element} mapElement - Div map element with attributes
 * @returns {Promise<TypeMapFeaturesConfig>} A promise who contains the caonfiguration to use
 */
async function getMapConfig(mapElement: Element): Promise<TypeMapFeaturesConfig> {
  // get language in wich we need to have the config file (if not provided, default to English)

  // create a new config object and apply default
  const lang = mapElement.hasAttribute('data-lang') ? (mapElement.getAttribute('data-lang')! as TypeDisplayLanguage) : 'en';
  let mapConfig: MapFeatureConfig = api.configApi.getDefaultMapFeatureConfig(lang);

  // check what type of config is provided (data-config, data-config-url or data-shared)
  if (mapElement.hasAttribute('data-config')) {
    // configurations from inline div is provided
    const configData = mapElement.getAttribute('data-config');

    // Erase comments in the config file then process
    const configObjStr = removeCommentsFromJSON(configData!);
    mapConfig = await api.configApi.createMapConfig(configObjStr, lang);

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
    const configObject = await fetchConfigFile(configUrl!);
    mapConfig = await api.configApi.createMapConfig(configObject, lang);

    // TODO: refactor - remove this injection once config is done, remove the casting to unknown
    mapConfig.map.listOfGeoviewLayerConfig = (configObject as unknown as MapFeatureConfig).map.listOfGeoviewLayerConfig
      ? (configObject as unknown as MapFeatureConfig).map.listOfGeoviewLayerConfig
      : [];
  } else if (mapElement.getAttribute('data-shared')) {
    // configurations from the URL parameters is provided, extract then process (replace HTLM characters , && :)
    const urlParam = new URLSearchParams(window.location.search).toString().replace(/%2C/g, ',').replace(/%3A/g, ':') || '';
    mapConfig = await api.configApi.getConfigFromUrl(urlParam);
  }

  // TODO: inject 'data-geocore-keys' inside the config for later processing by the configAPI
  // TO.DOCONT: This injectioon can be done in api.configApi.getMapConfig with optional parameter keys
  // TO.DOCONT: This will return the listOfGeoviewLAyer with a new entry: {'geoviewLayerType': 'geoCore','geoviewLayerId': '21b821cf-0f1c-40ee-8925-eab12d357668'},

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

  // TODO: refactor - remove this config once we get layers from the new one
  // create a new config for this map element
  const config = new Config();
  const configObj = config.initializeMapConfig(configuration.mapId, configuration!.map!.listOfGeoviewLayerConfig!);
  configuration.map.listOfGeoviewLayerConfig = configObj!;

  // if valid config was provided - mapId is now part of config
  if (configuration) {
    const { mapId } = configuration;

    // add config to store
    addGeoViewStore(configuration);

    // render the map with the config
    reactRoot[mapId] = createRoot(mapElement!);

    // Create a promise to be resolved when the MapViewer is initialized via the AppStart component
    return new Promise<void>((resolve) => {
      // TODO: Refactor #1810 - Activate <React.StrictMode> here or in app-start.tsx?
      reactRoot[mapId].render(<AppStart mapFeaturesConfig={configuration} onMapViewerInit={(): void => resolve()} />);
      // reactRoot[mapId].render(
      //   <React.StrictMode>
      //     <AppStart mapFeaturesConfig={configObj} />
      //   </React.StrictMode>
      // );
    });
  }

  // Failed
  return Promise.reject(new Error('Failed to render the map'));
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
    att.value = mapConfig;
    mapDiv.setAttributeNode(att);

    // Set the geoview-map class on the div so that this class name is standard for all maps (either created via init or via func call)
    mapDiv.classList.add('geoview-map');

    // Add a compatibility flag on the div so that when a map is loaded via function call, it's subsequently ignored in eventual init() calls.
    // This is useful in case that a html first calls for example `cgpv.api.createMapFromConfig('LNG1', config);` and then
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
 * Initialize the cgpv and render it to root element
 *
 * @param {(mapId: string) => void} callbackMapInit optional callback function to run once the map rendering is ready
 * @param {(mapId: string) => void} callbackMapLayersLoaded optional callback function to run once layers are loaded on the map
 * @returns {Promise<void>}
 */
function init(callbackMapInit?: (mapId: string) => void, callbackMapLayersLoaded?: (mapId: string) => void): void {
  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements on the page
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;
    if (!mapElement.classList.contains('geoview-map-func-call')) {
      // Render the map
      const promiseMapInit = renderMap(mapElement);

      // When the map init is done
      promiseMapInit
        .then(() => {
          // Log
          logger.logInfo('Map initialized', mapElement.getAttribute('id')!);

          // Callback about it
          const mapId = mapElement.getAttribute('id')!;
          callbackMapInit?.(mapId);

          // Register when the map viewer will have loaded layers
          api.maps[mapId].onMapLayersLoaded((mapViewerLoaded) => {
            logger.logInfo('Map layers loaded', mapViewerLoaded.mapId);

            // Callback for that particular map
            callbackMapLayersLoaded?.(mapViewerLoaded.mapId);
          });
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('promiseMapInit in init in App', error);
        });
    }
  }
}

// cgpv object to be exported with the api for outside use
export const cgpv: TypeCGPV = {
  init,
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
