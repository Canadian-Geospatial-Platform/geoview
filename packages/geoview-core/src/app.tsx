import React from 'react';
import { Root, createRoot } from 'react-dom/client';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';

import * as UI from '@/ui';

import AppStart from '@/core/app-start';
import { API } from '@/api/api';
import { Cast, TypeCGPV, TypeWindow } from '@/core/types/global-types';
import { Config } from '@/core/utils/config/config';
import { useWhatChanged } from '@/core/utils/useWhatChanged';
import { MapFeaturesPayload } from '@/api/events/payloads';
import { addGeoViewStore } from '@/core/stores/stores-managers';
import { logger } from '@/core/utils/logger';

// The next export allow to import the exernal-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/external-types';

export const api = new API();

const reactRoot: Record<string, Root> = {};

/**
 * Function to unmount a map element
 *
 * @param {string} mapId the map id to unmount
 */
export function unmountMap(mapId: string) {
  // Unmount the react root
  reactRoot[mapId]?.unmount();
}

/**
 * Handles when the map reload needs to happen. The map component is linked to a specific mapId. When we modify something on the map, the
 * changes spread throughout the data structure. We therefore need to reload the entire map configuration to ensure that
 * all changes made to the map are applied.
 *
 * @param {string} mapId the map id to reload
 */
const handleReload = (payload: MapFeaturesPayload) => {
  const { mapFeaturesConfig } = payload;
  if (mapFeaturesConfig) {
    const map = api.maps[mapFeaturesConfig.mapId].remove(false);

    // recreate the map - create a new div and remove the active one
    const newRoot = document.createElement('div');
    newRoot.setAttribute('id', mapFeaturesConfig.mapId);
    newRoot.setAttribute('class', 'geoview-map');
    map!.parentNode!.insertBefore(newRoot, map);
    map.remove();

    // set plugin's loaded to false
    // TODO: need to have this flag by map not for the api
    api.plugin.pluginsLoaded = false;

    addGeoViewStore(mapFeaturesConfig!);
    // create the new root
    reactRoot[mapFeaturesConfig.mapId] = createRoot(newRoot!);

    // re-render map with original configuration
    reactRoot[mapFeaturesConfig.mapId].render(<AppStart mapFeaturesConfig={mapFeaturesConfig} />);
  }
};

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

    // Register a handle when the map reloads
    api.event.onMapRemove(mapId, handleReload);

    // Create a promise to be resolved when the MapViewer is initialized via the AppStart component
    return new Promise<void>((resolve) => {
      // TODO: Refactor #1810 - Activate <React.StrictMode> here or in app-start.tsx?
      reactRoot[mapId].render(<AppStart mapFeaturesConfig={configObj} onMapViewerInit={() => resolve()} />);
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
    // Log warning
    logger.logWarning(`Div with id ${mapDiv.id} has a class 'geoview-map' and should be initialized via a cgpv.init() call.`);
  }
}

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callbackMapInit optional callback function to run once the map rendering is ready
 * @param {Function} callbackMapLayersLoaded optional callback function to run once layers are loaded on the map
 */
async function init(callbackMapInit?: (mapId: string) => void, callbackMapLayersLoaded?: (mapId: string) => void): Promise<void> {
  const mapElements = document.getElementsByClassName('geoview-map');

  // loop through map elements on the page
  const promises = [];
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;
    if (!mapElement.classList.contains('geoview-map-func-call')) {
      // Render the map
      const promiseMapInit = renderMap(mapElement);

      // When the map init is done
      promiseMapInit.then(() => {
        // Log
        logger.logInfo('Map initialized', mapElement.getAttribute('id')!);

        // Callback about it
        callbackMapInit?.(mapElement.getAttribute('id')!);
      });

      // Push the promise in the list of all maps being rendered
      promises.push(promiseMapInit);
    }
  }

  // Wait for map renders to end and MapViewers to be initialized
  await Promise.allSettled(promises);

  // TODO: REFACTOR - Petition to never callback with 'allMaps' and rethink this.
  // TO.DOCONT: It's very dangerous for the listeners and imposes that they always be careful what the callback is about.
  // TO.DOCONT: I've even found examples of us not using it correctly in the template pages...

  // Log
  logger.logInfo('Map initialized', 'allMaps');

  // Callback all maps have been initialized
  callbackMapInit?.('allMaps');

  //
  // At this point, all api.maps[] MapViewers that needed to be instantiated were done so.
  //

  // Loop on each map viewer to register more handlers
  const mapViewersPromises = Object.values(api.maps).map((mapViewer) => {
    // Create promise for when all the layers will be loaded
    return new Promise((resolve) => {
      // If the mapviewer is already ready, resolve right away
      if (mapViewer.mapLayersLoaded) {
        resolve(mapViewer);
        return;
      }

      // Register when the map viewer will have loaded layers
      mapViewer.onMapLayersLoaded((mapViewerLoaded) => {
        // Run the callback for maps that have the triggerReadyCallback set using the mapId for the parameter value
        if (mapViewerLoaded.mapFeaturesConfig.triggerReadyCallback) {
          // Log
          logger.logInfo('Map layers loaded', mapViewerLoaded.mapId);

          // Callback for that particular map
          callbackMapLayersLoaded?.(mapViewerLoaded.mapId);
        }

        // Resolve
        resolve(mapViewerLoaded);
      });
    });
  });

  // Wait for all maps to have their layers loaded
  await Promise.allSettled(mapViewersPromises);

  // Log
  logger.logInfo('Map layers loaded', 'allMaps');

  // Callback all maps and layers have been loaded
  callbackMapLayersLoaded?.('allMaps');
}

// cgpv object to be exported with the api for outside use
export const cgpv: TypeCGPV = {
  init,
  api: Cast<API>(api),
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
Cast<TypeWindow>(window).cgpv = cgpv;
