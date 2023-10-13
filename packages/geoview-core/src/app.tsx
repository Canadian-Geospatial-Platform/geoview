import React from 'react';
import { Root, createRoot } from 'react-dom/client';

import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import 'ol/ol.css';
import '@/ui/style/style.css';
import '@/ui/style/vendor.css';

import * as UI from '@/ui';

import AppStart from '@/core/app-start';
import * as types from '@/core/types/cgpv-types';

import { EVENT_NAMES } from '@/api/events/event-types';
import { API } from '@/api/api';

import { getValidConfigFromString } from '@/core/utils/utilities';
import { Config } from '@/core/utils/config/config';
import { payloadIsAmapFeaturesConfig } from '@/api/events/payloads';
import { addGeoViewStore } from '@/core/stores/stores-managers';
import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';

// The next export allow to import the cgpv-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/cgpv-types';
export const api = new API();

const reactRoot: Record<string, Root> = {};

/*
 * Listen for map reload events. The map component is linked to a specific mapId. When we modify something on the map, the
 * changes spread throughout the data structure. We therefore need to reload the entire map configuration to ensure that
 * all changes made to the map are applied.
 */
export function addReloadListener(mapId: string) {
  const reloadHandler = (payload: types.PayloadBaseClass) => {
    if (payloadIsAmapFeaturesConfig(payload)) {
      const { mapFeaturesConfig } = payload;
      if (mapFeaturesConfig) {
        if (api.maps[mapId]?.layer) api.maps[mapId].layer.removeAllGeoviewLayers();
        // unsubscribe from all remaining events registered on this map
        api.event.offAll(mapId);
        LegendsLayerSet.delete(mapId);
        FeatureInfoLayerSet.delete(mapId);

        // unload all loaded plugins on the map
        api.plugin.removePlugins(mapId);

        // get the map container
        const map = document.getElementById(mapId);

        if (map) {
          // remove the dom element (remove rendered map)
          if (reactRoot[mapId] !== null) reactRoot[mapId].unmount();

          // recreate the map - crate e new div and remove the active one
          const newDiv = document.createElement('div');
          newDiv.setAttribute('id', mapId);
          newDiv.setAttribute('class', 'llwp-map');
          map!.parentNode!.insertBefore(newDiv, map);
          map.remove();

          // create the new root
          const newRoot = document.getElementById(mapId);
          reactRoot[mapId] = createRoot(newRoot!);

          // delete the map instance from the maps array
          delete api.maps[mapId];

          // delete plugins that were loaded on the map
          delete api.plugin.plugins[mapId];

          // set plugin's loaded to false
          api.plugin.pluginsLoaded = false;

          addReloadListener(mapId);
          // re-render map with updated config keeping previous values if unchanged
          reactRoot[mapId].render(<AppStart mapFeaturesConfig={mapFeaturesConfig} />);
        }
      }
    }
  };
  api.event.on(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, reloadHandler, `${mapId}/delete_old_map`);
}

/**
 * Initialize the map div from a function call
 *
 * @param {Element} mapDiv The ma div to initialise
 * @param {string} mapConfig a new config passed in from the function call
 */
export async function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string) {
  mapDiv.classList.add('llwp-map');
  // render the map with the config
  reactRoot[mapDiv.id] = createRoot(mapDiv!);
  const configObj = getValidConfigFromString(mapConfig, mapDiv);
  addGeoViewStore(configObj);
  addReloadListener(mapDiv.id);
  reactRoot[mapDiv.id].render(<AppStart mapFeaturesConfig={configObj} />);
}

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
async function init(callback: () => void) {
  // set the API callback if a callback is provided
  if (callback) api.readyCallback = callback;

  // apply focus to element when keyboard navigation is use
  api.geoUtilities.manageKeyboardFocus();

  const mapElements = document.getElementsByClassName('llwp-map');

  // loop through map elements on the page
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;

    // create a new config for this map element
    const config = new Config(mapElement);

    // initialize config
    // if a config is provided from either inline div, url params or json file, validate it with against the schema
    // otherwise return the default config
    // eslint-disable-next-line no-await-in-loop
    const configObj = await config.initializeMapConfig();

    // if valid config was provided
    if (configObj) {
      addGeoViewStore(configObj);
      // render the map with the config
      reactRoot[configObj.mapId] = createRoot(mapElement!);
      addReloadListener(configObj.mapId);
      reactRoot[configObj.mapId].render(<AppStart mapFeaturesConfig={configObj} />);
    }
  }
}

// cgpv object to be exported with the api for outside use
export const cgpv: types.TypeCGPV = {
  init,
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
    makeStyles,
    elements: UI,
  },
  useTranslation,
  types,
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
