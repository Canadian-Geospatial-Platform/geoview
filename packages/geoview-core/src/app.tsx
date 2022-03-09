import React from "react";
import ReactDOM from "react-dom";

// Leaflet icons import to solve issues 4968
import L, { Icon, Marker } from "leaflet";
import * as ReactLeaflet from "react-leaflet";
import * as ReactLeafletCore from "@react-leaflet/core";

import { useTranslation } from "react-i18next";

// TODO: remove as soon as element UI components are created
import * as MUI from "@mui/material";

import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";

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
import { EVENT_NAMES } from "./api/event";
import { LEAFLET_POSITION_CLASSES } from "./geo/utils/constant";
import { generateId } from "./core/utils/utilities";

export * from "./core/types/cgpv-types";

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

    // remove the dom element (remove rendered map)
    ReactDOM.unmountComponentAtNode(map!);

    // delete the map instance from the maps array
    delete api.maps[payload.handlerId];

    // re-render map with updated config keeping previous values if unchanged
    ReactDOM.render(<AppStart configObj={payload.config} />, map);
  }
});

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

    ReactDOM.render(
      <AppStart configObj={configObj.configuration} />,
      mapElement
    );
  }
}

function loadMapFromUrl(configParams: string) {
  // get parameters from path. Ex: ?z=4 will get {"z": "123"}
  var id = configParams.split("?")[0];
  var data = configParams.split("?")[1];
  var obj: Record<string, any> = {};

  if (data !== undefined) {
    var params = data.split("&");

    for (var i = 0; i < params.length; i++) {
      var param = params[i].split("=");

      obj[param[0]] = param[1];
    }
  }

  // either look for a map with class llwp-map or "create new one?"
  const maps = document.getElementsByClassName("llwp-map");

  if (maps.length) {
    const map = maps[0];

    const mapId = map.getAttribute("id")!;

    // TODO validate the params with schema, use defaults from schema for not provided config

    // // validate configuration and appply default if problem occurs then setup language
    // const configObj = new Config(
    //   map.getAttribute("id")!,
    //   (map.getAttribute("data-leaflet") || "")?.replace(/'/g, '"')
    // );

    let center = obj["c"]?.split(",");

    if (!center) center = [0, 0];

    // create a config object
    const configObj = {
      zoom: parseInt(obj["z"]),
      center: [parseInt(center[0]), parseInt(center[1])],
      projection: parseInt(obj["b"]),
      language: obj["l"],
    };

    // emit an event to reload the map to change the language
    api.event.emit(EVENT_NAMES.EVENT_MAP_RELOAD, null, {
      handlerId: mapId,
      config: { ...api.map(mapId).mapProps, ...configObj },
    });

    console.log("second");
  }
}

window.onload = () => {
  console.log(location);
  loadMapFromUrl(location.search);
};

window.onhashchange = () => {
  loadMapFromUrl(location.search);
};

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
  mui: MUI,
  ui: {
    useTheme: useTheme,
    useMediaQuery: useMediaQuery,
    makeStyles: makeStyles,
    elements: UI,
  },
  useTranslation: useTranslation,
  types: types,
  constants: {
    leafletPositionClasses: LEAFLET_POSITION_CLASSES,
  },
};

// freeze variable name so a variable with same name can't be defined from outside
Object.freeze(cgpv);

// export the cgpv globally
types.Cast<types.TypeWindow>(window).cgpv = cgpv;
