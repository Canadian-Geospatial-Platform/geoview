import { i18n } from 'i18next';
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import OLMap from 'ol/Map';
import View, { FitOptions, ViewOptions } from 'ol/View';
import { fromLonLat, ProjectionLike, toLonLat, transform as olTransform, transformExtent as olTransformExtent } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';

import queryString from 'query-string';

import { Basemap } from '@/geo/layer/basemap/basemap';
import { Layer } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';

import { TypeClickMarker, api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { AppbarButtons } from '@/core/components/app-bar/app-bar-buttons';
import { NavbarButtons } from '@/core/components/nav-bar/nav-bar-buttons';
import { FooterTabsApi } from '@/core/components/footer-tabs/footer-tabs-api';
import { LegendApi } from '@/core/components/legend/legend-api';
import { Legend2Api } from '@/core/components/legend-2/legend-api';
import { LayersApi } from '@/core/components/layers/layers-api';
import { DetailsApi } from '@/core/components/details/details-api';
import { DataTableApi } from '@/core/components/data-table/data-table-api';
import { GeoviewRenderer } from '@/geo/renderer/geoview-renderer';
import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';

import { ModalApi } from '@/ui';
import {
  mapComponentPayload,
  mapConfigPayload,
  GeoViewLayerPayload,
  payloadIsGeoViewLayerAdded,
  TypeMapMouseInfo,
} from '@/api/events/payloads';
import { generateId, getValidConfigFromString } from '@/core/utils/utilities';
import { TypeListOfGeoviewLayerConfig, TypeDisplayLanguage, TypeViewSettings } from '@/geo/map/map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement } from '@/core/types/global-types';
import { layerConfigIsGeoCore } from '@/geo/layer/other/geocore';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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
  // Function create-map-from-config has run
  createMapConfigHasRun = false;

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

  legend2!: Legend2Api;

  // used to access the layers
  layers!: LayersApi;

  // used to access the details
  details!: DetailsApi;

  // used to access the data table api
  dataTable!: DataTableApi;

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

  // store current map center coordinate
  mapCenterCoordinates: Coordinate;

  // store last single click position
  singleClickedPosition: TypeMapMouseInfo;

  // store live pointer position
  pointerPosition: TypeMapMouseInfo;

  // i18n instance
  i18nInstance!: i18n;

  // modals creation
  modal!: ModalApi;

  // GeoView renderer
  geoviewRenderer: GeoviewRenderer;

  // flag used to indicate that the ready callback routine has been called once
  readyCallbackHasRun = false;

  /**
   * Add the map instance to the maps array in the api
   *
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
   * @param {i18n} i18instance language instance
   */
  constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n) {
    this.mapId = mapFeaturesConfig.mapId;
    this.mapFeaturesConfig = mapFeaturesConfig;
    this.displayLanguage = mapFeaturesConfig.displayLanguage!;
    this.currentProjection = mapFeaturesConfig.map.viewSettings.projection;
    this.i18nInstance = i18instance;
    this.currentZoom = mapFeaturesConfig.map.viewSettings.zoom;
    this.mapCenterCoordinates = [0, 0]; // [mapFeaturesConfig.map.viewSettings.center[0], mapFeaturesConfig.map.viewSettings.center[1]];
    this.singleClickedPosition = { pixel: [], lnglat: [], projected: [], dragging: false };
    this.pointerPosition = { pixel: [], lnglat: [], projected: [], dragging: false };

    this.appBarButtons = new AppbarButtons(this.mapId);
    this.navBarButtons = new NavbarButtons(this.mapId);
    this.footerTabs = new FooterTabsApi(this.mapId);
    this.legend = new LegendApi(this.mapId);
    this.legend2 = new Legend2Api(this.mapId);
    this.layers = new LayersApi();
    this.details = new DetailsApi(this.mapId);
    this.dataTable = new DataTableApi(this.mapId);

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
    this.setLayerAddedListener4ThisListOfLayer(listOfGeoviewLayerConfig);
  }

  /**
   * Set the layer added event listener and timeout function for the list of geoview layer configurations.
   *
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of geoview layer configurations.
   */
  setLayerAddedListener4ThisListOfLayer(listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig) {
    if (listOfGeoviewLayerConfig.length) {
      listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
        if (!layerConfigIsGeoCore(geoviewLayerConfig)) {
          api.event.on(
            EVENT_NAMES.LAYER.EVENT_LAYER_ADDED,
            (payload) => {
              if (payloadIsGeoViewLayerAdded(payload)) {
                const { geoviewLayer } = payload;
                geoviewLayer.layerOrder = this.layer.orderSubLayers(geoviewLayer.listOfLayerEntryConfig);
                this.layer.setLayerZIndices(geoviewLayer);
                if (geoviewLayer.allLayerEntryConfigProcessed()) {
                  api.event.emit(GeoViewLayerPayload.createTestGeoviewLayersPayload('run cgpv.init callback?'));
                }
              }
            },
            `${this.mapId}/${geoviewLayerConfig.geoviewLayerId}`
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
    if (this.layer === undefined) return false;
    return !Object.keys(this.layer.geoviewLayers).find((geoviewLayerId) => {
      return !this.layer.geoviewLayers[geoviewLayerId].allLayerEntryConfigProcessed();
    });
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
    this.layer = new Layer(this.mapId);
    this.layer.loadListOfGeoviewLayer(this.mapFeaturesConfig.map.listOfGeoviewLayerConfig);

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
                // TODO: use the geometry as GeoJSON and add properties to by queried by the details panel
                this.layer.geometry?.addPolygon(data.geometry.coordinates, undefined, generateId(null));
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
  addComponent(mapComponentId: string, component: JSX.Element): void {
    if (mapComponentId && component) {
      // emit an event to add the component
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_ADD_COMPONENT, this.mapId, mapComponentId, component));
    }
  }

  /**
   * Remove an existing custom component from the map
   *
   * @param imapComponentIdd the id of the component to remove
   */
  removeComponent(mapComponentId: string): void {
    if (mapComponentId) {
      // emit an event to add the component
      api.event.emit(mapComponentPayload(EVENT_NAMES.MAP.EVENT_MAP_REMOVE_COMPONENT, this.mapId, mapComponentId));
    }
  }

  /**
   * Toggle fullscreen / exit fullscreen function
   *
   * @param status toggle fullscreen or exit fullscreen status
   * @param {HTMLElement} element the element to toggle fullscreen on
   */
  toggleFullscreen(status: boolean, element: TypeHTMLElement): void {
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
  }

  /**
   * Update the map viewSettings
   *
   * @param {TypeMapView} mapView map viewSettings object
   */
  setView(mapView: TypeViewSettings): void {
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
  }

  /**
   * Get the map viewSettings
   *
   * @returns the map viewSettings
   */
  getView(): View {
    return this.map.getView();
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {Extent} extent The extent to zoom to.
   * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   */
  zoomToExtent(extent: Extent, options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: 11, duration: 1000 }) {
    this.map.getView().fit(extent, options);
  }

  /**
   * Function called when the map has been rendered and ready to be customized
   */
  mapReady(): void {
    const layerInterval = setInterval(() => {
      if (this.layer?.geoviewLayers) {
        const { geoviewLayers } = this.layer;
        let allGeoviewLayerReady =
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig?.length === 0 || Object.keys(geoviewLayers).length !== 0;
        Object.keys(geoviewLayers).forEach((geoviewLayerId) => {
          allGeoviewLayerReady &&= geoviewLayers[geoviewLayerId].allLayerEntryConfigProcessed();
        });
        if (allGeoviewLayerReady) {
          MapEventProcessor.setMapLoaded(this.mapId);
          clearInterval(layerInterval);
        }
      }
    }, 250);
  }

  /**
   * Change the display language of the map
   *
   * @param {TypeDisplayLanguage} displayLanguage the language to use (en, fr)
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig optional new set of layers to apply (will override original set of layers)
   */
  changeLanguage(displayLanguage: TypeDisplayLanguage, listOfGeoviewLayerConfig?: TypeListOfGeoviewLayerConfig): void {
    this.mapFeaturesConfig.displayLanguage = displayLanguage;

    // if a list of geoview layers parameter is present, replace the one from the config
    // do not concat like updatedMapConfig.map.listOfGeoviewLayerConfig?.concat(listOfGeoviewLayerConfig) this
    // because it will keep layer in wrong languages if they are present.
    if (listOfGeoviewLayerConfig) {
      this.mapFeaturesConfig.map.listOfGeoviewLayerConfig = listOfGeoviewLayerConfig;
    }

    // reload the map to change the language
    this.reloadMap(this.mapFeaturesConfig);
  }

  /**
   * Reload a map from a config object
   *
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig a new config passed in from the function call
   */
  reloadMap(mapFeaturesConfig: TypeMapFeaturesConfig) {
    api.maps[this.mapId].mapFeaturesConfig = mapFeaturesConfig;

    // emit an event to reload the map with the new config
    api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, this.mapId, mapFeaturesConfig));
  }

  /**
   * Create a new config for this map element, validate an load it
   *
   * @param {string} mapConfig a new config passed in from the function call
   */
  loadMapFromJsonStringConfig(mapConfig: string) {
    const targetDiv = document.getElementById(this.mapId);
    // reload the map with the new config
    this.reloadMap(getValidConfigFromString(mapConfig, targetDiv!));
  }

  /**
   * Set map to either dynamic or static
   *
   * @param {string} interaction map interaction
   */
  toggleMapInteraction(interaction: string) {
    if (interaction === 'dynamic' || !interaction) {
      this.map.getInteractions().forEach((x) => x.setActive(true));
    } else {
      this.map.getInteractions().forEach((x) => x.setActive(false));
    }
  }

  /**
   * Fit the map to its boundaries. It is assumed that the boundaries use the map projection. If projectionCode is undefined,
   * the boundaries are used as is, otherwise they are reprojected from the specified projection code to the map projection.
   *
   * @param {Extent} bounds bounding box to zoom to
   * @param {string | number | undefined} projectionCode Optional projection code used by the bounds.
   * @returns the bounds
   */
  fitBounds(bounds?: Extent, projectionCode: string | number | undefined = undefined) {
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
          mapBounds = this.layer.geoviewLayers[geoviewLayerId].getMetadataBounds(
            this.layer.geoviewLayers[geoviewLayerId].listOfLayerEntryConfig
          );
        else {
          const newMapBounds = this.layer.geoviewLayers[geoviewLayerId].getMetadataBounds(
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
  }

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
  transformExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops?: number | undefined): Extent {
    return olTransformExtent(extent, source, destination, stops);
  }

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
  transformAndDensifyExtent(extent: Extent, source: ProjectionLike, destination: ProjectionLike, stops = 25): Coordinate[] {
    const coordinates: number[][] = [];
    const width: number = extent[2] - extent[0];
    const height: number = extent[3] - extent[1];
    for (let i = 0; i < stops; ++i) coordinates.push([extent[0] + (width * i) / stops, extent[1]]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[2], extent[1] + (height * i) / stops]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[2] - (width * i) / stops, extent[3]]);
    for (let i = 0; i < stops; ++i) coordinates.push([extent[0], extent[3] - (height * i) / stops]);
    for (let i = 0; i < coordinates.length; i++) coordinates[i] = olTransform(coordinates[i], source, destination);
    return coordinates;
  }

  /**
   * Hide a click marker from the map
   */
  clickMarkerIconHide(): void {
    MapEventProcessor.clickMarkerIconHide(this.mapId);
  }

  /**
   * Show a marker on the map
   * @param {TypeClickMarker} marker the marker to add
   */
  clickMarkerIconShow(marker: TypeClickMarker): void {
    MapEventProcessor.clickMarkerIconShow(this.mapId, marker);
  }

  /**
   * Initializes selection interactions
   */
  initSelectInteractions() {
    // Create selecting capabilities
    const select = new Select({
      mapViewer: this,
      hitTolerance: 5,
    });
    select.startInteraction();
    return select;
  }

  /**
   * Initializes extent interactions
   */
  initExtentInteractions() {
    // Create selecting capabilities
    const extent = new ExtentInteraction({
      mapViewer: this,
      pixelTolerance: 5,
    });
    extent.startInteraction();
    return extent;
  }

  /**
   * Initializes translation interactions
   */
  initTranslateInteractions() {
    // Create selecting capabilities
    const features = this.initSelectInteractions().ol_select.getFeatures();

    // Create translating capabilities
    const translate = new Translate({
      mapViewer: this,
      features,
    });
    translate.startInteraction();
    return translate;
  }

  /**
   * Initializes drawing interactions on the given vector source
   * @param geomGroupKey the geometry group key in which to hold the geometries
   * @param type the type of geometry to draw (Polygon, LineString, Circle, etc)
   * @param styles the styles for the drawing
   */
  initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle) {
    // Create the Draw component
    const draw = new Draw({
      mapViewer: this,
      geometryGroupKey: geomGroupKey,
      type,
      style,
    });
    draw.startInteraction();
    return draw;
  }

  /**
   * Initializes modifying interactions on the given vector source
   * @param geomGroupKey the geometry group key in which to hold the geometries
   */
  initModifyInteractions(geomGroupKey: string) {
    // Create the modify component
    const modify = new Modify({
      mapViewer: this,
      geometryGroupKey: geomGroupKey,
    });
    modify.startInteraction();
    return modify;
  }

  /**
   * Initializes snapping interactions on the given vector source
   * @param geomGroupKey the geometry group key in which to hold the geometries
   */
  initSnapInteractions(geomGroupKey: string) {
    // Create snapping capabilities
    const snap = new Snap({
      mapViewer: this,
      geometryGroupKey: geomGroupKey,
    });
    snap.startInteraction();
    return snap;
  }
}
