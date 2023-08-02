import React from 'react';
import { Root, createRoot } from 'react-dom/client';

import { useTranslation } from 'react-i18next';

import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';

import 'ol/ol.css';
import './ui/style/style.css';
import './ui/style/vendor.css';

import * as UI from './ui';

import AppStart from './core/app-start';
import * as types from './core/types/cgpv-types';

import { API } from './api/api';

import { Config } from './core/utils/config/config';

// The next export allow to import the cgpv-types from 'geoview-core' from outside of the geoview-core package.
export * from './core/types/cgpv-types';
export const api = new API();

// TODO look for a better place to put this when working on issue #8

let root: Root | null = null;

// listen to map reload event
// api.event.on(
//   EVENT_NAMES.MAP.EVENT_MAP_RELOAD,
//   async (payload) => {
//     if (payloadIsAmapFeaturesConfig(payload)) {
//       if (payload.mapFeaturesConfig && payload.mapFeaturesConfig.mapId) {
//         const { mapId } = payload.mapFeaturesConfig;
//         const map = api.map(mapId);

//         // remove geoview layers from map
//         map.layer.removeAllGeoviewLayers();

//         // unload all loaded plugins on the map
//         api.plugin.removePlugins(mapId);
//         api.plugin.pluginsLoaded = false;

//         map.mapFeaturesConfig = payload.mapFeaturesConfig;
//         if (payload.mapFeaturesConfig.displayLanguage) map.displayLanguage = payload.mapFeaturesConfig.displayLanguage;

//         // reset basemaps array and reload basemap and plugins
//         map.basemap.basemaps = [];
//         map.basemap.displayLanguage = payload.mapFeaturesConfig.displayLanguage || 'en';
//         map.basemap.loadDefaultBasemaps().then((basemap) => {
//           if (basemap?.basemapId) map.basemap.setBasemap(basemap!.basemapId!);
//           api.plugin.loadPlugins();
//         });

//         // reset view
//         const { center, zoom } = map.mapFeaturesConfig.map.viewSettings;
//         const projectionConfig = api.projection.projections[map.currentProjection];
//         const projectedCoords = fromLonLat(center, projectionConfig);
//         const extent: Extent = [...projectedCoords, ...projectedCoords];
//         const options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: zoom, duration: 500 };

//         map.zoomToExtent(extent, options);

//         // load layers
//         map.layer.loadListOfGeoviewLayer(map.mapFeaturesConfig.map.listOfGeoviewLayerConfig);
//       }
//     }
//   },
//   'all'
// );

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
      root = createRoot(mapElement!);
      root.render(<AppStart mapFeaturesConfig={configObj} />);
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
  createRoot,
  ui: {
    useTheme,
    useMediaQuery,
    makeStyles,
    elements: UI,
  },
  useTranslation,
  types,
  // ? Do we realy need the constants attribute?
  // constants: {
  //   options: {},
  // },
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
