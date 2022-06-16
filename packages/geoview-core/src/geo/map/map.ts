import { i18n } from 'i18next';
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import OLMap from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';

import queryString from 'query-string';

import { Basemap } from '../layer/basemap/basemap';
import { Layer } from '../layer/layer';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event';

import { Config } from '../../core/utils/config';
import {
  TypeMapConfigProps,
  TypeLayerConfig,
  TypeLanguages,
  TypeLocalizedLanguages,
  TypeMapSchemaProps,
  TypeHTMLElement,
  TypeDcoument,
  TypeMapView,
} from '../../core/types/cgpv-types';

import { AppbarButtons } from '../../core/components/appbar/app-bar-buttons';
import { NavbarButtons } from '../../core/components/navbar/nav-bar-buttons';

import { ModalApi } from '../../ui';
import { mapPayload } from '../../api/events/payloads/map-payload';
import { mapComponentPayload } from '../../api/events/payloads/map-component-payload';
import { mapConfigPayload } from '../../api/events/payloads/map-config-payload';
import { generateId } from '../../core/utils/utilities';

/**
 * Class used to manage created maps
 *
 * @exports
 * @class MapViewer
 */
export class MapViewer {
  // map config properties
  mapProps: TypeMapConfigProps;

  // the id of the map
  id!: string;

  // the openlayer map
  map!: OLMap;

  // used to access button panel API to create buttons and button panels on the appbar
  appBarButtons!: AppbarButtons;

  // used to access button panel API to create buttons and button panels on the navbar
  navBarButtons!: NavbarButtons;

  // used to access basemap functions
  basemap!: Basemap;

  // used to access layers functions
  layer!: Layer;

  // get used language
  language: TypeLocalizedLanguages;

  // get used projection
  currentProjection: number;

  // store current zoom level
  currentZoom: number;

  // store current position
  currentPosition: Coordinate;

  // i18n instance
  i18nInstance!: i18n;

  // modals creation
  modal!: ModalApi;

  /**
   * Add the map instance to the maps array in the api
   *
   * @param {TypeMapConfigProps} mapProps map properties
   * @param {i18n} i18instance language instance
   */
  constructor(mapProps: TypeMapConfigProps, i18instance: i18n) {
    this.id = mapProps.id;

    // add map viewer instance to api
    api.maps[this.id] = this;

    this.mapProps = mapProps;

    this.language = mapProps.language;
    this.currentProjection = mapProps.map.projection;
    this.i18nInstance = i18instance;
    this.currentZoom = mapProps.map.initialView.zoom;
    this.currentPosition = [mapProps.map.initialView.center[0], mapProps.map.initialView.center[1]];

    this.appBarButtons = new AppbarButtons(this.id);
    this.navBarButtons = new NavbarButtons(this.id);

    this.modal = new ModalApi(this.id);

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(this.mapProps.map.basemapOptions, this.mapProps.language, this.mapProps.map.projection, this.id);
  }

  /**
   * Initialize layers, basemap and projection
   *
   * @param cgpMap
   */
  initMap(cgpMap: OLMap): void {
    this.id = cgpMap.get('id');
    this.map = cgpMap;

    // initialize layers and load the layers passed in from map config if any
    this.layer = new Layer(this.id, this.mapProps.map.layers);

    // check if geometries are provided from url
    // this.loadGeometries();
  }

  /**
   * Check if geometries needs to be loaded from a URL geoms parameter
   */
  loadGeometries(): void {
    // see if a data geometry endpoint is configured and geoms param is provided then get the param value(s)
    const servEndpoint = this.map.getTargetElement()?.closest('.llwp-map')?.getAttribute('data-geometry-endpoint') || '';

    // eslint-disable-next-line no-restricted-globals
    const parsed = queryString.parse(location.search);

    if (parsed.geoms && servEndpoint !== '') {
      const geoms = (parsed.geoms as string).split(',');

      // for the moment, only polygon are supported but if need be, other geometries can easely be use as well
      geoms.forEach((key: string) => {
        fetch(`${servEndpoint}${key}`).then((response) => {
          // only process valid response
          if (response.status === 200) {
            response.json().then((data) => {
              if (typeof data.geometry !== 'undefined') {
                // add the geometry
                // TODO: use the vector as GeoJSON and add properties to by queried by the details panel

                // TODO
                this.layer.vector?.addPolygon(data.geometry.coordinates, undefined, generateId(null));
              }
            });
          }
        });
      });
    }
  }

