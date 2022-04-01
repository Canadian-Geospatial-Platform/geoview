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

import Ajv from 'ajv';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import 'leaflet/dist/leaflet.css';
import './ui/style/style.css';
import './ui/style/vendor.css';
import * as UI from './ui';

import AppStart from './core/app-start';
import * as types from './core/types/cgpv-types';
import { generateId } from './core/utils/utilities';

import { EVENT_NAMES } from './api/event';
import { api } from './api/api';

import { LEAFLET_POSITION_CLASSES } from './geo/utils/constant';

import schema from '../schema.json';

export * from './core/types/cgpv-types';

const defaultConfig: types.TypeMapSchemaProps = {
  map: {
    interaction: 'dynamic',
    initialView: {
      zoom: 12,
      center: [45, 75],
    },
    projection: 3978,
    basemapOptions: {
      id: 'transport',
      shaded: true,
      labeled: true,
    },
    layers: [],
  },
  theme: 'dark',
  components: ['appbar', 'navbar', 'northArrow'],
  languages: ['en-CA', 'fr-CA'],
  extraOptions: {},
};

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
    // unsubscribe from all events registered on this map
    api.event.offAll(payload.handlerId);

    // unload all loaded plugins on the map
    api.plugin.removePlugins(payload.handlerId);

    // get the map container
    const map = document.getElementById(payload.handlerId);

    if (map) {
      // remove the dom element (remove rendered map)
      ReactDOM.unmountComponentAtNode(map);

      // delete the map instance from the maps array
      delete api.maps[payload.handlerId];

      // re-render map with updated config keeping previous values if unchanged
      ReactDOM.render(<AppStart configObj={payload.config} />, map);
    }
  }
});

/**
 * Parse the search parameters passed from a url
 *
 * @param {string} configParams a search string passed from the url "?..."
 * @returns {Object} object containing the parsed params
 */
function getMapPropsFromUrlParams(configParams: string): types.TypeJSONObject {
  // get parameters from path. Ex: ?z=4 will get {"z": "123"}
  const data = configParams.split('?')[1];
  const obj: types.TypeJSONObject = {};

  if (data !== undefined) {
    const params = data.split('&');

    for (let i = 0; i < params.length; i += 1) {
      const param = params[i].split('=');
      const key = param[0];
      const value = param[1];

      obj[key] = value;
    }
  }

  return obj;
}

function parseObjectFromUrl(objStr: string): types.TypeJSONObject {
  const obj: types.TypeJSONObject = {};

  if (objStr && objStr.length) {
    // get the text in between { }
    const objStrPropRegex = /(?<=[{_.])(.*?)(?=[}_.])/g;

    const objStrProps = objStr.match(objStrPropRegex);

    if (objStrProps && objStrProps.length) {
      const objProps = objStrProps[0].split(',');

      if (objProps) {
        for (let i = 0; i < objProps.length; i += 1) {
          const prop = objProps[i].split(':');
          if (prop && prop.length) {
            const key = prop[0] as string;
            const value: string = prop[1];

            if (prop[1] === 'true') {
              obj[key] = true;
            } else if (prop[1] === 'false') {
              obj[key] = false;
            } else {
              obj[key] = value;
            }
          }
        }
      }
    }
  }

  return obj;
}

/**
 * Initialize the cgpv and render it to root element
 *
 * @param {Function} callback optional callback function to run once the rendering is ready
 */
function init(callback: () => void) {
  // apply focus to element when keyboard navigation is use
  api.geoUtilities.manageKeyboardFocus();

  // set the API callback if a callback is provided
  if (callback) api.readyCallback = callback;

  const mapElements = document.getElementsByClassName('llwp-map');

  for (let i = 0; i < mapElements.length; i += 1) {
    const mapElement = mapElements[i] as Element;

    let mapId = mapElement.getAttribute('id');

    if (!mapId) mapId = generateId();

    let language = mapElement.getAttribute('data-lang');

    if (!language) language = 'en-CA';

    if (mapId) {
      // eslint-disable-next-line no-restricted-globals
      const locationSearch = location.search;

      // check if url contains any params
      const urlParams = getMapPropsFromUrlParams(locationSearch);

      let configObj: types.TypeMapSchemaProps = { ...defaultConfig };

      if (Object.keys(urlParams).length) {
        // Ex: ?p=3978&z=12&c=45,75&l=en-CA&t=dark&b={id:transport,shaded:true,labeled:true}&i=dynamic&keys=111,222,333,123

        let center = (urlParams.c as string).split(',');
        if (!center) center = ['0', '0'];

        const basemapOptions = parseObjectFromUrl(urlParams.b as string) as types.TypeBasemapOptions;

        configObj = {
          ...configObj,
          map: {
            interaction: urlParams.i as 'static' | 'dynamic',
            initialView: {
              zoom: parseInt(urlParams.z as string, 10),
              center: [parseInt(center[0], 10), parseInt(center[1], 10)],
            },
            projection: parseInt(urlParams.p as '3978' | '3857', 10),
            basemapOptions,
          },
          languages: ['en-CA', 'fr-CA'],
          extraOptions: {},
        };

        // set language from params
        language = urlParams.l as types.TypeLocalizedLanguages;
      } else {
        let configObjStr = mapElement.getAttribute('data-config');

        if (configObjStr) {
          configObjStr = configObjStr
            .replace(/'/g, '"')
            .replace(/(?<=[A-Za-zàâçéèêëîïôûùüÿñæœ_.])"(?=[A-Za-zàâçéèêëîïôûùüÿñæœ_.])/g, "\\\\'");

          configObj = { ...configObj, ...JSON.parse(configObjStr) };
        }
      }

      // validate and use defaults for not provided fields
      const validator = new Ajv({
        strict: false,
      });

      // validate configuration and apply default if problem occurs then setup language
      const validate = validator.compile(schema);

      const valid = validate({ ...configObj });

      if (!valid && validate.errors && validate.errors.length) {
        for (let j = 0; j < validate.errors.length; j += 1) {
          const error = validate.errors[j];
          console.log(error);
          // api.event.emit(EVENT_NAMES.EVENT_SNACKBAR_OPEN, null, {
          //   message: {
          //     type: 'key',
          //     value: error.message,
          //     params: [mapId],
          //   },
          // });
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ReactDOM.render(
          <AppStart
            configObj={{
              ...configObj,
              id: mapId,
              language: language as types.TypeLocalizedLanguages,
            }}
          />,
          mapElement
        );
      }

      // if (!valid) {
      //   const errors = validator.getLastErrors();

      //   console.log(errors);
      // } else {
      //   ReactDOM.render(<AppStart configObj={configObj} />, mapElement);
      // }
    }
  }
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
