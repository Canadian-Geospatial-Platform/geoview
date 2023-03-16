import React from 'react';
import ReactDOM from 'react-dom';

import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import 'ol/ol.css';
import './ui/style/style.css';
import './ui/style/vendor.css';
import * as OL from 'ol';
import * as OLInteraction from 'ol/interaction';
import * as OLGeometry from 'ol/geom';
import * as OLFormat from 'ol/format';
import * as OLStyle from 'ol/style';

import * as UI from './ui';

import AppStart from './core/app-start';
import * as types from './core/types/cgpv-types';

import { EVENT_NAMES } from './api/events/event-types';
import { API } from './api/api';

import { Config } from './core/utils/config/config';
import { payloadIsAmapFeaturesConfig } from './api/events/payloads/map-config-payload';

// The next export allow to import the cgpv-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/cgpv-types';
export const api = new API();

// TODO look for a better place to put this when working on issue #8

// listen to map reload event
api.event.on(
  EVENT_NAMES.MAP.EVENT_MAP_RELOAD,
  (payload) => {
    if (payloadIsAmapFeaturesConfig(payload)) {
      if (payload.mapFeaturesConfig && payload.mapFeaturesConfig.mapId) {
        // unsubscribe from all events registered on this map
        api.event.offAll(payload.mapFeaturesConfig.mapId);

        // unload all loaded plugins on the map
        api.plugin.removePlugins(payload.mapFeaturesConfig.mapId);

        // get the map container
        const map = document.getElementById(payload.mapFeaturesConfig.mapId);

        if (map) {
          // remove the dom element (remove rendered map)
          ReactDOM.unmountComponentAtNode(map);

          // delete the map instance from the maps array
          delete api.maps[payload.mapFeaturesConfig.mapId];

          // delete plugins that were loaded on the map
          delete api.plugin.plugins[payload.mapFeaturesConfig.mapId];

          // set plugin's loaded to false
          api.plugin.pluginsLoaded = false;

          // re-render map with updated config keeping previous values if unchanged
          ReactDOM.render(<AppStart mapFeaturesConfig={payload.mapFeaturesConfig} />, map);
        }
      }
    }
  },
  'all'
);

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
    // if config provided (either by inline, url params) validate it with schema
    // otherwise return the default config
    // eslint-disable-next-line no-await-in-loop
    const configObj = await config.initializeMapConfig();

    // if valid config was provided
    if (configObj) {
      // render the map with the config
      ReactDOM.render(<AppStart mapFeaturesConfig={configObj} />, mapElement);
    }
  }
}

// cgpv object to be exported with the api for outside use
export const cgpv: types.TypeCGPV = {
  init,
  api: types.Cast<types.TypeApi>({
    ...api,
    ...api.event,
    // ...api.projection, TODO: Is this tilll needed?
    ...api.plugin,
  }),
  react: React,
  reactDOM: ReactDOM,
  ui: {
    useTheme,
    useMediaQuery,
    makeStyles,
    elements: UI,
  },
  useTranslation,
  types,
  ol: OL,
  olStyle: OLStyle,
  olGeometry: OLGeometry,
  olFormat: OLFormat,
  olInteraction: OLInteraction,
  // ? Do we realy need the constants attribute?
  // constants: {
  //   options: {},
  // },
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