  /**
   * Add a new custom component to the map
   *
   * @param {string} id an id to the new component
   * @param {JSX.Element} component the component to add
   */
  addComponent = (id: string, component: JSX.Element): void => {
    if (id && component) {
      // emit an event to add the component
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, this.id, id, component));
    }
  };

  /**
   * Remove an existing custom component from the map
   *
   * @param id the id of the component to remove
   */
  removeComponent = (id: string): void => {
    if (id) {
      // emit an event to add the component
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, this.id, id));
    }
  };

  /**
   * Toggle fullscreen / exit fullscreen function
   *
   * @param status toggle fullscreen or exit fullscreen status
   * @param {HTMLElement} element the element to toggle fullscreen on
   */
  toggleFullscreen = (status: boolean, element: TypeHTMLElement): void => {
    // enter fullscreen
    if (status) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        /* Safari */
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        /* IE11 */
        element.msRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        /* Firefox */
        element.mozRequestFullScreen();
      }
    }

    // exit fullscreen
    if (!status) {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as TypeDcoument).webkitExitFullscreen) {
        /* Safari */
        (document as TypeDcoument).webkitExitFullscreen();
      } else if ((document as TypeDcoument).msExitFullscreen) {
        /* IE11 */
        (document as TypeDcoument).msExitFullscreen();
      } else if ((document as TypeDcoument).mozCancelFullScreen) {
        /* Firefox */
        (document as TypeDcoument).mozCancelFullScreen();
      }
    }
  };

  /**
   * Update the map view
   *
   * @param {TypeMapView} mapView map view object
   */
  setView = (mapView: TypeMapView): void => {
    const projection = mapView.projection ? mapView.projection : api.projection.projections[this.currentProjection];
    this.map.setView(
      new View({
        projection,
        zoom: mapView.zoom ? mapView.zoom : this.mapProps.map.initialView.zoom,
        center: mapView.center
          ? fromLonLat([mapView.center[0], mapView.center[1]], projection)
          : fromLonLat([this.mapProps.map.initialView.center[0], this.mapProps.map.initialView.center[1]], projection),
        extent: mapView.extent,
        minZoom: mapView.minZoom,
        maxZoom: mapView.maxZoom,
      })
    );
  };

  /**
   * Function called when the map has been rendered and ready to be customized
   */
  mapReady = (): void => {
    api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, this.id, this.map));
  };

  /**
   * Return the language code from localized language
   *
   * @returns {TypeLanguages} returns the language code from localized language. Ex: en, fr
   */
  getLanguageCode = (): TypeLanguages => {
    return this.language.split('-')[0] as TypeLanguages;
  };

  /**
   * Change the language of the map
   *
   * @param {string} language the language to use (en-CA, fr-CA)
   * @param {TypeLayerConfig} layers optional new set of layers to apply (will override origional set of layers)
   */
  changeLanguage = (language: 'en-CA' | 'fr-CA', layers?: TypeLayerConfig[]): void => {
    const updatedConfig = { ...this.mapProps };

    updatedConfig.language = language;

    if (layers && layers.length > 0) {
      updatedConfig.map.layers = updatedConfig.map.layers?.concat(layers);
    }

    // emit an event to reload the map to change the language
    api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, null, updatedConfig));
  };

  /**
   * Load a new map config from a function call
   *
   * @param {TypeMapSchemaProps} mapConfig a new config passed in from the function call
   */
  loadMapConfig = (mapConfig: TypeMapSchemaProps) => {
    // create a new config for this map element
    const config = new Config(this.map.getTargetElement());

    const configObj = config.getMapConfigFromFunc(mapConfig);

    // emit an event to reload the map with the new config
    api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, this.id, configObj!));
  };

  /**
   * Set map to either dynamic or static
   *
   * @param {string} interaction map interaction
   */
  toggleMapInteraction = (interaction: string) => {
    if (interaction === 'dynamic' || !interaction) {
      this.map.getInteractions().forEach((x) => x.setActive(true));
    } else {
      this.map.getInteractions().forEach((x) => x.setActive(false));
    }
  };

  /**
   * Create bounds on map
   *
   * @param {Extent} bounds map bounds
   * @returns the bounds
   */
  fitBounds = (bounds: Extent) =>
    this.map.getView().fit(bounds, {
      size: this.map.getSize(),
    });
}
