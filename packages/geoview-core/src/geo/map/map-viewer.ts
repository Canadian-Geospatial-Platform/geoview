import { Root } from 'react-dom/client';

import { i18n } from 'i18next';
/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/no-var-requires */

import OLMap from 'ol/Map';
import View, { FitOptions, ViewOptions } from 'ol/View';
import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import { Source } from 'ol/source';

import queryString from 'query-string';
import { removeGeoviewStore } from '@/core/stores/stores-managers';

import { Basemap } from '@/geo/layer/basemap/basemap';
import { Layer } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';

import { TypeClickMarker, api, unmountMap } from '@/app';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
import { EVENT_NAMES } from '@/api/events/event-types';

import { AppbarButtons } from '@/core/components/app-bar/app-bar-buttons';
import { NavbarButtons } from '@/core/components/nav-bar/nav-bar-buttons';
import { FooterBarApi } from '@/core/components/footer-bar/footer-bar-api';

import { GeoviewRenderer } from '@/geo/renderer/geoview-renderer';
import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';

import { LegendsLayerSet } from '@/geo/utils/legends-layer-set';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { ModalApi } from '@/ui';
import { mapComponentPayload, mapConfigPayload, GeoViewLayerPayload, payloadIsGeoViewLayerAdded } from '@/api/events/payloads';
import { addNotificationError, generateId, getLocalizedMessage } from '@/core/utils/utilities';
import {
  TypeListOfGeoviewLayerConfig,
  TypeDisplayLanguage,
  TypeViewSettings,
  TypeMapState,
  TypeDisplayTheme,
  VALID_DISPLAY_LANGUAGE,
  VALID_DISPLAY_THEME,
  VALID_PROJECTION_CODES,
  TypeInteraction,
} from '@/geo/map/map-schema-types';
import { TypeMapFeaturesConfig, TypeHTMLElement, TypeValidMapProjectionCodes, TypeJsonObject } from '@/core/types/global-types';
import { layerConfigIsGeoCore } from '@/geo/layer/other/geocore';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';

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

  // plugins attach to the map
  plugins: TypeRecordOfPlugin = {};

  // the overview map reat root
  overviewRoot: Root | undefined;

  // used to access button panel API to create buttons and button panels on the app-bar
  appBarButtons!: AppbarButtons;

  // used to access button panel API to create buttons and button panels on the nav-bar
  navBarButtons!: NavbarButtons;

  // used to access the footer tabs api
  footerBar!: FooterBarApi;

  // used to access basemap functions
  basemap!: Basemap;

  // used to access layers functions
  layer!: Layer;

  // modals creation
  modal!: ModalApi;

  // GeoView renderer
  geoviewRenderer: GeoviewRenderer;

  // flag used to indicate that the ready callback routine has been called once
  readyCallbackHasRun = false;

  // i18n instance
  private i18nInstance!: i18n;

  /**
   * Add the map instance to the maps array in the api
   *
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
   * @param {i18n} i18instance language instance
   */
  constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n) {
    this.mapId = mapFeaturesConfig.mapId;
    this.mapFeaturesConfig = mapFeaturesConfig;

    this.i18nInstance = i18instance;

    this.appBarButtons = new AppbarButtons(this.mapId);
    this.navBarButtons = new NavbarButtons(this.mapId);
    this.footerBar = new FooterBarApi(this.mapId);

    this.modal = new ModalApi(this.mapId);

    this.geoviewRenderer = new GeoviewRenderer(this.mapId);

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(MapEventProcessor.getBasemapOptions(this.mapId), this.mapId);

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
                // Log
                logger.logTraceDetailed('map-viewer on EVENT_NAMES.LAYER.EVENT_LAYER_ADDED', this.mapId, payload);

                const { geoviewLayer } = payload;
                MapEventProcessor.setLayerZIndices(this.mapId);
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
   * Function called when the map has been rendered and ready to be customized
   */
  mapReady(): void {
    // Log Marker Start
    logger.logMarkerStart(`mapReady-${this.mapId}`);

    const layerInterval = setInterval(() => {
      // Log
      logger.logTraceDetailed('map-viewer.mapReady?', this.mapId);

      if (this.layer?.geoviewLayers) {
        const { geoviewLayers } = this.layer;
        let allGeoviewLayerReady =
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig?.length === 0 || Object.keys(geoviewLayers).length !== 0;
        Object.keys(geoviewLayers).forEach((geoviewLayerId) => {
          const layerIsReady = geoviewLayers[geoviewLayerId].allLayerEntryConfigProcessed();
          logger.logTraceDetailed('map-viewer.mapReady? layer ready?', geoviewLayerId, layerIsReady);
          allGeoviewLayerReady &&= layerIsReady;
        });
        if (allGeoviewLayerReady) {
          // Log
          logger.logInfo('Map is ready', this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, 'for map to be ready');
          MapEventProcessor.setMapLoaded(this.mapId);
          clearInterval(layerInterval);
        }
      }
    }, 250);
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
   * Add a localization ressource bundle for a supported language (fr, en). Then the new key added can be
   * access from the utilies function getLocalizesMessage to reuse in ui from outside the core viewer.
   *
   * @param {TypeDisplayLanguage} language the language to add the ressoruce for (en, fr)
   * @param {TypeJsonObject} translations the translation object to add
   */
  addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: TypeJsonObject): void {
    this.i18nInstance.addResourceBundle(language, 'translation', translations, true, false);
  }

  // #region MAP STATES
  /**
   * Return the current display language
   *
   * @returns {TypeDisplayLanguage} The display language
   */
  getDisplayLanguage(): TypeDisplayLanguage {
    return AppEventProcessor.getDisplayLanguage(this.mapId);
  }

  /**
   * Return the current display theme
   *
   * @returns {TypeDisplayTheme} The display theme
   */
  getDisplayTheme(): TypeDisplayTheme {
    return AppEventProcessor.getDisplayTheme(this.mapId);
  }

  /**
   * Return the map current state information
   *
   * @returns {TypeMapState} The map state
   */
  getMapState(): TypeMapState {
    // map state initialize with store data coming from configuration file/object.
    // updated values will be added by store subscription in map-event-processor
    return MapEventProcessor.getMapState(this.mapId);
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
   * set fullscreen / exit fullscreen
   *
   * @param status toggle fullscreen or exit fullscreen status
   * @param {HTMLElement} element the element to toggle fullscreen on
   */
  setFullscreen(status: boolean, element: TypeHTMLElement): void {
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
   * Set map to either dynamic or static
   *
   * @param {TypeInteraction} interaction map interaction
   */
  setInteraction(interaction: TypeInteraction) {
    MapEventProcessor.setInteraction(this.mapId, interaction);
  }

  /**
   * Set the display language of the map
   *
   * @param {TypeDisplayLanguage} displayLanguage the language to use (en, fr)
   * @param {boolean} resetLayer optional flag to ask viewer to reload layers with the new localize language
   */
  setLanguage(displayLanguage: TypeDisplayLanguage, resetLayer?: boolean | false): void {
    if (VALID_DISPLAY_LANGUAGE.includes(displayLanguage)) {
      AppEventProcessor.setDisplayLanguage(this.mapId, displayLanguage);

      // if flag is true, check if config support the layers change and apply
      if (resetLayer) {
        if (AppEventProcessor.getSupportedLanguages(this.mapId).includes(displayLanguage)) {
          logger.logInfo('reset layers not implemented yet');
        } else addNotificationError(this.mapId, getLocalizedMessage(this.mapId, 'validation.changeDisplayLanguageLayers'));
      }
    } else addNotificationError(this.mapId, getLocalizedMessage(this.mapId, 'validation.changeDisplayLanguage'));
  }

  /**
   * Set the display projection of the map
   *
   * @param {TypeValidMapProjectionCodes} projectionCode the projection code (3978, 3857)
   */
  setProjection(projectionCode: TypeValidMapProjectionCodes): void {
    if (VALID_PROJECTION_CODES.includes(Number(projectionCode))) {
      MapEventProcessor.setProjection(this.mapId, projectionCode);
    } else addNotificationError(this.mapId, getLocalizedMessage(this.mapId, 'validation.changeDisplayProjection'));
  }

  /**
   * Set the display theme of the map
   *
   * @param {TypeDisplayTheme} displayTheme the theme to use (geo.ca, light, dark)
   */
  setTheme(displayTheme: TypeDisplayTheme): void {
    if (VALID_DISPLAY_THEME.includes(displayTheme)) {
      AppEventProcessor.setDisplayTheme(this.mapId, displayTheme);
    } else addNotificationError(this.mapId, getLocalizedMessage(this.mapId, 'validation.changeDisplayTheme'));
  }

  /**
   * Set the map viewSettings
   *
   * @param {TypeMapView} mapView map viewSettings object
   */
  setView(mapView: TypeViewSettings): void {
    const currentView = this.map.getView();
    const viewOptions: ViewOptions = {};
    viewOptions.projection = mapView.projection ? `EPSG:${mapView.projection}` : currentView.getProjection();
    viewOptions.zoom = mapView.zoom ? mapView.zoom : currentView.getZoom();
    viewOptions.center = mapView.center
      ? api.projection.transformFromLonLat([mapView.center[0], mapView.center[1]], viewOptions.projection)
      : api.projection.transformFromLonLat(
          api.projection.transformToLonLat(currentView.getCenter()!, currentView.getProjection()),
          viewOptions.projection
        );
    viewOptions.minZoom = mapView.minZoom ? mapView.minZoom : currentView.getMinZoom();
    viewOptions.maxZoom = mapView.maxZoom ? mapView.maxZoom : currentView.getMaxZoom();
    if (mapView.extent) viewOptions.extent = mapView.extent;

    this.map.setView(new View(viewOptions));
  }

  /**
   * Loop through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   *
   * @returns A Promise which resolves when the rendering is completed after the source(s) were changed.
   */
  refreshLayers(): Promise<void> {
    const mapLayers = api.maps[this.mapId].layer.geoviewLayers;
    Object.entries(mapLayers).forEach((mapLayerEntry) => {
      const refreshBaseLayer = (baseLayer: BaseLayer | null) => {
        if (baseLayer) {
          const layerGroup: Array<BaseLayer> | Collection<BaseLayer> | undefined = baseLayer.get('layers');
          if (layerGroup) {
            layerGroup.forEach((baseLayerEntry) => {
              refreshBaseLayer(baseLayerEntry);
            });
          } else {
            const layerSource: Source = baseLayer.get('source');
            layerSource.refresh();
          }
        }
      };
      refreshBaseLayer(mapLayerEntry[1].olLayers);
    });

    // Return a promise for when rendering will complete
    return new Promise<void>((resolve) => {
      api.maps[this.mapId].map.once('rendercomplete', () => {
        // Done
        resolve();
      });
    });
  }
  // #endregion

  // #region MAP ACTIONS
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
   * Check if geometries needs to be loaded from a URL geoms parameter
   */
  loadGeometries(): void {
    // see if a data geometry endpoint is configured and geoms param is provided then get the param value(s)
    const servEndpoint = this.map.getTargetElement()?.closest('.geoview-map')?.getAttribute('data-geometry-endpoint') || '';

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
   * Remove map
   *
   * @param {boolean} deleteContainer true if we want to delete div from the page
   * @returns {HTMLElement} return the HTML element
   */
  remove(deleteContainer: boolean): HTMLElement {
    // remove layers if present
    if (this.layer) this.layer.removeAllGeoviewLayers();

    // unsubscribe from all remaining events registered on this map
    api.event.offAll(this.mapId);

    // remove layer sets for this map
    LegendsLayerSet.delete(this.mapId);
    FeatureInfoLayerSet.delete(this.mapId);

    // unload all loaded plugins on the map
    api.plugin.removePlugins(this.mapId);

    // get the map container to unmount
    const mapContainer = document.getElementById(this.mapId)!;

    // remove the dom element (remove rendered map and overview map)
    if (this.overviewRoot) this.overviewRoot?.unmount();
    unmountMap(this.mapId);

    // delete the map instance from the maps array, will delete attached plugins
    delete api.maps[this.mapId];

    // delete store and event processor
    removeGeoviewStore(this.mapId);

    // if deleteContainer, delete the HTML div
    if (deleteContainer) mapContainer.remove();

    // return the map container to be remove
    return mapContainer;
  }

  /**
   * Reload a map from a config object stored in store
   */
  reload(): void {
    // emit an event to reload the map with the stored config
    api.event.emit(mapConfigPayload(EVENT_NAMES.MAP.EVENT_MAP_RELOAD, this.mapId, MapEventProcessor.getGeoViewMapConfig(this.mapId)!));
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {Extent} extent The extent to zoom to.
   * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   */
  zoomToExtent(extent: Extent, options?: FitOptions): void {
    MapEventProcessor.zoomToExtent(this.mapId, extent, options);
  }
  // #endregion

  /**
   * Fit the map to its boundaries. It is assumed that the boundaries use the map projection. If projectionCode is undefined,
   * the boundaries are used as is, otherwise they are reprojected from the specified projection code to the map projection.
   *
   * @param {Extent} bounds bounding box to zoom to
   * @param {string | number | undefined} projectionCode Optional projection code used by the bounds.
   * @returns the bounds
   */
  // TODO: only use in the layers panel package... see if still needed and if it is the right place
  fitBounds(bounds?: Extent, projectionCode: string | number | undefined = undefined) {
    let mapBounds: Extent | undefined;
    if (bounds) {
      const { currentProjection } = this.getMapState();
      mapBounds = projectionCode
        ? api.projection.transformExtent(bounds, `EPSG:${projectionCode}`, api.projection.projections[currentProjection], 20)
        : api.projection.transformExtent(
            bounds,
            api.projection.projections[currentProjection],
            api.projection.projections[currentProjection],
            25
          );
    } else {
      Object.keys(this.layer.geoviewLayers).forEach((geoviewLayerId) => {
        if (!mapBounds) mapBounds = this.layer.geoviewLayers[geoviewLayerId].getMetadataBounds(geoviewLayerId);
        else {
          const newMapBounds = this.layer.geoviewLayers[geoviewLayerId].getMetadataBounds(geoviewLayerId);
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

  // #region MAP INTERACTIONS
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
  // #endregion
}
