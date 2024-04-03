import { Root } from 'react-dom/client';

import { i18n } from 'i18next';

import OLMap from 'ol/Map';
import View, { FitOptions, ViewOptions } from 'ol/View';
import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import Collection from 'ol/Collection';
import { Source } from 'ol/source';

import queryString from 'query-string';
import { removeGeoviewStore } from '@/core/stores/stores-managers';

import { Basemap } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';

import { api, unmountMap } from '@/app';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';

import { AppbarApi } from '@/core/components/app-bar/app-bar-api';
import { NavbarApi } from '@/core/components/nav-bar/nav-bar-api';
import { FooterBarApi } from '@/core/components/footer-bar/footer-bar-api';

import { GeoviewRenderer } from '@/geo/renderer/geoview-renderer';
import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { ModalApi } from '@/ui';
import { addNotificationError, generateId, getLocalizedMessage } from '@/core/utils/utilities';
import {
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
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { logger } from '@/core/utils/logger';
import { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

interface TypeDocument extends Document {
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

  // used to access button bar API to create buttons and button panels on the app-bar
  appBarApi: AppbarApi;

  // used to access button bar API to create buttons and button panels on the nav-bar
  navBarApi: NavbarApi;

  // used to access the footer bar API to create buttons and footer panels on the footer-bar
  footerBarApi: FooterBarApi;

  // used to access basemap functions
  basemap: Basemap;

  // used to access layers functions
  // Note: The '!' is used here, because it's being created just a bit late, but not late enough that we want to keep checking for undefined throughout the code base
  // Should probably refactor that a bit later..
  layer!: LayerApi;

  // modals creation
  modal: ModalApi;

  // GeoView renderer
  geoviewRenderer: GeoviewRenderer;

  // i18n instance
  #i18nInstance: i18n;

  // Indicate if the map has been initialized
  #mapInit = false;

  // Indicate if the map is ready
  #mapReady = false;

  // Indicate if the map has all its layers processed upon launch
  #mapLayersProcessed = false;

  // Indicate if the map has all its layers loaded upon launch
  #mapLayersLoaded = false;

  // Keep all callback delegates references
  #onMapInitHandlers: MapInitDelegate[] = [];

  // Keep all callback delegates references
  #onMapReadyHandlers: MapReadyDelegate[] = [];

  // Keep all callback delegates references
  #onMapLayersProcessedHandlers: MapLayersProcessedDelegate[] = [];

  // Keep all callback delegates references
  #onMapLayersLoadedHandlers: MapLayersLoadedDelegate[] = [];

  // Getter for map is init
  get mapInit(): boolean {
    return this.#mapInit;
  }

  // Getter for map is ready. A Map is ready when all layers have been processed.
  get mapReady(): boolean {
    return this.#mapReady;
  }

  // Getter for map layers processed
  get mapLayersProcessed(): boolean {
    return this.#mapLayersProcessed;
  }

  // Getter for map layers loaded
  get mapLayersLoaded(): boolean {
    return this.#mapLayersLoaded;
  }

  /**
   * Constructor for a MapViewer, setting:
   * - the mapId
   * - the mapFeaturesConfig
   * - i18n
   * - appbar, navbar, footerbar
   * - modalApi
   * - geoviewRenderer
   * - basemap
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
   * @param {i18n} i18instance language instance
   */
  constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n) {
    this.mapId = mapFeaturesConfig.mapId;
    this.mapFeaturesConfig = mapFeaturesConfig;

    this.#i18nInstance = i18instance;

    this.appBarApi = new AppbarApi(this.mapId);
    this.navBarApi = new NavbarApi(this.mapId);
    this.footerBarApi = new FooterBarApi(this.mapId);

    this.modal = new ModalApi(this.mapId);
    this.modal.onModalOpened((sender, modalEvent) => api.event.emitModalOpen(this.mapId, modalEvent.modalId));
    this.modal.onModalClosed((sender, modalEvent) => api.event.emitModalClose(this.mapId, modalEvent.modalId));

    this.geoviewRenderer = new GeoviewRenderer(this.mapId);

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(MapEventProcessor.getBasemapOptions(this.mapId), this.mapId);
  }

  /**
   * Initializes map, layer class and geometries
   *
   * @param {OLMap} cgpMap The OpenLayers map object
   */
  initMap(cgpMap: OLMap): void {
    // Set the map
    this.map = cgpMap;

    // TODO: Refactor - Is it necessary to set the mapId again? It was set in constructor. Preferably set it at one or the other.
    this.mapId = cgpMap.get('mapId');

    // initialize layers and load the layers passed in from map config if any
    this.layer = new LayerApi(this);
    this.layer.loadListOfGeoviewLayer(this.mapFeaturesConfig.map.listOfGeoviewLayerConfig);

    // check if geometries are provided from url
    this.loadGeometries();

    // Emit map init
    this.#mapInit = true;
    this.emitMapInit();

    // Start checking for when the map will be ready
    this.#checkMapReady();
  }

  /**
   * Function called to monitor when the map is actually ready.
   * Important: This function is also responsible for calling the MapEventProcessor.setMapLoaded after 1 second has ellapsed.
   */
  #checkMapReady(): void {
    // Log Marker Start
    logger.logMarkerStart(`mapReady-${this.mapId}`);

    // TODO: Refactor - Rewrite the code here to not have to rely on a setInterval anymore.
    // Start an interval checker
    const mapInterval = setInterval(() => {
      if (this.layer.geoviewLayers) {
        const { geoviewLayers } = this.layer;
        let allGeoviewLayerRegistered =
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig?.length === 0 || Object.keys(geoviewLayers).length !== 0;
        Object.values(geoviewLayers).forEach((geoviewLayer) => {
          const layerIsRegistered = geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('registered');
          if (!layerIsRegistered) logger.logTraceDetailed('checkMapReady - wating on layer registration...', geoviewLayer.geoviewLayerId);
          allGeoviewLayerRegistered &&= layerIsRegistered;
        });

        if (allGeoviewLayerRegistered) {
          // Clear interval
          clearInterval(mapInterval);

          // How many layers?
          const layersCount = Object.keys(geoviewLayers).length;

          // Log
          logger.logInfo(`Map is ready with ${layersCount} registered layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for map to be ready. Layers are still being processed...`);

          // Is ready
          this.#mapReady = true;
          this.emitMapReady();

          // GV We added processed to layers check so this map loaded event is fired faster
          // This emits the MAP_LOADED event
          MapEventProcessor.setMapLoaded(this.mapId);

          // Start checking for layers result sets to be ready
          this.#checkLayerResultSetReady();

          // Start checking for map layers processed
          this.#checkMapLayersProcessed();
        }
      }
    }, 250);
  }

  /**
   * Function called to monitor when the map has its layers in processed state.
   */
  #checkMapLayersProcessed(): void {
    // Start an interval checker
    // TODO: Refactor - Rewrite the code here to not have to rely on a setInterval anymore.
    const mapInterval = setInterval(() => {
      if (this.layer.geoviewLayers) {
        const { geoviewLayers } = this.layer;
        let allGeoviewLayerLoaded =
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig?.length === 0 || Object.keys(geoviewLayers).length !== 0;
        Object.values(geoviewLayers).forEach((geoviewLayer) => {
          const layerIsLoaded = geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('processed');
          if (!layerIsLoaded)
            logger.logTraceDetailed('checkMapLayersProcessed - waiting on layer processed...', geoviewLayer.geoviewLayerId);
          allGeoviewLayerLoaded &&= layerIsLoaded;
        });

        if (allGeoviewLayerLoaded) {
          // Clear interval
          clearInterval(mapInterval);

          // How many layers?
          const layersCount = Object.keys(geoviewLayers).length;

          // Log
          logger.logInfo(`Map is ready with ${layersCount} processed layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for all ${layersCount} layers to be processed`);

          // Is ready
          this.#mapLayersProcessed = true;
          this.emitMapLayersProcessed();

          // Start checking for map layers loaded
          this.#checkMapLayersLoaded();
        }
      }
    }, 250);
  }

  /**
   * Function called to monitor when the map has its layers in loaded state.
   */
  #checkMapLayersLoaded(): void {
    // Start an interval checker
    // TODO: Refactor - Rewrite the code here to not have to rely on a setInterval anymore.
    const mapInterval = setInterval(() => {
      if (this.layer.geoviewLayers) {
        const { geoviewLayers } = this.layer;
        let allGeoviewLayerLoaded =
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig?.length === 0 || Object.keys(geoviewLayers).length !== 0;
        Object.values(geoviewLayers).forEach((geoviewLayer) => {
          const layerIsLoaded = geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('loaded');
          if (!layerIsLoaded)
            logger.logTraceDetailed('checkMapLayersLoaded - waiting on layer loaded/error...', geoviewLayer.geoviewLayerId);
          allGeoviewLayerLoaded &&= layerIsLoaded;
        });

        if (allGeoviewLayerLoaded) {
          // Clear interval
          clearInterval(mapInterval);

          // How many layers?
          const layersCount = Object.keys(geoviewLayers).length;

          // Log
          logger.logInfo(`Map is ready with ${layersCount} loaded layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for all ${layersCount} layers to be loaded`);

          // Is ready
          this.#mapLayersLoaded = true;
          this.emitMapLayersLoaded();
        }
      }
    }, 250);
  }

  /**
   * Function called to monitor when the layers result sets are actually ready
   */
  #checkLayerResultSetReady(): Promise<void> {
    // Start another interval checker
    return new Promise<void>((resolve) => {
      // TODO: Refactor - Rewrite the code here to not have to rely on a setInterval anymore.
      const layersInterval = setInterval(() => {
        if (api.maps[this.mapId].layer) {
          // Check if all registered layers have their results set
          let allGood = true;
          Object.entries(this.layer.registeredLayers).forEach(([layerPath, registeredLayer]) => {
            // If not queryable, don't expect a result set
            if (!(registeredLayer as AbstractBaseLayerEntryConfig).source?.featureInfo?.queryable) return;

            const { resultSet } = this.layer.featureInfoLayerSet;
            const layerResultSetReady = Object.keys(resultSet).includes(layerPath);
            if (!layerResultSetReady) {
              logger.logTraceDetailed('checkLayerResultSetReady - waiting on layer resultSet...', layerPath);
              allGood = false;
            }
          });

          // If all good
          if (allGood) {
            // Clear interval
            clearInterval(layersInterval);

            // How many layers resultset?
            const resultSetCount = Object.keys(this.layer.featureInfoLayerSet.resultSet).length;

            // Log
            // logger.logDebug(`Map is ready with a layer result set of ${resultSetCount} layers`, this.mapId);
            logger.logMarkerCheck(`mapReady-${this.mapId}`, `for layer result set of ${resultSetCount} layers to be instanciated`);

            // Resolve the promise
            resolve();
          }
        }
      }, 250);
    });
  }

  /**
   * Emits an event to all handlers.
   */
  emitMapInit = () => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapInitHandlers, undefined);
  };

  /**
   * Wires an event handler.
   * @param {MapInitDelegate} callback The callback to be executed whenever the event is emitted
   */
  onMapInit = (callback: MapInitDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onMapInitHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {MapInitDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offMapInit = (callback: MapInitDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onMapInitHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   */
  emitMapReady = () => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapReadyHandlers, undefined);
  };

  /**
   * Wires an event handler.
   * @param {MapReadyDelegate} callback The callback to be executed whenever the event is emitted
   */
  onMapReady = (callback: MapReadyDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onMapReadyHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {MapReadyDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offMapReady = (callback: MapReadyDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onMapReadyHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   */
  emitMapLayersProcessed = () => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapLayersProcessedHandlers, undefined);
  };

  /**
   * Wires an event handler.
   * @param {MapLayersProcessedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onMapLayersProcessed = (callback: MapLayersProcessedDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onMapLayersProcessedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {MapLayersProcessedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offMapLayersProcessed = (callback: MapLayersProcessedDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onMapLayersProcessedHandlers, callback);
  };

  /**
   * Emits an event to all handlers.
   */
  emitMapLayersLoaded = () => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapLayersLoadedHandlers, undefined);
  };

  /**
   * Wires an event handler.
   * @param {MapLayersLoadedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onMapLayersLoaded = (callback: MapLayersLoadedDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onMapLayersLoadedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {MapLayersLoadedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offMapLayersLoaded = (callback: MapLayersLoadedDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onMapLayersLoadedHandlers, callback);
  };

  /**
   * Add a new custom component to the map
   *
   * @param {string} mapComponentId an id to the new component
   * @param {JSX.Element} component the component to add
   */
  addComponent(mapComponentId: string, component: JSX.Element): void {
    if (mapComponentId && component) {
      // emit an event to add the component
      api.event.emitCreateComponent(this.mapId, mapComponentId, component);
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
      api.event.emitRemoveComponent(this.mapId, mapComponentId);
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
    this.#i18nInstance.addResourceBundle(language, 'translation', translations, true, false);
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
    // TODO: Refactor - For reusability, this function should be static and moved to a browser-utilities class
    // TO.DOCONT: If we want to keep a function here, in MapViewer, it should just be a redirect to the browser-utilities'
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
      } else if ((document as TypeDocument).webkitExitFullscreen) {
        /* Safari */
        (document as TypeDocument).webkitExitFullscreen();
      } else if ((document as TypeDocument).msExitFullscreen) {
        /* IE11 */
        (document as TypeDocument).msExitFullscreen();
      } else if ((document as TypeDocument).mozCancelFullScreen) {
        /* Firefox */
        (document as TypeDocument).mozCancelFullScreen();
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
    const mapLayers = this.layer.geoviewLayers;
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
                this.layer.geometry.addPolygon(data.geometry.coordinates, undefined, generateId(null));
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
    // Remove all layers
    this.layer.removeAllGeoviewLayers();

    // unsubscribe from all remaining events registered on this map
    api.event.offAll(this.mapId);

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
    api.event.emitMapReload(this.mapId, MapEventProcessor.getGeoViewMapConfig(this.mapId)!);
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {Extent} extent The extent to zoom to.
   * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   */
  zoomToExtent(extent: Extent, options?: FitOptions): Promise<void> {
    return MapEventProcessor.zoomToExtent(this.mapId, extent, options);
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
    const features = this.initSelectInteractions().getFeatures();

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

/**
 * Define a delegate for the event handler function signature
 */
type MapInitDelegate = EventDelegateBase<MapViewer, undefined>;

/**
 * Define a delegate for the event handler function signature
 */
type MapReadyDelegate = EventDelegateBase<MapViewer, undefined>;

/**
 * Define a delegate for the event handler function signature
 */
type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, undefined>;

/**
 * Define a delegate for the event handler function signature
 */
type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, undefined>;
