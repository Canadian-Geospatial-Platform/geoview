import React from 'react';
import { Root, createRoot } from 'react-dom/client';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';

import * as UI from '@/ui';

import AppStart from '@/core/app-start';
import * as types from '@/core/types/cgpv-types';

import { EVENT_NAMES } from '@/api/events/event-types';
import { API } from '@/api/api';

import { Config } from '@/core/utils/config/config';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import { payloadIsAmapFeaturesConfig } from '@/api/events/payloads';
import { addGeoViewStore } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';

// The next export allow to import the cgpv-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/cgpv-types';
export const api = new API();

const reactRoot: Record<string, Root> = {};

/**
 * Function to unmount a map element
 *
 * @param {string} mapId the map id to unmount
 */
export function unmountMap(mapId: string) {
  if (reactRoot[mapId] !== null) reactRoot[mapId].unmount();
}

/**
 * Listen for map reload events. The map component is linked to a specific mapId. When we modify something on the map, the
 * changes spread throughout the data structure. We therefore need to reload the entire map configuration to ensure that
 * all changes made to the map are applied.
 *
 * @param {string} mapId the map id to reload
 */
export function addReloadListener(mapId: string) {
  const reloadHandler = (payload: types.PayloadBaseClass) => {
    // Log
    logger.logTraceCoreAPIEvent('APP - reloadHandler', payload);

    if (payloadIsAmapFeaturesConfig(payload)) {
      const { mapFeaturesConfig } = payload;
      if (mapFeaturesConfig) {
        const map = api.maps[mapId].remove(false);

        // recreate the map - create a new div and remove the active one
        const newRoot = document.createElement('div');
        newRoot.setAttribute('id', mapId);
        newRoot.setAttribute('class', 'geoview-map');
        map!.parentNode!.insertBefore(newRoot, map);
        map.remove();

        // set plugin's loaded to false
        // TODO: need to have this flag by map not for the api
        api.plugin.pluginsLoaded = false;

        addGeoViewStore(mapFeaturesConfig!);
        // create the new root
        reactRoot[mapId] = createRoot(newRoot!);
        addReloadListener(mapId);

        // re-render map with original configuration
        reactRoot[mapId].render(<AppStart mapFeaturesConfig={mapFeaturesConfig} />);
      }
    }
  };
  api.event.on(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, reloadHandler, `${mapId}/delete_old_map`);
}

/**
 * Function to render the map for inline map and map create from a function call
 *
 * @param mapElement {Element} The htlm element div who will contain the map
 */
async function renderMap(mapElement: Element): Promise<void> {
  // create a new config for this map element
  const config = new Config(mapElement);

  // initialize config
  // if a config is provided from either inline div, url params or json file, validate it with against the schema
  // otherwise return the default config
  const configObj = await config.initializeMapConfig();

  // if valid config was provided - mapId is now part of config
  if (configObj) {
    const { mapId } = configObj;
    addGeoViewStore(configObj);

    // render the map with the config
    reactRoot[mapId] = createRoot(mapElement!);
    addReloadListener(mapId);

    // TODO: Refactor #1810 - Activate <React.StrictMode> here or in app-start.tsx?
    reactRoot[mapId].render(<AppStart mapFeaturesConfig={configObj} />);
    // reactRoot[mapId].render(
    //   <React.StrictMode>
    //     <AppStart mapFeaturesConfig={configObj} />
    //   </React.StrictMode>
    // );
  }
}

/**
 * Initialize a basic div from a function call.
 * !The div MUST NOT have a geoview-map class or a warning will be shown.
 * If is present, the div will be created with a default config
 *
 * @param {Element} mapDiv The basic div to initialise
 * @param {string} mapConfig the new config passed in from the function call
 */
export async function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): Promise<void> {
  // If the div doesn't have a geoview-map class (therefore isn't supposed to be loaded via init())
  if (!mapDiv.classList.contains('geoview-map')) {
    // Create a data-config attribute and set config value on the div
    const att = document.createAttribute('data-config');
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
    logger.logWarning(`Div with id ${mapDiv.id} has a class 'geoview-map' and should be initialized via a cgpv.init() call.`);
  }
}

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
async function init(callback: () => void): Promise<void> {
  // set the API callback if a callback is provided
  if (callback) api.readyCallback = callback;

  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements on the page
  const promises = [];
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;
    if (!mapElement.classList.contains('geoview-map-func-call')) promises.push(renderMap(mapElement));
  }

  // Wait for map renders to end. Note: the api.readyCallback isn't quite done yet; that's different.
  await Promise.allSettled(promises);
}

// cgpv object to be exported with the api for outside use
export const cgpv: types.TypeCGPV = {
  init,
  // TODO: Refactor - See if we can get rid of spreading the event and plugin inside the 'api' which causes leaking/duplication..
  // TO.DOCONT: Why did we want it to be spreading? This causes duplications in the form of cgpv.api.event.emitXXX and cgpv.api.emitXXX?
  api: types.Cast<API>({
    ...api,
    ...api.event,
    ...api.plugin,
  }),
  react: React,
  createRoot,
  ui: {
    useTheme,
    useMediaQuery,
    useWhatChanged,
    elements: UI,
  },
  logger,
  types,
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
