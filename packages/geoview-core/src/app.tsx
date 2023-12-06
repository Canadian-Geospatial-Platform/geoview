import React from 'react';
import { Root, createRoot } from 'react-dom/client';

import { useTranslation } from 'react-i18next';

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
    reactRoot[mapId].render(<AppStart mapFeaturesConfig={configObj} />);
  }
}

/**
 * Initialize a basic div from a function call. The div MUST not have llwp-map class.
 * If is present, the div will be created with a default config
 *
 * @param {Element} mapDiv The basic div to initialise
 * @param {string} mapConfig the new config passed in from the function call
 */
export function initMapDivFromFunctionCall(mapDiv: HTMLElement, mapConfig: string): void {
  // Create a data-config attribute and set config value
  const att = document.createAttribute('data-config');
  att.value = mapConfig;
  mapDiv.setAttributeNode(att);

  mapDiv.classList.add('llwp-map');
  renderMap(mapDiv);
}

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
// eslint-disable-next-line require-await
async function init(callback: () => void) {
  // set the API callback if a callback is provided
  if (callback) api.readyCallback = callback;

  const mapElements = document.getElementsByClassName('llwp-map');

  // loop through map elements on the page
  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;

    // eslint-disable-next-line no-await-in-loop
    await renderMap(mapElement);
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
    elements: UI,
  },
  useTranslation,
  types,
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
