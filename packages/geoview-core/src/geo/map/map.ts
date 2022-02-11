import { i18n } from "i18next";
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */
// import L from 'leaflet';

import { LatLngBounds } from "leaflet";

import queryString from "query-string";
import screenfull from "screenfull";

import { Vector } from "../layer/vector/vector";
import { Basemap } from "../layer/basemap/basemap";
import { Layer } from "../layer/layer";
import { MapProjection } from "../projection/map-projection";

import "../../core/types/cgp-leaflet-config";

import { api } from "../../api/api";
import {
  Cast,
  TypeWindow,
  TypeMapConfigProps,
} from "../../core/types/cgpv-types";

import { generateId } from "../../core/utils/utilities";

import { EVENT_NAMES } from "../../api/event";
import { AppbarButtons } from "../../core/components/appbar/app-bar-buttons";
import { NavbarButtons } from "../../core/components/navbar/nav-bar-buttons";

// LCC map options
// ! Map bounds doesn't work for projection other then Web Mercator
const lccMapOptionsParam: L.MapOptions = {
  zoomFactor: 7,
  minZoom: 3,
  maxZoom: 19,
};

// Web Mercator map options
const wmMapOptionsParam: L.MapOptions = {
  zoomFactor: 5,
  minZoom: 2,
  maxZoom: 19,
  maxBounds: new LatLngBounds(
    { lat: -89.999, lng: -180 },
    { lat: 89.999, lng: 180 }
  ),
  maxBoundsViscosity: 0.0,
};

/**
 * Class used to manage created maps
 *
 * @export
 * @class MapViewer
 */
export class MapViewer {
  // map config properties
  mapProps: TypeMapConfigProps;

  // the id of the map
  id!: string;

  // the leaflet map
  map!: L.Map;

  // used to access button panel API to create buttons and button panels on the appbar
  appBarButtons!: AppbarButtons;

  // used to access button panel API to create buttons and button panels on the navbar
  navBarButtons!: NavbarButtons;

  // used to access basemap functions
  basemap!: Basemap;

  // used to access layers functions
  layer!: Layer;

  // get used language
  language: string;

  // get used projection
  currentProjection: number;

  // access projection functions for this map instance
  projection!: MapProjection;

  // i18n instance
  i18nInstance!: i18n;

  /**
   * Add the map instance to the maps array in the api
   *
   * @param {TypeMapConfigProps} mapProps map properties
   */
  constructor(mapProps: TypeMapConfigProps, i18n: i18n) {
    this.id = mapProps.id!;

    // add map viewer instance to api
    api.maps[this.id] = this;

    this.mapProps = mapProps;

    this.language = mapProps.language;
    this.currentProjection = mapProps.projection;
    this.i18nInstance = i18n;
  }

  /**
   * Initialize layers, basemap and projection
   *
   * @param cgpMap
   */
  initMap(cgpMap: L.Map): void {
    this.id = cgpMap.id as string;
    this.map = cgpMap;

    // initialize layers and load the layers passed in from map config if any
    this.layer = new Layer(cgpMap, this.mapProps.layers);

    // initialize the projection
    this.projection = new MapProjection(this.mapProps.projection);

    this.appBarButtons = new AppbarButtons(this.id);
    this.navBarButtons = new NavbarButtons(this.id);

    // check if geometries are provided from url
    this.loadGeometries();

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(
      this.mapProps.basemapOptions,
      this.mapProps.language,
      this.mapProps.projection,
      this.id
    );
  }

  /**
   * Check if geometries needs to be loaded from a URL geoms parameter
   */
  loadGeometries(): void {
    // see if a data geometry endpoint is configured and geoms param is provided then get the param value(s)
    const servEndpoint =
      this.map
        .getContainer()
        ?.closest(".llwp-map")
        ?.getAttribute("data-geometry-endpoint") || "";
    // eslint-disable-next-line no-restricted-globals
    const parsed = queryString.parse(location.search);

    if (parsed.geoms && servEndpoint !== "") {
      const geoms = (parsed.geoms as string).split(",");

      // for the moment, only polygon are supported but if need be, other geometries can easely be use as well
      geoms.forEach((key: string) => {
        fetch(`${servEndpoint}${key}`).then((response) => {
          // only process valid response
          if (response.status === 200) {
            response.json().then((data) => {
              if (typeof data.geometry !== "undefined") {
                // reverse the array because they are x, y instead of default lat long couple y, x
                // TODO: check if we can know and set this info from outside
                data.geometry.coordinates.forEach((r: Array<Array<number>>) =>
                  r.forEach((c: Array<number>) => c.reverse())
                );

                // add the geometry
                // TODO: use the vector as GeoJSON and add properties to by queried by the details panel
                this.layer.vector.addPolygon(data.geometry.coordinates, {
                  id: generateId(""),
                });
              }
            });
          }
        });
      });
    }
  }

  addComponent = (id: string, component: JSX.Element): void => {
    if (id && component) {
      console.log(component);
      // emit an event to add the component
      api.event.emit(EVENT_NAMES.EVENT_MAP_ADD_COMPONENT, this.id, {
        id: id,
        component: component,
      });
    }
  };

  removeComponent = (id: string): void => {
    if (id) {
      // emit an event to add the component
      api.event.emit(EVENT_NAMES.EVENT_MAP_REMOVE_COMPONENT, this.id, {
        id: id,
      });
    }
  };

  getMapOptions = (epsgCode: number): L.MapOptions => {
    return epsgCode === 3978 ? lccMapOptionsParam : wmMapOptionsParam;
  };

  /**
   * Toggles fullscreen for the app.
   *
   * @memberof MapInstance
   */
  toggleFullscreen = (element: HTMLElement): void => {
    if (screenfull.isEnabled) {
      // TODO: check if needed
      // DomUtil.hasClass(mapElem, 'leaflet-pseudo-fullscreen') ? DomUtil.removeClass(mapElem, 'leaflet-pseudo-fullscreen') : DomUtil.addClass(mapElem, 'leaflet-pseudo-fullscreen');
      // DomUtil.hasClass(mapElem, 'leaflet-fullscreen-on') ? DomUtil.removeClass(mapElem, 'leaflet-fullscreen-on') : DomUtil.addClass(mapElem, 'leaflet-fullscreen-on');
      // toogle fullscreen
      screenfull.toggle(element);
    }
  };
}
