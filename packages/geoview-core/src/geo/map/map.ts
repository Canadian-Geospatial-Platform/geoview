import { i18n } from 'i18next';
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import OLMap from 'ol/Map';
import View, { ViewOptions } from 'ol/View';
import { fromLonLat, ProjectionLike, toLonLat, transform as olTransform, transformExtent as olTransformExtent } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';

import queryString from 'query-string';

import { Basemap } from '../layer/basemap/basemap';
import { Layer } from '../layer/layer';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { Config } from '../../core/utils/config/config';

import { AppbarButtons } from '../../core/components/app-bar/app-bar-buttons';
import { NavbarButtons } from '../../core/components/nav-bar/nav-bar-buttons';
import { FooterTabsApi } from '../../core/components/footer-tabs/footer-tabs-api';
import { LegendApi } from '../../core/components/legend/legend-api';
import { DetailsAPI } from '../../core/components/details/details-api';
import { DataGridAPI } from '../../core/components/data-grid/data-grid-api';
import { GeoviewRenderer } from '../renderer/geoview-renderer';

import { ModalApi } from '../../ui';
import { mapPayload } from '../../api/events/payloads/map-payload';
import { mapComponentPayload } from '../../api/events/payloads/map-component-payload';
import { mapConfigPayload } from '../../api/events/payloads/map-config-payload';
import { GeoViewLayerPayload, payloadIsGeoViewLayerAdded } from '../../api/events/payloads/geoview-layer-payload';
import { generateId } from '../../core/utils/utilities';
import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage, TypeViewSettings } from './map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement } from '../../core/types/global-types';
import { TypeMapSingleClick } from '../../api/events/payloads/map-slingle-click-payload';
import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';
import { layerConfigIsGeoCore } from '../layer/other/geocore';

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

  // used to access button panel API to create buttons and button panels on the app-bar
  appBarButtons!: AppbarButtons;

  // used to access button panel API to create buttons and button panels on the nav-bar
  navBarButtons!: NavbarButtons;

  // used to access the footer tabs api
  footerTabs!: FooterTabsApi;

  // used to access the legend api
  legend!: LegendApi;

  // used to access the footer tabs api
  details!: DetailsAPI;

  // used to access the footer tabs api
  dataGrid!: DataGridAPI;

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

  // store last single click position
  singleClickedPosition: TypeMapSingleClick;

  // i18n instance
  i18nInstance!: i18n;

  // modals creation
  modal!: ModalApi;

  // GeoView renderer
  geoviewRenderer: GeoviewRenderer;

  // number of remaining layers that need to be loaded
  remainingLayersThatNeedToBeLoaded = 0;

  // flag used to indicate that the ready callback routine has been called once
  readyCallbackHasRun = false;

  // record of geoview layer identifier on the map and their associated layer loaded timeout identifier
  layerLoadedTimeoutId: Record<string, NodeJS.Timeout> = {};

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
    this.singleClickedPosition = { pixel: [], lnglat: [], projected: [] };

    this.appBarButtons = new AppbarButtons(this.mapId);
    this.navBarButtons = new NavbarButtons(this.mapId);
    this.footerTabs = new FooterTabsApi(this.mapId);
    this.legend = new LegendApi(this.mapId);
    this.details = new DetailsAPI(this.mapId);
    this.dataGrid = new DataGridAPI(this.mapId);

    this.modal = new ModalApi(this.mapId);

    this.geoviewRenderer = new GeoviewRenderer(this.mapId);

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(
      this.mapFeaturesConfig.map.basemapOptions,
      this.mapFeaturesConfig.displayLanguage!,
      this.mapFeaturesConfig.map.viewSettings.projection,
      this.mapId
    );

    // extract the number of layers to load and listen to added layers event to decrease the number of expected layer
    const listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig = this.mapFeaturesConfig.map.listOfGeoviewLayerConfig || [];
    this.setEventListenerAndTimeout4ThisListOfLayer(listOfGeoviewLayerConfig);
  }

  /**
   * Utility function used to decrement the remainingLayersThatNeedToBeLoaded property, preventing it to become less that zero.
   * The methode returns true when the zero value is reached for the first time.
   *
   * @returns true when the zero value is reached for the first time.
   */
  private remainingLayersThatNeedToBeLoadedIsDecrementedToZero4TheFirstTime(): boolean {
    const equalZero4TheFirstTime = this.remainingLayersThatNeedToBeLoaded === 1;
    this.remainingLayersThatNeedToBeLoaded = this.remainingLayersThatNeedToBeLoaded ? this.remainingLayersThatNeedToBeLoaded - 1 : 0;
    return equalZero4TheFirstTime;
  }

  /**
   * Set the layer added event listener and timeout function for the list of geoview layer configurations.
   *
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of geoview layer configurations.
   */
  setEventListenerAndTimeout4ThisListOfLayer(listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig) {
    this.remainingLayersThatNeedToBeLoaded += listOfGeoviewLayerConfig.length;
    if (listOfGeoviewLayerConfig.length) {
      listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
        if (!layerConfigIsGeoCore(geoviewLayerConfig)) {
          // The timeout section is used to release the waiting for a layer that can not be loaded.
          // Its execution is canceled if the layer loads before the timeout
          this.layerLoadedTimeoutId[geoviewLayerConfig.geoviewLayerId] = setTimeout(() => {
            if (this.remainingLayersThatNeedToBeLoadedIsDecrementedToZero4TheFirstTime())
              api.event.emit(GeoViewLayerPayload.createTestGeoviewLayersPayload('run cgpv.init callback?'));
            const isNotLoaded = !this.layer.geoviewLayers[geoviewLayerConfig.geoviewLayerId]?.isLoaded;
            if (isNotLoaded) {
              if (geoviewLayerConfig.geoviewLayerId in this.layer.geoviewLayers)
                this.layer.geoviewLayers[geoviewLayerConfig.geoviewLayerId].loadError = true;
              // Force the creation of an empty geoview layer with the two flags needed to signal a load error
              else (this.layer.geoviewLayers[geoviewLayerConfig.geoviewLayerId] as unknown) = { isLoaded: false, loadError: true };
              // eslint-disable-next-line no-console
              console.log(`Layer ${geoviewLayerConfig.geoviewLayerId} failed to load on map ${this.mapId}`);
              api.event.emit(
                snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
                  type: 'key',
                  value: 'validation.layer.loadfailed',
                  params: [geoviewLayerConfig.geoviewLayerId, this.mapId],
                })
              );
            }
          }, 15000);

          api.event.on(
            EVENT_NAMES.LAYER.EVENT_LAYER_ADDED,
            (payload) => {
              if (payloadIsGeoViewLayerAdded(payload)) {
                const { geoviewLayer } = payload;
                geoviewLayer!.isLoaded = true;
                if (this.remainingLayersThatNeedToBeLoadedIsDecrementedToZero4TheFirstTime()) {
                  clearTimeout(this.layerLoadedTimeoutId[geoviewLayerConfig.geoviewLayerId]);
                  api.event.emit(GeoViewLayerPayload.createTestGeoviewLayersPayload('run cgpv.init callback?'));
                }
              }
            },
            this.mapId,
            geoviewLayerConfig.geoviewLayerId
          );
        }
      });
    } else api.event.emit(GeoViewLayerPayload.createTestGeoviewLayersPayload('run cgpv.init callback?'));
  }

  /**
   * Method used to test all geoview layers ready flag to determine if a map is ready.
   *
   * @returns true if all geoview layers on the map are loaded or detected as a load error.
   */
  mapIsReady(): boolean {
    let allGeoviewLayersAreReady = this.remainingLayersThatNeedToBeLoaded === 0;
    const arrayOfGeoviewLayerId = this.layer?.geoviewLayers ? Object.keys(this.layer.geoviewLayers) : [];
    for (let i = 0; i < arrayOfGeoviewLayerId.length && allGeoviewLayersAreReady; i++) {
      const geoviewLayer = this.layer.geoviewLayers[arrayOfGeoviewLayerId[i]];
      allGeoviewLayersAreReady &&= geoviewLayer.isLoaded || geoviewLayer.loadError;
    }
    return allGeoviewLayersAreReady && this.layer !== undefined;
  }

  /**
   * Initialize layers, basemap and projection
   *
   * @param cgpMap
   */
  initMap(cgpMap: OLMap): void {
    this.mapId = cgpMap.get('mapId');
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
   * @param {string} mapComponentId an id to the new component
   * @param {JSX.Element} component the component to add
   */
  addComponent = (mapComponentId: string, component: JSX.Element): void => {
    if (mapComponentId && component) {
      // emit an event to add the component
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, this.mapId, mapComponentId, component));
    }
  };

  /**
   * Remove an existing custom component from the map
   *
   * @param imapComponentIdd the id of the component to remove
   */
  removeComponent = (mapComponentId: string): void => {
    if (mapComponentId) {
      // emit an event to add the component
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, this.mapId, mapComponentId));
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
    const layerInterval = setInterval(() => {
      if (this.remainingLayersThatNeedToBeLoaded === 0) {
        const { geoviewLayers } = this.layer;
        let allGeoviewLayerReady =
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig?.length === 0 || Object.keys(geoviewLayers).length !== 0;
        Object.keys(geoviewLayers).forEach((geoviewLayerId) => {
          allGeoviewLayerReady &&= geoviewLayers[geoviewLayerId].isLoaded || geoviewLayers[geoviewLayerId].loadError;
        });
        if (allGeoviewLayerReady) {
          api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, this.mapId, this.map));
          clearInterval(layerInterval);
        }
      }
    }, 250);
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
    const parsedMapConfig = JSON.parse(mapConfig.replace(/(\r\n|\n|\r)/gm, '').replace(/'/gm, '"'));

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
   * Fit the map to its boundaries. It is assumed that the boundaries use the map projection. If projectionCode is undefined,
   * the boundaries are used as is, otherwise they are reprojected from the specified projection code to the map projection.
   *
   * @param {Extent} bounds bounding box to zoom to
   * @param {string | number | undefined} projectionCode Optional projection code used by the bounds.
   * @returns the bounds
   */
  fitBounds = (bounds?: Extent, projectionCode: string | number | undefined = undefined) => {
    let mapBounds: Extent | undefined;
    if (bounds)
      mapBounds = projectionCode
        ? olTransformExtent(bounds, `EPSG:${projectionCode}`, api.projection.projections[this.currentProjection], 20)
        : olTransformExtent(
            bounds,
            api.projection.projections[this.currentProjection],
            api.projection.projections[this.currentProjection],
            25
          );
    else {
      Object.keys(this.layer.geoviewLayers).forEach((geoviewLayerId) => {
        if (!mapBounds)
          mapBounds = this.layer.geoviewLayers[geoviewLayerId].getBounds(this.layer.geoviewLayers[geoviewLayerId].listOfLayerEntryConfig);
        else {
          const newMapBounds = this.layer.geoviewLayers[geoviewLayerId].getBounds(
            this.layer.geoviewLayers[geoviewLayerId].listOfLayerEntryConfig
          );
          if (newMapBounds) {
            mapBounds = [
              Math.min(newMapBounds[0], mapBounds[0]),
              Math.min(newMapBounds[1], mapBounds[1]),
              Math.max(newMapBounds[2], mapBounds[2]),
              Math.max(newMapBounds[3], mapBounds[3]),
            ];
          }
        }
      });
    }

    if (mapBounds) {
      this.map.getView().fit(mapBounds, { size: this.map.getSize() });
      this.map.getView().setZoom(this.map.getView().getZoom()! - 0.15);
    }
  };

  /**
   * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
   * original).
   *
   * @param {Extent} extent The extent to transform.
   * @param {ProjectionLike} source Source projection-like.
   * @param {ProjectionLike} destination Destination projection-like.
   * @param {number} stops Optional number of stops per side used for the transform. By default only the corners are used.
   *
   * @returns The new extent transformed in the destination projection.
   */
  transformExtent = (extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number | undefined): Extent => {
    return olTransformExtent(extent, source, destination, stops);
  };

  /**
   * Transforms an extent from source projection to destination projection. This returns a new extent (and does not modify the
   * original).
   *
   * @param {Extent} extent The extent to transform.
   * @param {ProjectionLike} source Source projection-like.
   * @param {ProjectionLike} destination Destination projection-like.
   * @param {number} stops Optional number of stops per side used for the transform. The default value is 20.
   *
   * @returns The densified extent transformed in the destination projection.
   */
  transformAndDensifyExtent = (extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops = 25): Coordinate[] => {
    const coordinates = [];
    const width = extent[2] - extent[0];
    const height = extent[3] - extent[1];
    for (let i = 0; i < stops; ++i) coordinates.push([extent[0] + (width * i) / stops, extent[1]]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[2], extent[1] + (height * i) / stops]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[2] - (width * i) / stops, extent[3]]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[0], extent[3] - (height * i) / stops]);
    for (let i = 0; i < coordinates.length; i++) coordinates[i] = olTransform(coordinates[i], source, destination);
    return coordinates;
  };
}
