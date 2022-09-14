import { i18n } from 'i18next';
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import OLMap from 'ol/Map';
import View, { ViewOptions } from 'ol/View';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';

import queryString from 'query-string';

import { Basemap } from '../layer/basemap/basemap';
import { Layer } from '../layer/layer';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { Config } from '../../core/utils/config/config';

import { AppbarButtons } from '../../core/components/appbar/app-bar-buttons';
import { NavbarButtons } from '../../core/components/navbar/nav-bar-buttons';
import { FooterTabsApi } from '../../core/components/footer-tabs/footer-tabs-api';
import { GeoviewRenderer } from '../renderer/geoview-renderer';

import { ModalApi } from '../../ui';
import { mapPayload } from '../../api/events/payloads/map-payload';
import { mapComponentPayload } from '../../api/events/payloads/map-component-payload';
import { mapConfigPayload } from '../../api/events/payloads/map-config-payload';
import { generateId } from '../../core/utils/utilities';
import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage, TypeViewSettings } from './map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement } from '../../core/types/global-types';

interface TypeDcoument extends Document {
  webkitExitFullscreen: () => void;
  msExitFullscreen: () => void;
  mozCancelFullScreen: () => void;
}

/**
 * Class used to manage created maps
 *
 * @exports
 * @class MapViewer
 */
export class MapViewer {
  // map config properties
  mapFeaturesConfig: TypeMapFeaturesConfig;

  // the id of the map
  mapId!: string;

  // the openlayer map
  map!: OLMap;

  // used to access button panel API to create buttons and button panels on the appbar
  appBarButtons!: AppbarButtons;

  // used to access button panel API to create buttons and button panels on the navbar
  navBarButtons!: NavbarButtons;

  // used to access the footer tabs api
  footerTabs!: FooterTabsApi;

  // used to access basemap functions
  basemap!: Basemap;

  // used to access layers functions
  layer!: Layer;

  // get used language
  displayLanguage: TypeDisplayLanguage;

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

  // GeoView renderer
  geoviewRenderer: GeoviewRenderer;

  /**
   * Add the map instance to the maps array in the api
   *
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
   * @param {i18n} i18instance language instance
   */
  constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n) {
    this.mapId = mapFeaturesConfig.mapId!;

    // add map viewer instance to api
    api.maps[this.mapId] = this;

    this.mapFeaturesConfig = mapFeaturesConfig;

    this.displayLanguage = mapFeaturesConfig.displayLanguage!;
    this.currentProjection = mapFeaturesConfig.map.viewSettings.projection;
    this.i18nInstance = i18instance;
    this.currentZoom = mapFeaturesConfig.map.viewSettings.zoom;
    this.currentPosition = [mapFeaturesConfig.map.viewSettings.center[0], mapFeaturesConfig.map.viewSettings.center[1]];

    this.appBarButtons = new AppbarButtons(this.mapId);
    this.navBarButtons = new NavbarButtons(this.mapId);
    this.footerTabs = new FooterTabsApi(this.mapId);

    this.modal = new ModalApi(this.mapId);

    this.geoviewRenderer = new GeoviewRenderer(this.mapId);

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(
      this.mapFeaturesConfig.map.basemapOptions,
      this.mapFeaturesConfig.displayLanguage!,
      this.mapFeaturesConfig.map.viewSettings.projection,
      this.mapId
    );
  }

  /**
   * Initialize layers, basemap and projection
   *
   * @param cgpMap
   */
  initMap(cgpMap: OLMap): void {
    this.mapId = cgpMap.get('id');
    this.map = cgpMap;

    // initialize layers and load the layers passed in from map config if any
    this.layer = new Layer(this.mapId, this.mapFeaturesConfig.map.listOfGeoviewLayerConfig);

    // check if geometries are provided from url
    this.loadGeometries();
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
              if (data.geometry !== undefined) {
                // add the geometry
                // TODO: use the vector as GeoJSON and add properties to by queried by the details panel
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
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, this.mapId, id, component));
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
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, this.mapId, id));
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
   * Update the map viewSettings
   *
   * @param {TypeMapView} mapView map viewSettings object
   */
  setView = (mapView: TypeViewSettings): void => {
    const currentView = this.map.getView();
    const viewOptions: ViewOptions = {};
    viewOptions.projection = mapView.projection ? `EPSG:${mapView.projection}` : currentView.getProjection();
    viewOptions.zoom = mapView.zoom ? mapView.zoom : currentView.getZoom();
    viewOptions.center = mapView.center
      ? fromLonLat([mapView.center[0], mapView.center[1]], viewOptions.projection)
      : fromLonLat(toLonLat(currentView.getCenter()!, currentView.getProjection()), viewOptions.projection);
    viewOptions.minZoom = mapView.minZoom ? mapView.minZoom : currentView.getMinZoom();
    viewOptions.maxZoom = mapView.maxZoom ? mapView.maxZoom : currentView.getMaxZoom();
    if (mapView.extent) viewOptions.extent = mapView.extent;

    this.map.setView(new View(viewOptions));
  };

  /**
   * Get the map viewSettings
   *
   * @returns the map viewSettings
   */
  getView = (): View => {
    return this.map.getView();
  };

  /**
   * Function called when the map has been rendered and ready to be customized
   */
  mapReady = (): void => {
    api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, this.mapId, this.map));
  };

  /**
   * Return the language code prefix from localized language
   *
   * @returns {TypeDisplayLanguage} returns the language code prefix from localized language. Ex: en, fr
   */
  getLanguageCodePrefix = (): TypeDisplayLanguage => {
    return this.displayLanguage.split('-')[0] as TypeDisplayLanguage;
  };

  /**
   * Change the display language of the map
   *
   * @param {TypeDisplayLanguage} displayLanguage the language to use (en, fr)
   * @param {TypeListOfGeoviewLayerConfig} geoviewLayerConfi optional new set of layers to apply (will override origional set of layers)
   */
  changeLanguage = (displayLanguage: TypeDisplayLanguage, listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig): void => {
    const updatedMapConfig: TypeMapFeaturesConfig = { ...this.mapFeaturesConfig };

    updatedMapConfig.displayLanguage = displayLanguage;

    if (listOfGeoviewLayerConfig && listOfGeoviewLayerConfig.length > 0) {
      updatedMapConfig.map.listOfGeoviewLayerConfig = updatedMapConfig.map.listOfGeoviewLayerConfig?.concat(listOfGeoviewLayerConfig);
    }

    // emit an event to reload the map to change the language
    api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, null, updatedMapConfig));
  };

  /**
   * Load a new map config from a function call
   *
   * @param {string} mapConfig a new config passed in from the function call
   */
  loadMapConfig = (mapConfig: string) => {
    // parse the config
    const parsedMapConfig = JSON.parse(mapConfig.replace(/(\r\n|\n|\r)/gm, "").replace(/'/gm, '"'));

    // create a new config for this map element
    const config = new Config(this.map.getTargetElement());

    const configObj = config.getMapConfigFromFunc(parsedMapConfig);

    // emit an event to reload the map with the new config
    api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, 'all', configObj!));
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
    this.map.getView().fit(transformExtent(bounds, 'EPSG:4326', api.projection.projections[this.currentProjection]), {
      size: this.map.getSize(),
    });
}
