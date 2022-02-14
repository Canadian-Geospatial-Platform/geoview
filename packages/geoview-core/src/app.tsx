import React from "react";
import ReactDOM from "react-dom";

// Leaflet icons import to solve issues 4968
import L, { Icon, Marker } from "leaflet";
import * as ReactLeaflet from "react-leaflet";
import * as ReactLeafletCore from "@react-leaflet/core";

import { useTranslation } from "react-i18next";

import { useMediaQuery, IconButton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import makeStyles from '@mui/styles/makeStyles';

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

import { api } from "./api/api";

import * as UI from "./ui";

import "../node_modules/leaflet/dist/leaflet.css";
import "./ui/style/style.css";
import "./ui/style/vendor.css";

import AppStart from "./core/app-start";

import * as types from "./core/types/cgpv-types";
import { Config } from "./core/utils/config";

export * from "./core/types/cgpv-types";

// hack for default leaflet icon: https://github.com/Leaflet/Leaflet/issues/4968
// TODO: put somewhere else
const DefaultIcon = new Icon({
  iconUrl: icon,
  iconAnchor: [13, 40],
  shadowUrl: iconShadow,
});
Marker.prototype.options.icon = DefaultIcon;

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

  const mapElements = document.getElementsByClassName("llwp-map");

  for (var i = 0; i < mapElements.length; i++) {
    const mapElement = mapElements[i] as Element;

    // validate configuration and appply default if problem occurs then setup language
    const configObj = new Config(
      mapElement.getAttribute("id")!,
      (mapElement.getAttribute("data-leaflet") || "")?.replace(/'/g, '"')
    );

    ReactDOM.render(<AppStart configObj={configObj} />, mapElement);
  }
}

// cgpv object to be exported with the api for outside use
export const cgpv: types.TypeCGPV = {
  init,
  api: types.Cast<types.TypeApi>({
    ...api,
    ...api.event,
    //...api.projection,
    ...api.plugin,
  }),
  react: React,
  leaflet: L,
  reactLeaflet: ReactLeaflet,
  reactLeafletCore: ReactLeafletCore,
  ui: {
    useTheme: useTheme,
    useMediaQuery: useMediaQuery,
    makeStyles: makeStyles,
    elements: UI,
  },
  useTranslation: useTranslation,
  types: types,
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
