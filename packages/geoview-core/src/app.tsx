import React from 'react';
import ReactDOM from 'react-dom';

// Leaflet icons import to solve issues 4968
import L, { Icon, Marker } from 'leaflet';
import * as ReactLeaflet from 'react-leaflet';
import * as ReactLeafletCore from '@react-leaflet/core';

import { useTranslation } from 'react-i18next';

// TODO: remove as soon as element UI components are created
import * as MUI from '@mui/material';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet/dist/leaflet.css';
import './ui/style/style.css';
import './ui/style/vendor.css';
import * as UI from './ui';

import AppStart from './core/app-start';
import * as types from './core/types/cgpv-types';

import { EVENT_NAMES } from './api/event';
import { api } from './api/api';

import { LEAFLET_POSITION_CLASSES } from './geo/utils/constant';

import { Config } from './core/utils/config';

export * from './core/types/cgpv-types';

// hack for default leaflet icon: https://github.com/Leaflet/Leaflet/issues/4968
// TODO: put somewhere else
const DefaultIcon = new Icon({
  iconUrl: icon,
  iconAnchor: [13, 40],
  shadowUrl: iconShadow,
});
Marker.prototype.options.icon = DefaultIcon;

// TODO look for a better place to put this when working on issue #8

// listen to map reload event
api.event.on(EVENT_NAMES.EVENT_MAP_RELOAD, (payload) => {
  if (payload && payload.handlerId) {
    const payloadHandlerId = payload.handlerId as string;
    // unsubscribe from all events registered on this map
    api.event.offAll(payloadHandlerId);

    // unload all loaded plugins on the map
    api.plugin.removePlugins(payloadHandlerId);

    // get the map container
    const map = document.getElementById(payloadHandlerId);

    if (map) {
      // remove the dom element (remove rendered map)
      ReactDOM.unmountComponentAtNode(map);

      // delete the map instance from the maps array
      delete api.maps[payloadHandlerId];

      // re-render map with updated config keeping previous values if unchanged
      ReactDOM.render(<AppStart configObj={types.Cast<types.TypeMapConfigProps>(payload.config)} />, map);
    }
  }
});

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
async function init(callback: () => void) {
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
      ReactDOM.render(<AppStart configObj={configObj} />, mapElement);
    }
  }

  // set the API callback if a callback is provided
  if (callback) api.readyCallback = callback;
}

// cgpv object to be exported with the api for outside use
export const cgpv: types.TypeCGPV = {
  init,
  api: types.Cast<types.TypeApi>({
    ...api,
    ...api.event,
    // ...api.projection,
    ...api.plugin,
  }),
  react: React,
  leaflet: L,
  reactLeaflet: ReactLeaflet,
  reactLeafletCore: ReactLeafletCore,
  mui: MUI,
  ui: {
    useTheme,
    useMediaQuery,
    makeStyles,
    elements: UI,
  },
  useTranslation,
  types,
  constants: {
    leafletPositionClasses: LEAFLET_POSITION_CLASSES,
  },
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
