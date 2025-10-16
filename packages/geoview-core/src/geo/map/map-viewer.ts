import type { Root } from 'react-dom/client';

import type { i18n } from 'i18next';

import debounce from 'lodash/debounce';
import type { MapBrowserEvent, MapEvent } from 'ol';
import { ObjectEvent } from 'ol/Object';
import OLMap from 'ol/Map';
import type { FitOptions, ViewOptions } from 'ol/View';
import View from 'ol/View';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { Condition } from 'ol/events/condition';
import { shared as iconImageCache } from 'ol/style/IconImageCache';
import type { Size } from 'ol/size';
import type { GeometryFunction } from 'ol/interaction/Draw';

import queryString from 'query-string';
import type {
  TypeMapFeaturesInstance,
  TypeViewSettings,
  TypeInteraction,
  TypeValidMapProjectionCodes,
  TypeDisplayLanguage,
  TypeDisplayTheme,
  TypeMapViewSettings,
  TypeStyleGeometry,
} from '@/api/types/map-schema-types';
import {
  MAP_CENTER,
  MAP_EXTENTS,
  VALID_ZOOM_LEVELS,
  VALID_DISPLAY_LANGUAGE,
  VALID_DISPLAY_THEME,
  VALID_PROJECTION_CODES,
} from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';

import { BasemapApi } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Projection } from '@/geo/utils/projection';

import { Plugin } from '@/api/plugin/plugin';
import { AppBarApi } from '@/core/components/app-bar/app-bar-api';
import { NavBarApi } from '@/core/components/nav-bar/nav-bar-api';
import { FooterBarApi } from '@/core/components/footer-bar/footer-bar-api';
import { StateApi } from '@/core/stores/state-api';

import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';
import type { TransformOptions } from '@/geo/interaction/transform/transform';
import { Transform } from '@/geo/interaction/transform/transform';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { ModalApi } from '@/ui';
import { delay, generateId, getLocalizedMessage, whenThisThen } from '@/core/utils/utilities';
import { createEmptyBasemap, getPointerPositionFromMapEvent, isExtentLonLat } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';
import { NORTH_POLE_POSITION } from '@/core/utils/constant';
import type { TypeMapFeaturesConfig, TypeHTMLElement } from '@/core/types/global-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { Notifications } from '@/core/utils/notifications';
import type { TypeOrderedLayerInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { Fetch } from '@/core/utils/fetch-helper';
import { formatError } from '@/core/exceptions/core-exceptions';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';

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
  /** Minimum delay (in milliseconds) for map to be in loading state */
  static readonly #MIN_DELAY_LOADING = 2000; // 2 seconds

  /** Maximum delay to wait until the layers get processes/loaded/error state, should be high as other timeouts should expire before this.. */
  static readonly #MAX_DELAY_TO_WAIT_ON_MAP = 120 * 1000; // 2 minutes

  // The default densification number when forming layer extents, to make ture to compensate for earth curvature
  static DEFAULT_STOPS: number = 25;

  // TODO: refactor UI - If we do not put a high timeout, ui start but the function getMapCoordinateFromPixel
  // TD.CONT: AND scale component return null and fails. To patch, we add an higher time out for promise.
  // TD.CONT: This solves for now the issue where the page start to load and user switch to another page and came back.
  // Timeout value when map init to avoid when use the map is not ready, the UI will not start
  // static INIT_TIMEOUT_PROMISE: number = 1000;
  static INIT_TIMEOUT_NORTH_VISIBILITY: number = 1000;

  // map config properties
  mapFeaturesConfig: TypeMapFeaturesConfig;

  // the id of the map
  mapId: string;

  // the openlayer map
  // Note: The '!' is used here, because it's being created just a bit late, but not late enough that we want to keep checking for undefined throughout the code base
  map!: OLMap;

  // plugins attach to the map
  plugins: PluginsContainer = {};

  // the overview map reat root
  overviewRoot: Root | undefined;

  // used to access button bar API to create buttons and button panels on the app-bar
  appBarApi: AppBarApi;

  // used to access button bar API to create buttons and button panels on the nav-bar
  navBarApi: NavBarApi;

  // used to access the footer bar API to create buttons and footer panels on the footer-bar
  footerBarApi: FooterBarApi;

  // used to manage states
  stateApi: StateApi;

  // used to access basemap functions
  basemap: BasemapApi;

  // used to attach the notification class
  notifications: Notifications;

  // used to access layers functions
  layer: LayerApi;

  // modals creation
  modal: ModalApi;

  // max number of icons cached
  iconImageCacheSize: number;

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

  /** Keep all callback delegates references */
  #onMapInitHandlers: MapInitDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapReadyHandlers: MapReadyDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapLayersProcessedHandlers: MapLayersProcessedDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapLayersLoadedHandlers: MapLayersLoadedDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapMoveEndHandlers: MapMoveEndDelegate[] = [];

  /** Whether pointer events should be handled */
  #pointerHandlersEnabled: boolean = true;

  /** Keep all callback delegates references */
  #onMapPointerMoveHandlers: MapPointerMoveDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapPointerStopHandlers: MapPointerMoveDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapSingleClickHandlers: MapSingleClickDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapZoomEndHandlers: MapZoomEndDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapRotationHandlers: MapRotationDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapChangeSizeHandlers: MapChangeSizeDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapProjectionChangedHandlers: MapProjectionChangedDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapComponentAddedHandlers: MapComponentAddedDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapComponentRemovedHandlers: MapComponentRemovedDelegate[] = [];

  /** Keep all callback delegates references */
  #onMapLanguageChangedHandlers: MapLanguageChangedDelegate[] = [];

  // The starting time of the timer for the map ready
  #checkMapReadyStartTime: number | undefined;

  // Keep a bounded reference to the handle map pointer move
  #boundedHandleMapPointerMove: (event: MapBrowserEvent) => void;

  // Keep a bounded reference to the handle map pointer stopped
  #boundedHandleMapPointerStopped: (event: MapBrowserEvent) => void;

  // Keep a bounded reference to the handle map single click
  #boundedHandleMapSingleClick: (event: MapBrowserEvent) => void;

  // Keep a bounded reference to the debounced handle map pointer stopped
  #boundedHandleMapPointerStoppedDebounced: (event: MapBrowserEvent) => void;

  // Keep a bounded reference to the debounced handle map single click
  #boundedHandleMapSingleClickDebounced: (event: MapBrowserEvent) => void;

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
   * - AppBar, NavBar, FooterBar
   * - modalApi
   * - basemap
   * @param {TypeMapFeaturesConfig} mapFeaturesConfig map properties
   * @param {i18n} i18instance language instance
   */
  constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n) {
    this.mapId = mapFeaturesConfig.mapId;
    this.mapFeaturesConfig = mapFeaturesConfig;

    this.#i18nInstance = i18instance;

    this.iconImageCacheSize = 1;

    this.appBarApi = new AppBarApi(this.mapId);
    this.navBarApi = new NavBarApi(this.mapId);
    this.footerBarApi = new FooterBarApi(this.mapId);
    this.stateApi = new StateApi(this.mapId);
    this.notifications = new Notifications(this.mapId);

    this.modal = new ModalApi();

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new BasemapApi(this, MapEventProcessor.getBasemapOptions(this.mapId));

    // Initialize layer api
    this.layer = new LayerApi(this);

    // Register handler when basemap has error
    this.basemap.onBasemapError((sender, event) => {
      // Show the error
      this.notifications.showErrorFromError(event.error);
    });

    // Mouse bounded handle references
    this.#boundedHandleMapPointerMove = this.#handleMapPointerMove.bind(this);
    this.#boundedHandleMapPointerStopped = this.#handleMapPointerStopped.bind(this);
    this.#boundedHandleMapSingleClick = this.#handleMapSingleClick.bind(this);
    this.#boundedHandleMapPointerStoppedDebounced = debounce(this.#boundedHandleMapPointerStopped, 750, { leading: false });
    this.#boundedHandleMapSingleClickDebounced = debounce(this.#boundedHandleMapSingleClick, 1000, { leading: true });
  }

  /**
   * Create an Open Layer map from configuration attached to the class.
   * This function is called from a useEffect and should be running synchronously.
   * @param {HTMLElement} mapElement - HTML element to create the map within
   * @returns {OLMap} The OpenLayer map
   */
  createMap(mapElement: HTMLElement): OLMap {
    // config object
    const mapViewSettings = this.mapFeaturesConfig?.map.viewSettings;

    // create map projection object from code
    const projection = Projection.PROJECTIONS[mapViewSettings.projection];

    let extentProjected: Extent | undefined;
    if (mapViewSettings.maxExtent && projection)
      extentProjected = Projection.transformExtentFromProj(mapViewSettings.maxExtent, Projection.getProjectionLonLat(), projection);

    const initialMap = new OLMap({
      target: mapElement,
      layers: [createEmptyBasemap()],
      view: new View({
        projection,
        center: Projection.transformFromLonLat(
          mapViewSettings.initialView?.zoomAndCenter
            ? mapViewSettings.initialView?.zoomAndCenter[1]
            : MAP_CENTER[mapViewSettings.projection],
          projection
        ),
        zoom: mapViewSettings.initialView?.zoomAndCenter ? mapViewSettings.initialView?.zoomAndCenter[0] : 3.5,
        extent: extentProjected || undefined,
        minZoom: mapViewSettings.minZoom || VALID_ZOOM_LEVELS[0],
        maxZoom: mapViewSettings.maxZoom || VALID_ZOOM_LEVELS[1],
        rotation: mapViewSettings.rotation || 0,
      }),
      controls: [],
      keyboardEventTarget: document.getElementById(`map-${this.mapId}`) as HTMLElement,
    });

    // Set the map
    this.map = initialMap;

    // GV Register a handler when the map will postrender before pursuing map initialization
    // That means:
    //   - The map has been sized based on the container div
    //   - The view (center, zoom, resolution) is applied
    //   - The scale and extent-dependent widgets (like scale bars) can now be safely positioned and calculated
    this.map.once('postrender', () => {
      // Log
      logger.logInfo('OpenLayers Map has been rendered once');

      // Initiliaze it for GeoView
      this.initMap().catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('initMap in createMap in MapViewer', error);
      });
    });

    // Return the OLMap that is still being initialized..
    return initialMap;
  }

  /**
   * Initializes map, layer class and geometries.
   * This function must be called once the Map is rendered
   */
  async initMap(): Promise<void> {
    // Note the time
    this.#checkMapReadyStartTime = Date.now();

    // Load the Map itself and the UI controls
    await MapEventProcessor.initMapControls(this.mapId);

    // Load the core packages plugins
    await this.#loadCorePackages();

    // Reset the basemap - not awaited as we proceed with empty basemap while it loads
    MapEventProcessor.resetBasemap(this.mapId).catch((error: unknown) => logger.logError('Basemap creation failed', error));

    // Emit map init
    this.#mapInit = true;
    this.#emitMapInit();

    // Check if geometries are provided from url and load them
    this.#loadGeometries();

    // Prepare the FeatureHighlight now that the map is available
    this.layer.featureHighlight.init();

    // Load the list of geoview layers in the config to add all layers on the map.
    // After this call, all first level layers have been registered.
    await this.layer.loadListOfGeoviewLayer(this.mapFeaturesConfig.map.listOfGeoviewLayerConfig);

    // Here, all base-level "this.mapFeaturesConfig.map.listOfGeoviewLayerConfig" have been registered (layerStatus === 'registered').
    // However, careful, the layers are still processing and some sub-layer-entries can get registered on-the-fly (notably: EsriDynamic, WMS).

    // Ready the map
    return this.#readyMap();
  }

  // #region MAP STATES

  /**
   * Asynchronously attempts to get a plugin by its id.
   * @param {string} pluginId - The plugin id
   * @returns {AbstractPlugin} The plugin
   */
  getPlugin(pluginId: string): Promise<AbstractPlugin> {
    return whenThisThen(() => {
      return this.plugins[pluginId];
    });
  }

  /**
   * Retrieves the configuration object for a specific core plugin from the map's features configuration.
   *
   * @param {string} pluginId - The ID of the core plugin to look up.
   * @returns {unknown | undefined} The configuration object for the specified plugin, or `undefined` if not found.
   */
  getCorePackageConfig(pluginId: string): unknown | undefined {
    // If no corePackagesConfig
    if (!this.mapFeaturesConfig.corePackagesConfig) return undefined;

    // Find first object in array that has the 'plugin' key
    const configObj = this.mapFeaturesConfig.corePackagesConfig.find((config) => pluginId in config);

    // If not found
    if (!configObj) return undefined;

    // Return it
    return configObj[pluginId];
  }

  /**
   * Returns the current display language
   * @returns {TypeDisplayLanguage} The display language
   */
  getDisplayLanguage(): TypeDisplayLanguage {
    return AppEventProcessor.getDisplayLanguage(this.mapId);
  }

  /**
   * Returns the current display theme
   * @returns {TypeDisplayTheme} The display theme
   */
  getDisplayTheme(): TypeDisplayTheme {
    return AppEventProcessor.getDisplayTheme(this.mapId);
  }

  /**
   * Returns the map current state information
   * @returns {TypeMapState} The map state
   */
  getMapState(): TypeMapState {
    // map state initialize with store data coming from configuration file/object.
    // updated values will be added by store subscription in map-event-processor
    return MapEventProcessor.getMapState(this.mapId);
  }

  /**
   * Gets the map viewSettings
   * @returns the map viewSettings
   */
  getView(): View {
    return this.map.getView();
  }

  /**
   * Set the map viewSettings (coordinate values in lon/lat)
   *
   * @param {TypeViewSettings} mapView - Map viewSettings object
   */
  setView(mapView: TypeViewSettings): void {
    const currentView = this.getView();
    const viewOptions: ViewOptions = {};
    viewOptions.projection = `EPSG:${mapView.projection}`;
    viewOptions.zoom = mapView.initialView?.zoomAndCenter ? mapView.initialView?.zoomAndCenter[0] : currentView.getZoom();
    viewOptions.center = mapView.initialView?.zoomAndCenter
      ? Projection.transformFromLonLat(mapView.initialView?.zoomAndCenter[1], Projection.getProjectionFromString(viewOptions.projection))
      : Projection.transformFromLonLat(
          Projection.transformToLonLat(currentView.getCenter()!, currentView.getProjection()),
          Projection.getProjectionFromString(viewOptions.projection)
        );
    viewOptions.minZoom = mapView.minZoom ? mapView.minZoom : currentView.getMinZoom();
    viewOptions.maxZoom = mapView.maxZoom ? mapView.maxZoom : currentView.getMaxZoom();
    viewOptions.rotation = mapView.rotation ? mapView.rotation : currentView.getRotation();
    if (mapView.maxExtent)
      viewOptions.extent = Projection.transformExtentFromProj(
        mapView.maxExtent,
        Projection.getProjectionLonLat(),
        Projection.getProjectionFromString(`EPSG:${mapView.projection}`)
      );

    const newView = new View(viewOptions);
    this.map.setView(newView);

    // Because the view has changed we must re-register the view handlers
    this.#registerViewHandlers(newView);
  }

  /**
   * Asynchronously gets the map center coordinate to give a chance for the map to
   * render before returning the value.
   * @returns {Promise<Coordinate>} the map center
   */
  getCenter(): Promise<Coordinate> {
    // When the getCenter() function actually returns a coordinate
    return whenThisThen(() => {
      return this.getView().getCenter()!;
    });
  }

  /**
   * Sets the map center.
   * @param {Coordinate} center - New center to use
   */
  setCenter(center: Coordinate): void {
    const currentView = this.getView();
    const transformedCenter = Projection.transformFromLonLat(center, currentView.getProjection());

    currentView.setCenter(transformedCenter);
  }

  /**
   * Asynchronously gets the map size to give a chance for the map to
   * render before returning the value.
   * @returns {Promise<Size>} The map size
   */
  getMapSize(): Promise<Size> {
    // When the getSize() function actually returns a coordinate
    return whenThisThen(() => {
      return this.map.getSize()!;
    });
  }

  /**
   * Asynchronously gets the map coordinate from pixel to give a chance for the map to
   * render before returning the value.
   * @param {[number, number]} pointXY - The pixel coordinate to convert
   * @param {number} timeoutMs - The maximum time in milliseconds to wait for the getCoordinateFromPixel to return a value.
   * @returns {Promise<Coordinate>} The map coordinate at the given pixel location
   */
  getCoordinateFromPixel(pointXY: [number, number], timeoutMs: number): Promise<Coordinate> {
    // When the getCoordinateFromPixel() function actually returns a coordinate
    return whenThisThen(() => {
      return this.map.getCoordinateFromPixel(pointXY);
    }, timeoutMs);
  }

  /**
   * Gets the map projection
   * @returns {OLProjection} The map projection
   */
  getProjection(): OLProjection {
    return this.getView().getProjection();
  }

  /**
   * Gets the ordered layer info.
   * @returns {TypeOrderedLayerInfo[]} The ordered layer info
   */
  getMapLayerOrderInfo(): TypeOrderedLayerInfo[] {
    return MapEventProcessor.getMapOrderedLayerInfo(this.mapId);
  }

  /**
   * Gets the i18nInstance for localization.
   * @returns {i18n[]} The i18n instance
   */
  getI18nInstance(): i18n {
    return this.#i18nInstance;
  }

  /**
   * set fullscreen / exit fullscreen
   *
   * @param status - Toggle fullscreen or exit fullscreen status
   * @param {HTMLElement | undefined} element - The element to toggle fullscreen on
   */
  setFullscreen(status: boolean, element: TypeHTMLElement | undefined): void {
    // TODO: Refactor - For reusability, this function should be static and moved to a browser-utilities class
    // TO.DOCONT: If we want to keep a function here, in MapViewer, it should just be a redirect to the browser-utilities'
    // enter fullscreen
    if (status && element) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('element.requestFullscreen', error);
        });
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
      // Store the extent before any size changes occur
      const currentExtent = this.getView().calculateExtent();
      const { currentZoom } = this.getMapState();
      let sizeChangeHandled = false; // Add flag to track if we've handled the size change

      // Store the extent and other relevant information
      const handleSizeChange = (): void => {
        if (sizeChangeHandled) return; // Skip if we've already handled it
        sizeChangeHandled = true; // Set flag to prevent multiple executions

        if (currentZoom < 5.5) this.setZoomLevel(currentZoom - 0.5);
        else
          this.zoomToExtent(currentExtent, { padding: [0, 0, 0, 0] })
            .then(() => {
              // Force render
              this.map.renderSync();

              // Remove the listener after handling
              this.map.un('change:size', handleSizeChange);
            })
            .catch((error: unknown) => {
              logger.logError('Error during zoom after fullscreen exit:', error);
            });
      };

      // Add the listener before exiting fullscreen
      this.map.on('change:size', handleSizeChange);
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('document.exitFullscreen', error);
        });
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
   * @param {TypeInteraction} interaction - Map interaction
   */
  setInteraction(interaction: TypeInteraction): void {
    MapEventProcessor.setInteraction(this.mapId, interaction);
  }

  /**
   * Set the display language of the map
   *
   * @param {TypeDisplayLanguage} displayLanguage - The language to use (en, fr)
   * @param {boolean} resetLayer - Optional flag to ask viewer to reload layers with the new localize language
   * @returns {Promise<void>}
   */
  async setLanguage(displayLanguage: TypeDisplayLanguage, reloadLayers?: boolean | false): Promise<void> {
    // If the language hasn't changed don't do anything
    if (AppEventProcessor.getDisplayLanguage(this.mapId) === displayLanguage) return;
    if (VALID_DISPLAY_LANGUAGE.includes(displayLanguage)) {
      await AppEventProcessor.setDisplayLanguage(this.mapId, displayLanguage);

      // if flag is true, reload just the GeoCore layers instead of reloading the whole map with current state
      if (reloadLayers) {
        this.layer.reloadGeocoreLayers();
      }

      // Emit language changed event
      this.#emitMapLanguageChanged({ language: displayLanguage });
      return;
    }

    // Unsupported
    this.notifications.addNotificationError(getLocalizedMessage(displayLanguage, 'validation.changeDisplayLanguage'));
  }

  /**
   * Set the display projection of the map
   *
   * @param {TypeValidMapProjectionCodes} projectionCode - The projection code (3978, 3857)
   * @returns {Promise<void>}
   */
  setProjection(projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    if (VALID_PROJECTION_CODES.includes(Number(projectionCode))) {
      // Propagate to the store
      const promise = MapEventProcessor.setProjection(this.mapId, projectionCode);

      // Emit to outside
      this.#emitMapProjectionChanged({ projection: Projection.PROJECTIONS[projectionCode] });

      // Return the promise
      return promise;
    }

    // Unsupported
    this.notifications.addNotificationError('validation.changeDisplayProjection');
    return Promise.resolve();
  }

  /**
   * Rotates the view to align it at the given degrees
   *
   * @param {number} degree - The degrees to rotate the map to
   */
  rotate(degree: number): void {
    // Rotate the view, the store will get updated via this.#handleMapRotation listener
    this.getView().animate({ rotation: degree });
  }

  /**
   * Set the display theme of the map
   *
   * @param {TypeDisplayTheme} displayTheme - The theme to use (geo.ca, light, dark)
   */
  setTheme(displayTheme: TypeDisplayTheme): void {
    if (VALID_DISPLAY_THEME.includes(displayTheme)) {
      AppEventProcessor.setDisplayTheme(this.mapId, displayTheme);
    } else this.notifications.addNotificationError(getLocalizedMessage(this.getDisplayLanguage(), 'validation.changeDisplayTheme'));
  }

  /**
   * Set the map zoom level.
   *
   * @param {number} zoom - New zoom level
   */
  setZoomLevel(zoom: number): void {
    this.getView().setZoom(zoom);
  }

  /**
   * Set the minimum map zoom level.
   *
   * @param {number} zoom - New minimum zoom level
   */
  setMinZoomLevel(zoom: number): void {
    this.getView().setMinZoom(zoom);
  }

  /**
   * Set the maximum map zoom level.
   *
   * @param {number} zoom - New maximum zoom level
   */
  setMaxZoomLevel(zoom: number): void {
    this.getView().setMaxZoom(zoom);
  }

  /**
   * Set map extent.
   * @param {Extent} extent - New extent to zoom to.
   * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
   */
  setExtent(extent: Extent): Promise<void> {
    return MapEventProcessor.zoomToExtent(this.mapId, extent);
  }

  /**
   * Set the maximum extent of the map.
   *
   * @param {Extent} extent - New extent to use.
   */
  setMaxExtent(extent: Extent): void {
    const currentView = this.getView();

    // create new view settings
    const newView: TypeViewSettings = {
      initialView: {
        zoomAndCenter: [
          currentView.getZoom() as number,
          this.convertCoordinateLonLatToMapProj(currentView.getCenter()!) as [number, number],
        ],
      },
      minZoom: currentView.getMinZoom(),
      maxZoom: currentView.getMaxZoom(),
      maxExtent: Projection.transformExtentFromProj(extent, Projection.getProjectionLonLat(), currentView.getProjection()),
      projection: currentView.getProjection().getCode().split(':')[1] as unknown as TypeValidMapProjectionCodes,
    };

    this.setView(newView);
  }

  // #endregion

  // #region MAP ACTIONS

  /**
   * Add a new custom component to the map
   *
   * @param {string} mapComponentId - An id to the new component
   * @param {JSX.Element} component - The component to add
   */
  addComponent(mapComponentId: string, component: JSX.Element): void {
    if (mapComponentId && component) {
      // emit an event to add the component
      this.#emitMapComponentAdded({ mapComponentId, component });
    }
  }

  /**
   * Remove an existing custom component from the map
   *
   * @param mapComponentId - The id of the component to remove
   */
  removeComponent(mapComponentId: string): void {
    if (mapComponentId) {
      // emit an event to add the component
      this.#emitMapComponentRemoved({ mapComponentId });
    }
  }

  /**
   * Add a localization ressource bundle for a supported language (fr, en). Then the new key added can be
   * access from the utilies function getLocalizesMessage to reuse in ui from outside the core viewer.
   *
   * @param {TypeDisplayLanguage} language - The language to add the ressoruce for (en, fr)
   * @param {Record<string, unknown>} translations - The translation object to add
   */
  addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: Record<string, unknown>): void {
    this.#i18nInstance.addResourceBundle(language, 'translation', translations, true, false);
  }

  /**
   * Emits a map single click event.
   * @param {MapSingleClickEvent} clickCoordinates - The clicked coordinates to emit.
   */
  emitMapSingleClick(clickCoordinates: MapSingleClickEvent): void {
    // Emit the event
    this.#emitMapSingleClick(clickCoordinates);
  }

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification which may affect rendering.
   */
  refreshLayers(): void {
    // Redirect
    this.layer.refreshLayers();
  }

  /**
   * Hide a click marker from the map
   */
  clickMarkerIconHide(): void {
    // Redirect to the processor
    MapEventProcessor.clickMarkerIconHide(this.mapId);
  }

  /**
   * Show a marker on the map
   * @param {TypeClickMarker} marker - The marker to add
   */
  clickMarkerIconShow(marker: TypeClickMarker): void {
    // Redirect to the processor
    MapEventProcessor.clickMarkerIconShow(this.mapId, marker);
  }

  /**
   * Deletes the MapViewer, including its plugins, layers, etc.
   * This function does not unmount the MapViewer. To completely delete a MapViewer, use
   * cgpv.api.deleteMapViewer() which will delete the MapViewer and unmount it - for React.
   */
  async delete(): Promise<void> {
    // Remove the dom element (remove rendered map and overview map)
    if (this.overviewRoot) this.overviewRoot.unmount();

    try {
      // Remove all layers
      this.layer.removeAllGeoviewLayers();
    } catch (error: unknown) {
      // Failed to remove layers, eat the exception and continue to remove the map
      logger.logError('Failed to remove layers', error);
    }

    // Unload all plugins
    await Plugin.removePlugins(this.mapId);

    // Remove all controls
    this.map.getControls().clear();

    // Remove all interactions
    this.map.getInteractions().clear();

    // Unset the map target to remove the DOM link
    this.map.setTarget(undefined);
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {Extent} extent - The extent to zoom to.
   * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
   */
  zoomToExtent(extent: Extent, options?: FitOptions): Promise<void> {
    // TODO: Discussion - Where is the line between a function using MapEventProcessor in MapViewer vs in MapState action?
    // TO.DOCONT: This function (and there are many others in this class) redirects to the MapEventProcessor, should it be in MapState with the others or do we keep some in MapViewer and some in MapState?
    // TO.DOCONT: If we keep some, we should maybe add a fourth call-stack possibility in the MapEventProcessor paradigm documentation.
    // Redirect to the processor
    return MapEventProcessor.zoomToExtent(this.mapId, extent, options);
  }

  /**
   * Update nav bar home button view settings.
   * @param {TypeMapViewSettings} view - The new view settings.
   */
  setHomeButtonView(view: TypeMapViewSettings): void {
    // Redirect to the processor
    MapEventProcessor.setHomeButtonView(this.mapId, view);
  }

  /**
   * Zoom to specified extent or coordinate provided in lonlat.
   *
   * @param {Extent | Coordinate} extent - The extent or coordinate to zoom to.
   * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   * @returns {Promise<void>} A promise that resolves when the zoom operation completes.
   */
  zoomToLonLatExtentOrCoordinate(extent: Extent | Coordinate, options?: FitOptions): Promise<void> {
    const fullExtent = extent.length === 2 ? [extent[0], extent[1], extent[0], extent[1]] : extent;
    const projectedExtent = Projection.transformExtentFromProj(fullExtent, Projection.getProjectionLonLat(), this.getProjection());
    return MapEventProcessor.zoomToExtent(this.mapId, projectedExtent, options);
  }

  /**
   * Update the size of the icon image list based on styles.
   * @param {TypeLegend} legend - The legend to check.
   */
  updateIconImageCache(legend: TypeLegend): void {
    // GV This will need to be revised if functionality to add additional icons to a layer is added
    let styleCount = this.iconImageCacheSize;
    if (legend.styleConfig)
      Object.keys(legend.styleConfig).forEach((geometry) => {
        if (
          legend.styleConfig &&
          (legend.styleConfig[geometry as TypeStyleGeometry]?.type === 'uniqueValue' ||
            legend.styleConfig[geometry as TypeStyleGeometry]?.type === 'classBreaks')
        ) {
          if (legend.styleConfig[geometry as TypeStyleGeometry]!.info?.length)
            styleCount += legend.styleConfig[geometry as TypeStyleGeometry]!.info.length;
        }
      });
    // Set the openlayers icon image cache
    iconImageCache.setSize(styleCount);
    // Update the cache size for the map viewer
    this.iconImageCacheSize = styleCount;
  }

  /**
   * Waits until all GeoView layers reach the specified status before resolving the promise.
   * This function repeatedly checks whether all layers have reached the given `layerStatus`.
   * @param {TypeLayerStatus} layerStatus - The desired status to wait for (e.g., 'loaded', 'processed').
   * @returns {Promise<number>} A promise that resolves with the number of layers that have reached the specified status.
   */
  async waitAllLayersStatus(layerStatus: TypeLayerStatus): Promise<number> {
    // Log
    logger.logInfo(`Waiting on layers to become ${layerStatus}`);

    // Wait for the layers to get the layerStatus required
    let layersCount = 0;
    await whenThisThen(
      () => {
        // Check if all layers have met the status
        const [allGood, layersCountInside] = this.layer.checkLayerStatus(layerStatus, (layerConfig) => {
          // Log
          logger.logTraceDetailed(
            `checkMapReady - waiting on layer to be '${layerStatus}'...`,
            layerConfig.layerPath,
            layerConfig.layerStatus
          );
        });

        // Update the count
        layersCount = layersCountInside;

        // Return if all good
        return allGood;
      },
      MapViewer.#MAX_DELAY_TO_WAIT_ON_MAP,
      250
    );

    // Return the number of layers meeting the status
    return layersCount;
  }

  // #endregion

  // #region MAP INTERACTIONS

  /**
   * Initializes selection interactions
   */
  initSelectInteractions(): Select {
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
  initExtentInteractions(): ExtentInteraction {
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
  initTranslateInteractions(): Translate {
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
   * Initializes translation interactions without requireing the extra selection click.
   * Note: This will limit translation interactions to one feature at a time.
   */
  initTranslateOneFeatureInteractions(): Translate {
    // Create translating capabilities
    const translate = new Translate({
      mapViewer: this,
    });
    translate.startInteraction();
    return translate;
  }

  /**
   * Initializes drawing interactions on the given vector source
   * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
   * @param {string} type - The type of geometry to draw (Polygon, LineString, Circle, etc)
   * @param {TypeFeatureStyle} styles - The styles for the drawing
   */
  initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle, geometryFunction?: GeometryFunction): Draw {
    // Create the Draw component
    const draw = new Draw({
      mapViewer: this,
      geometryGroupKey: geomGroupKey,
      type,
      style,
      geometryFunction,
    });
    draw.startInteraction();
    return draw;
  }

  /**
   * Initializes modifying interactions on the given vector source
   * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
   */
  initModifyInteractions(
    geomGroupKey: string,
    style?: TypeFeatureStyle,
    insertVertexCondition?: Condition,
    pixelTolerance?: number
  ): Modify {
    // Create the modify component
    const modify = new Modify({
      mapViewer: this,
      geometryGroupKey: geomGroupKey,
      style,
      insertVertexCondition,
      pixelTolerance,
    });
    modify.startInteraction();
    return modify;
  }

  /**
   * Initializes snapping interactions on the given vector source
   * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
   */
  initSnapInteractions(geomGroupKey: string): Snap {
    // Create snapping capabilities
    const snap = new Snap({
      mapViewer: this,
      geometryGroupKey: geomGroupKey,
    });
    snap.startInteraction();
    return snap;
  }

  /**
   * Initializes transform interactions for feature manipulation
   * @param {TransformOptions} options - Options for the transform interaction
   */
  initTransformInteractions(options?: Partial<TransformOptions>): Transform {
    // Create transform capabilities
    const transform = new Transform({
      mapViewer: this,
      ...options,
    });
    transform.startInteraction();
    return transform;
  }

  // #endregion

  // #region OTHERS

  /**
   * Gets if north is visible. This is not a perfect solution and is more a work around
   *
   * @returns {Promise<boolean>} true if visible, false otherwise
   */
  async getNorthVisibility(): Promise<boolean> {
    // Check the container value for top middle of the screen
    // Convert this value to a lat long coordinate
    const size = await this.getMapSize();
    const pointXY: [number, number] = [size[0] / 2, 1];

    // GV: Sometime, the getCoordinateFromPixel return null... use await
    const pixel = await this.getCoordinateFromPixel(pointXY, MapViewer.INIT_TIMEOUT_NORTH_VISIBILITY);
    const pt = Projection.transformToLonLat(pixel, this.getView().getProjection());

    // If user is pass north, long value will start to be positive (other side of the earth).
    // This will work only for LCC Canada.
    return pt ? pt[0] > 0 : true;
  }

  /**
   * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection
   * https://www.movable-type.co.uk/scripts/latlong.html
   *
   * @returns {string} the arrow angle
   */
  getNorthArrowAngle(): string {
    try {
      // north value
      const pointA = { x: NORTH_POLE_POSITION[1], y: NORTH_POLE_POSITION[0] };

      // map center (we use botton parallel to introduce less distortion)
      const extent = this.getView().calculateExtent();
      const center: Coordinate = Projection.transformToLonLat([(extent[0] + extent[2]) / 2, extent[1]], this.getView().getProjection());
      const pointB = { x: center[0], y: center[1] };

      // set info on longitude and latitude
      const dLon = ((pointB.x - pointA.x) * Math.PI) / 180;
      const lat1 = (pointA.y * Math.PI) / 180;
      const lat2 = (pointB.y * Math.PI) / 180;

      // calculate bearing
      const y = Math.sin(dLon) * Math.cos(lat2);
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
      const bearing = (Math.atan2(y, x) * 180) / Math.PI;

      // return angle (180 is pointing north)
      return ((bearing + 360) % 360).toFixed(1);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return '180.0';
    }
  }

  /**
   * Transforms coordinate from LonLat to the current projection of the map.
   * @param {Coordinate} coordinate - The LonLat coordinate
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateLonLatToMapProj(coordinate: Coordinate): Coordinate {
    // Redirect
    return this.convertCoordinateFromProjToMapProj(coordinate, Projection.getProjectionLonLat());
  }

  /**
   * Transforms coordinate from current projection of the map to LonLat.
   * @param {Coordinate} coordinate - The coordinate in map projection
   * @returns {Coordinate} The coordinate in LonLat
   */
  convertCoordinateMapProjToLonLat(coordinate: Coordinate): Coordinate {
    // Redirect
    return this.convertCoordinateFromMapProjToProj(coordinate, Projection.getProjectionLonLat());
  }

  /**
   * Transforms extent from LonLat to the current projection of the map.
   * @param {Extent} extent - The LonLat extent
   * @param {number} stops - The number of stops to perform densification on the extent
   * @returns {Extent} The extent in the map projection
   */
  convertExtentLonLatToMapProj(extent: Extent, stops: number = MapViewer.DEFAULT_STOPS): Extent {
    // Redirect
    return this.convertExtentFromProjToMapProj(extent, Projection.getProjectionLonLat(), stops);
  }

  /**
   * Transforms extent from current projection of the map to LonLat.
   * @param {Extent} extent - The extent in map projection
   * @returns {Extent} The extent in LonLat
   */
  convertExtentMapProjToLonLat(extent: Extent): Extent {
    // Redirect
    return this.convertExtentFromMapProjToProj(extent, Projection.getProjectionLonLat());
  }

  /**
   * Transforms coordinate from given projection to the current projection of the map.
   * @param {Coordinate} coordinate - The given coordinate
   * @param {OLProjection} fromProj - The projection of the given coordinate
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateFromProjToMapProj(coordinate: Coordinate, fromProj: OLProjection): Coordinate {
    // If different projections
    if (fromProj.getCode() !== this.getProjection().getCode()) {
      return Projection.transform(coordinate, fromProj, this.getProjection());
    }

    // Same projection
    return coordinate;
  }

  /**
   * Transforms coordinate from map projection to given projection.
   * @param {Coordinate} coordinate - The given coordinate
   * @param {OLProjection} toProj - The projection that should be output
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateFromMapProjToProj(coordinate: Coordinate, toProj: OLProjection): Coordinate {
    // If different projections
    if (toProj.getCode() !== this.getProjection().getCode()) {
      return Projection.transform(coordinate, this.getProjection(), toProj);
    }

    // Same projection
    return coordinate;
  }

  /**
   * Transforms extent from given projection to the current projection of the map.
   * @param {Extent} extent - The given extent
   * @param {OLProjection} fromProj - The projection of the given extent
   * @param {number} stops - The number of stops to perform densification on the extent
   * @returns {Extent} The extent in the map projection
   */
  convertExtentFromProjToMapProj(extent: Extent, fromProj: OLProjection, stops: number = MapViewer.DEFAULT_STOPS): Extent {
    // If different projections
    if (fromProj.getCode() !== this.getProjection().getCode()) {
      return Projection.transformExtentFromProj(extent, fromProj, this.getProjection(), stops);
    }

    // Same projection
    return extent;
  }

  /**
   * Transforms extent from map projection to given projection. If the projects are the same, the extent is simply returned.
   * @param {Extent} extent - The given extent
   * @param {OLProjection} toProj - The projection that should be output
   * @returns {Extent} The extent in the map projection
   */
  convertExtentFromMapProjToProj(extent: Extent, toProj: OLProjection, stops: number = MapViewer.DEFAULT_STOPS): Extent {
    // If different projections
    if (toProj.getCode() !== this.getProjection().getCode()) {
      return Projection.transformExtentFromProj(extent, this.getProjection(), toProj, stops);
    }

    // Same projection
    return extent;
  }

  /**
   * Creates a map config based on current map state.
   * @param {BooleanExpression} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   *                                                         Set to false after a language change to update the layer names with the new language.
   * @returns {TypeMapFeaturesInstance | undefined} Map config with current map state.
   */
  createMapConfigFromMapState(overrideGeocoreServiceNames: boolean | 'hybrid' = true): TypeMapFeaturesInstance | undefined {
    return MapEventProcessor.createMapConfigFromMapState(this.mapId, overrideGeocoreServiceNames);
  }

  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   * @param {string[][]} namePairs -  The array of name pairs. Presumably one english and one french name in each pair.
   * @param {TypeMapFeaturesInstance} mapConfig - The config to modify, or one created using the current map state if not provided.
   * @param {boolean} removeUnlisted - Whether or not names not provided should be removed from config.
   * @returns {TypeMapFeaturesInstance} Map config with updated names.
   */
  replaceMapConfigLayerNames(
    namePairs: string[][],
    mapConfig?: TypeMapFeaturesConfig,
    removeUnlisted: boolean = false
  ): TypeMapFeaturesInstance | undefined {
    const mapConfigToUse = mapConfig || this.createMapConfigFromMapState();
    if (mapConfigToUse) return MapEventProcessor.replaceMapConfigLayerNames(namePairs, mapConfigToUse, removeUnlisted);
    return undefined;
  }

  /**
   * Register map handlers on view initialization.
   * @param {OLMap} map - Map to register events on
   */
  #registerMapHandlers(map: OLMap): void {
    // If map isn't static
    this.registerMapPointerHandlers(map);

    // Register mouse interaction events. On mouse enter or leave, focus or blur the map container
    const mapHTMLElement = map.getTargetElement();
    mapHTMLElement.addEventListener('mouseenter', () => {
      mapHTMLElement.focus({ preventScroll: true });
      MapEventProcessor.setIsMouseInsideMap(this.mapId, true);
    });
    mapHTMLElement.addEventListener('mouseleave', () => {
      mapHTMLElement.blur();
      MapEventProcessor.setIsMouseInsideMap(this.mapId, false);
    });

    // Now that the map dom is loaded, register a handle when size is changing
    map.on('change:size', this.#handleMapChangeSize.bind(this));

    // Register essential map-view handlers
    map.on('moveend', this.#handleMapMoveEnd.bind(this));
  }

  /**
   * Register handlers on pointer move and map single click
   * @param {OLMap} map - Map to register events on
   */
  registerMapPointerHandlers(map: OLMap): void {
    if (this.mapFeaturesConfig.map.interaction !== 'static') {
      this.#pointerHandlersEnabled = true;
      map.on('pointermove', this.#boundedHandleMapPointerMove);
      map.on('pointermove', this.#boundedHandleMapPointerStoppedDebounced);
      map.on('singleclick', this.#boundedHandleMapSingleClickDebounced);
    }
  }

  /**
   * Unregister handlers on pointer move and map single click
   * @param {OLMap} map - Map to unregister events on
   */
  unregisterMapPointerHandlers(map: OLMap): void {
    if (this.mapFeaturesConfig.map.interaction !== 'static') {
      this.#pointerHandlersEnabled = false;
      map.un('pointermove', this.#boundedHandleMapPointerMove);
      map.un('pointermove', this.#boundedHandleMapPointerStoppedDebounced);
      map.un('singleclick', this.#boundedHandleMapSingleClickDebounced);
    }
  }

  /**
   * Register view handlers on view initialization.
   * @param {View} view - View to register events on
   */
  #registerViewHandlers(view: View): void {
    // Register essential view handlers
    view.on('change:resolution', debounce(this.#handleMapZoomEnd.bind(this), 100).bind(this));
    view.on('change:rotation', debounce(this.#handleMapRotation.bind(this), 100).bind(this));
  }

  /**
   * Handles when the map ends moving
   * @param {MapEvent} event - The map event associated with the ending of the map movement
   * @returns {Promise<void>} Promise when done processing the map move
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async #handleMapMoveEnd(event: MapEvent): Promise<void> {
    try {
      // Update the store
      await this.#updateMapControls();

      // Emit to the outside
      this.#emitMapMoveEnd({ lonlat: this.getView().getCenter()! });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapMoveEnd', error);
    }
  }

  /**
   * Handles when the map pointer moves
   * @param {MapEvent} event - The map event associated with the map pointer movement
   * @private
   */
  #handleMapPointerMove(event: MapBrowserEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = getPointerPositionFromMapEvent(event, projCode);

      // Save in the store
      MapEventProcessor.setMapPointerPosition(this.mapId, pointerPosition);

      // Emit to the outside
      this.#emitMapPointerMove(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapPointerMove', error);
    }
  }

  /**
   * Handles when the map pointer stops
   * @param {MapEvent} event - The map event associated with the map pointer movement
   * @private
   */
  #handleMapPointerStopped(event: MapBrowserEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = getPointerPositionFromMapEvent(event, projCode);

      // Emit to the outside
      this.#emitMapPointerStop(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapPointerStopped', error);
    }
  }

  /**
   * Handles when the map received a single click
   * @param {MapEvent} event - The map event associated with the map single click
   * @private
   */
  #handleMapSingleClick(event: MapBrowserEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = getPointerPositionFromMapEvent(event, projCode);

      // Save in the store
      MapEventProcessor.setClickCoordinates(this.mapId, pointerPosition);

      // Emit to the outside
      this.#emitMapSingleClick(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapSingleClick', error);
    }
  }

  /**
   * Handles when the map zoom ends
   * @param {ObjectEvent} event - The event associated with the zoom end
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapZoomEnd(event: ObjectEvent): void {
    try {
      // Read the zoom value
      const zoom = this.getView().getZoom();
      if (!zoom) return;

      // Get new inVisibleRange values for all layers
      const newOrderedLayerInfo = this.getMapLayerOrderInfo();

      const visibleRangeLayers: string[] = [];
      const allLayers = this.layer.getGeoviewLayers();

      // Get the inVisibleRange property based on the layer's minZoom and maxZoom values
      allLayers.forEach((layer) => {
        const layerPath = layer.getLayerPath();
        let inVisibleRange = layer.inVisibleRange(zoom);

        // Group layer maxZoom and minZoom are never set so that the sub layers can load
        // This means that the "inVisibleRange" method will always return "true".
        // To get around this, the inVisibleRange for groups is set based on the sub layer visibility
        if (layer instanceof GVGroupLayer) {
          const childLayers = allLayers.filter((childLayer) => {
            const childPath = childLayer.getLayerPath();
            return childPath.startsWith(`${layerPath}/`) && !(childLayer instanceof GVGroupLayer);
          });

          // Group is in visible range if any child is visible
          inVisibleRange = childLayers.some((childLayer) => childLayer.inVisibleRange(zoom));
        }

        const foundLayer = newOrderedLayerInfo.find((info) => info.layerPath === layerPath);
        if (foundLayer) foundLayer.inVisibleRange = inVisibleRange;
        if (inVisibleRange) {
          visibleRangeLayers.push(layerPath);
        }
      });

      // Save in the store
      MapEventProcessor.setZoom(this.mapId, zoom);
      MapEventProcessor.setMapOrderedLayerInfo(this.mapId, newOrderedLayerInfo);

      // Emit to the outside
      this.#emitMapZoomEnd({ zoom });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapZoomEnd', error);
    }
  }

  /**
   * Handles when the map rotates
   * @param {ObjectEvent} event - The event associated with rotation
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapRotation(event: ObjectEvent): void {
    try {
      // Get the map rotation
      const rotation = this.getView().getRotation();

      // Save in the store
      MapEventProcessor.setRotation(this.mapId, rotation);

      // Emit to the outside
      this.#emitMapRotation({ rotation });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapRotation', error);
    }
  }

  /**
   * Handles when the map changes size
   * @param {ObjectEvent} event - The event associated with rotation
   * @returns {Promise<void>} Promise when done processing the map change size
   * @private
   */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async #handleMapChangeSize(event: ObjectEvent): Promise<void> {
    try {
      // Get the scale information
      const scale = MapEventProcessor.getScaleInfoFromDomElement(this.mapId);

      // Get the size
      const size = await this.getMapSize();

      // Save in the store
      MapEventProcessor.setMapSize(this.mapId, size);
      MapEventProcessor.setMapScale(this.mapId, scale);

      // Emit to the outside
      this.#emitMapChangeSize({ size });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapChangeSize', error);
    }
  }

  /**
   * Check if geometries needs to be loaded from a URL geoms parameter
   */
  #loadGeometries(): void {
    // Create the geometry group
    this.layer.geometry.createGeometryGroup(this.layer.geometry.defaultGeometryGroupId);

    // see if a data geometry endpoint is configured and geoms param is provided then get the param value(s)
    const servEndpoint = this.map.getTargetElement()?.closest('.geoview-map')?.getAttribute('data-geometry-endpoint') || '';
    const parsed = queryString.parse(location.search);

    if (parsed.geoms && servEndpoint !== '') {
      const geoms = (parsed.geoms as string).split(',');

      // for the moment, only polygon are supported but if need be, other geometries can easely be use as well
      geoms.forEach((key: string) => {
        Fetch.fetchJson<GeometryJsonResponse>(`${servEndpoint}${key}`)
          .then((data) => {
            if (data.geometry !== undefined) {
              // add the geometry
              // TODO: use the geometry as GeoJSON and add properties to by queried by the details panel
              this.layer.geometry.addPolygon(data.geometry.coordinates, undefined, generateId());
            }
          })
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('fetchJson in loadGeometry in MapViewer', error);
          });
      });
    }
  }

  /**
   * Function called to monitor when the map is actually ready.
   * @private
   */
  async #readyMap(): Promise<void> {
    // Log
    logger.logInfo(`Map is ready. Layers are still being processed... 1`, this.mapId);

    // Log Marker Start
    logger.logMarkerStart(`readyMap-${this.mapId}`);

    // Load the guide
    AppEventProcessor.setGuide(this.mapId).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in AppEventProcessor.setGuide in #readyMap', error);
    });

    // Check how load in milliseconds has it been processing thus far
    const elapsedMilliseconds = Date.now() - this.#checkMapReadyStartTime!;

    // Wait at least the minimum delay before officializing the map as loaded for the UI
    await delay(MapViewer.#MIN_DELAY_LOADING - elapsedMilliseconds); // Negative value will simply resolve immediately

    // Save in the store that the map is loaded
    // GV This removes the spinning circle overlay and starts showing the map correctly in the html dom
    MapEventProcessor.setMapLoaded(this.mapId, true);

    // Save in the store that the map is properly being displayed now
    MapEventProcessor.setMapDisplayed(this.mapId);

    // Update the map controls based on the original map state (equivalent of initMapControls, just later in the process)
    await this.#updateMapControls();

    // Is ready
    this.#mapReady = true;
    this.#emitMapReady();

    // Register the map handlers
    this.#registerMapHandlers(this.map);

    // Register the view handlers
    this.#registerViewHandlers(this.getView());

    // Await for all layers to be 'processed'
    await this.#checkMapLayersProcessed();

    // Zoom to extent if necessary, but don't wait for it
    this.#zoomOnExtentMaybe().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in #zoomOnExtentMaybe in #readyMap', error);
    });

    // If there's a layer path that should be selected in footerBar or appBar configs, select it
    const selectedLayerPath =
      this.mapFeaturesConfig.footerBar?.selectedLayersLayerPath || this.mapFeaturesConfig.appBar?.selectedLayersLayerPath;
    if (selectedLayerPath) LegendEventProcessor.setSelectedLayersTabLayer(this.mapId, selectedLayerPath);

    // Await for all layers to be 'loaded'
    await this.#checkMapLayersLoaded();

    // Zoom on layers ids, if necessary, but don't wait for it
    this.#zoomOnLayerIdsMaybe().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in #zoomOnLayerIdsMaybe in #readyMap', error);
    });

    // Create and dispatch the resolution change event to force the registration of layers in the
    // inVisibleRange array when layers are loaded.
    // This is to trigger a 'this.#handleMapZoomEnd' once layers are loaded
    this.getView().dispatchEvent(new ObjectEvent('change:resolution', 'visibleRange', null));
  }

  /**
   * Load the core packages plugins
   * @returns Promise when all core packages plugins will be loaded
   */
  #loadCorePackages(): Promise<void[]> {
    // Load the core packages which are the ones who load on map (not footer plugin, not app-bar plugin)
    const promises: Promise<void>[] = [];
    this.mapFeaturesConfig?.corePackages?.forEach((corePackage: string): void => {
      // Create promise
      const promise = new Promise<void>((resolve, reject) => {
        Plugin.loadScript(corePackage)
          .then((typePlugin) => {
            // add the plugin by passing in the loaded constructor from the script tag
            Plugin.addPlugin(corePackage, typePlugin, this.mapId)
              .then(() => {
                // Plugin added
                resolve();
              })
              .catch((error: unknown) => {
                // Reject
                reject(formatError(error));
              });
          })
          .catch((error: unknown) => {
            // Reject
            reject(formatError(error));
          });
      });

      // Compile
      promises.push(promise);
    });

    // Await all
    return Promise.all(promises);
  }

  /**
   * Updates the map controls (the store) based on the current map view state.
   */
  async #updateMapControls(): Promise<void> {
    // Get the center coordinates (await in case the map isn't fully rendered yet)
    const centerCoordinates = await this.getCenter();

    // Get the projection code
    const projCode = this.getView().getProjection().getCode();

    // Get the pointer position
    const pointerPosition = {
      projected: centerCoordinates,
      pixel: this.map.getPixelFromCoordinate(centerCoordinates),
      lonlat: Projection.transformPoints([centerCoordinates], projCode, Projection.PROJECTION_NAMES.LONLAT)[0],
      dragging: false,
    };

    // Get the degree rotation
    const degreeRotation = this.getNorthArrowAngle();

    // Get the north visibility
    const isNorthVisible = await this.getNorthVisibility();

    // Get the map Extent
    const extent = this.getView().calculateExtent();

    // Get the scale information
    const scale = MapEventProcessor.getScaleInfoFromDomElement(this.mapId);

    // Save in the store
    MapEventProcessor.setMapMoveEnd(this.mapId, centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, extent, scale);
  }

  /**
   * Zooms the map on the to the extents of specified layers once they are fully loaded or to the extent specified in initialView and do so right away.
   * - If `initialView.extent` is defined, it tries to create the extent and zoom on it.
   * - If `initialView.extent` is undefined, it won't do anything.
   * @private
   */
  #zoomOnExtentMaybe(): Promise<void> {
    // Zoom to extents of layers selected in config, if provided
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.extent) {
      // Not zooming on layers, but we have an extent to zoom to instead
      // If extent is not lon/lat, we assume it is in the map projection and use it as is.
      const extent = isExtentLonLat(this.mapFeaturesConfig.map.viewSettings.initialView.extent)
        ? this.convertExtentLonLatToMapProj(this.mapFeaturesConfig.map.viewSettings.initialView.extent as Extent)
        : this.mapFeaturesConfig.map.viewSettings.initialView.extent;

      // Zoom to extent
      return this.zoomToExtent(extent, {
        padding: [0, 0, 0, 0],
      });
    }

    // No zoom to do, resolve
    return Promise.resolve();
  }

  /**
   * Zooms the map on the to the extents of specified layers.
   * The layers must be 'loaded' before calling this function.
   * - If `initialView.layerIds` is defined and non-empty, it will use those layers for the zoom target.
   * - If `initialView.layerIds` is defined and empty, all available GeoView layers will be used.
   * - Else, no zoom to layer ids is done.
   * @private
   */
  #zoomOnLayerIdsMaybe(): Promise<void> {
    // If the layerIds property in initialView is defined
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.layerIds) {
      // If the layerIds array is empty, use all layers
      const layerIdsToZoomTo = this.mapFeaturesConfig.map.viewSettings.initialView.layerIds.length
        ? this.mapFeaturesConfig.map.viewSettings.initialView.layerIds
        : this.layer.getGeoviewLayerIds();

      let layerExtents = this.layer.getExtentOfMultipleLayers(layerIdsToZoomTo);

      // If extents have infinity, use default instead
      if (layerExtents.includes(Infinity))
        layerExtents = this.convertExtentLonLatToMapProj(MAP_EXTENTS[this.mapFeaturesConfig.map.viewSettings.projection]);

      // Zoom to calculated extent
      if (layerExtents.length) {
        // Zoom on the layers extents
        return this.zoomToExtent(layerExtents);
      }
    }

    // No zoom to do, resolve
    return Promise.resolve();
  }

  /**
   * Function called to monitor when the map has its layers in processed state.
   * @private
   */
  async #checkMapLayersProcessed(): Promise<void> {
    // When all layers are processed
    const layersCount = await this.waitAllLayersStatus('processed');

    // Log
    logger.logInfo(`Map is ready with ${layersCount} processed layer entries`, this.mapId);
    logger.logMarkerCheck(`readyMap-${this.mapId}`, `for all ${layersCount} layer entries to be processed`);

    // Is ready
    this.#mapLayersProcessed = true;
    this.#emitMapLayersProcessed();
  }

  /**
   * Function called to monitor when the map has its layers in loaded state.
   * @private
   */
  async #checkMapLayersLoaded(): Promise<void> {
    // When all layers are loaded
    const layersCount = await this.waitAllLayersStatus('loaded');

    // Log
    logger.logInfo(`Map is ready with ${layersCount} loaded layer entries`, this.mapId);
    logger.logMarkerCheck(`readyMap-${this.mapId}`, `for all ${layersCount} layer entries to be loaded`);

    // Is ready
    this.#mapLayersLoaded = true;
    this.#emitMapLayersLoaded();
  }

  // #endregion

  // #region EVENTS

  /**
   * Emits a map init event to all handlers.
   * @private
   */
  #emitMapInit(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapInitHandlers, undefined);
  }

  /**
   * Registers a map init event callback.
   * @param {MapInitDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapInit(callback: MapInitDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapInitHandlers, callback);
  }

  /**
   * Unregisters a map init event callback.
   * @param {MapInitDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapInit(callback: MapInitDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapInitHandlers, callback);
  }

  /**
   * Emits a map ready event to all handlers.
   * @private
   */
  #emitMapReady(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapReadyHandlers, undefined);
  }

  /**
   * Registers a map ready event callback.
   * @param {MapReadyDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapReady(callback: MapReadyDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapReadyHandlers, callback);
  }

  /**
   * Unregisters a map ready event callback.
   * @param {MapReadyDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapReady(callback: MapReadyDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapReadyHandlers, callback);
  }

  /**
   * Emits a map layers processed event to all handlers.
   * @private
   */
  #emitMapLayersProcessed(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapLayersProcessedHandlers, undefined);
  }

  /**
   * Registers a map layers processed event callback.
   * @param {MapLayersProcessedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapLayersProcessed(callback: MapLayersProcessedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapLayersProcessedHandlers, callback);
  }

  /**
   * Unregisters a map layers processed event callback.
   * @param {MapLayersProcessedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapLayersProcessed(callback: MapLayersProcessedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapLayersProcessedHandlers, callback);
  }

  /**
   * Emits a map layers loaded event to all handlers.
   * @private
   */
  #emitMapLayersLoaded(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapLayersLoadedHandlers, undefined);
  }

  /**
   * Registers a map layers loaded event callback.
   * @param {MapLayersLoadedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapLayersLoaded(callback: MapLayersLoadedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapLayersLoadedHandlers, callback);
  }

  /**
   * Unregisters a map layers loaded event callback.
   * @param {MapLayersLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapLayersLoaded(callback: MapLayersLoadedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapLayersLoadedHandlers, callback);
  }

  /**
   * Emits a map move end event to all handlers.
   * @private
   */
  #emitMapMoveEnd(event: MapMoveEndEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapMoveEndHandlers, event);
  }

  /**
   * Registers a map move end event callback.
   * @param {MapMoveEndDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapMoveEnd(callback: MapMoveEndDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapMoveEndHandlers, callback);
  }

  /**
   * Unregisters a map move end event callback.
   * @param {MapMoveEndDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapMoveEnd(callback: MapMoveEndDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapMoveEndHandlers, callback);
  }

  /**
   * Emits a map pointer move event to all handlers.
   * @private
   */
  #emitMapPointerMove(event: MapPointerMoveEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapPointerMoveHandlers, event);
    }
  }

  /**
   * Registers a map pointer move event callback.
   * @param {MapPointerMoveDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapPointerMove(callback: MapPointerMoveDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapPointerMoveHandlers, callback);
  }

  /**
   * Unregisters a map pointer move event callback.
   * @param {MapPointerMoveDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapPointerMove(callback: MapPointerMoveDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapPointerMoveHandlers, callback);
  }

  /**
   * Emits a map pointer stop event to all handlers.
   * @private
   */
  #emitMapPointerStop(event: MapPointerMoveEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapPointerStopHandlers, event);
    }
  }

  /**
   * Registers a map pointer stop event callback.
   * @param {MapPointerMoveDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapPointerStop(callback: MapPointerMoveDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapPointerStopHandlers, callback);
  }

  /**
   * Unregisters a map pointer stop event callback.
   * @param {MapPointerMoveDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapPointerStop(callback: MapPointerMoveDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapPointerStopHandlers, callback);
  }

  /**
   * Emits a map single click event to all handlers.
   * @private
   */
  #emitMapSingleClick(event: MapSingleClickEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapSingleClickHandlers, event);
    }
  }

  /**
   * Registers a map single click event callback.
   * @param {MapSingleClickDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapSingleClick(callback: MapSingleClickDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapSingleClickHandlers, callback);
  }

  /**
   * Unregisters a map single click end event callback.
   * @param {MapSingleClickDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapSingleClick(callback: MapSingleClickDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapSingleClickHandlers, callback);
  }

  /**
   * Emits a map zoom end event to all handlers.
   * @private
   */
  #emitMapZoomEnd(event: MapZoomEndEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapZoomEndHandlers, event);
  }

  /**
   * Registers a map zoom end event callback.
   * @param {MapZoomEndDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapZoomEnd(callback: MapZoomEndDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapZoomEndHandlers, callback);
  }

  /**
   * Unregisters a map zoom end event callback.
   * @param {MapZoomEndDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapZoomEnd(callback: MapZoomEndDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapZoomEndHandlers, callback);
  }

  /**
   * Emits a map rotation event to all handlers.
   * @private
   */
  #emitMapRotation(event: MapRotationEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapRotationHandlers, event);
  }

  /**
   * Registers a map rotation event callback.
   * @param {MapRotationDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapRotation(callback: MapRotationDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapRotationHandlers, callback);
  }

  /**
   * Unregisters a map rotation event callback.
   * @param {MapRotationDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapRotation(callback: MapRotationDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapRotationHandlers, callback);
  }

  /**
   * Emits a map change size event to all handlers.
   * @private
   */
  #emitMapChangeSize(event: MapChangeSizeEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapChangeSizeHandlers, event);
  }

  /**
   * Registers a map change size event callback.
   * @param {MapChangeSizeDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapChangeSize(callback: MapChangeSizeDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapChangeSizeHandlers, callback);
  }

  /**
   * Unregisters a map change size event callback.
   * @param {MapChangeSizeDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapChangeSize(callback: MapChangeSizeDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapChangeSizeHandlers, callback);
  }

  /**
   * Emits a map projection changed event.
   * @param {object} projection - The projection information.
   */
  #emitMapProjectionChanged(event: { projection: OLProjection }): void {
    // Emit the event
    EventHelper.emitEvent(this, this.#onMapProjectionChangedHandlers, event);
  }

  /**
   * Registers a map projection change event callback.
   * @param {MapProjectionChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapProjectionChanged(callback: MapProjectionChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapProjectionChangedHandlers, callback);
  }

  /**
   * Unregisters a map change size event callback.
   * @param {MapChangeSizeDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapProjectionChanged(callback: MapChangeSizeDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapChangeSizeHandlers, callback);
  }

  /**
   * Emits a component added event to all handlers.
   * @private
   */
  #emitMapComponentAdded(event: MapComponentAddedEvent): void {
    // Emit the component added event for all handlers
    EventHelper.emitEvent(this, this.#onMapComponentAddedHandlers, event);
  }

  /**
   * Registers a component added event callback.
   * @param {MapComponentAddedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapComponentAdded(callback: MapComponentAddedDelegate): void {
    // Register the component added event handler
    EventHelper.onEvent(this.#onMapComponentAddedHandlers, callback);
  }

  /**
   * Unregisters a component added event callback.
   * @param {MapComponentAddedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapComponentAdded(callback: MapComponentAddedDelegate): void {
    // Unregister the component added event handler
    EventHelper.offEvent(this.#onMapComponentAddedHandlers, callback);
  }

  /**
   * Emits a component removed event to all handlers.
   * @private
   */
  #emitMapComponentRemoved(event: MapComponentRemovedEvent): void {
    // Emit the component removed event for all handlers
    EventHelper.emitEvent(this, this.#onMapComponentRemovedHandlers, event);
  }

  /**
   * Registers a component removed event callback.
   * @param {MapComponentRemovedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapComponentRemoved(callback: MapComponentRemovedDelegate): void {
    // Register the component removed event handler
    EventHelper.onEvent(this.#onMapComponentRemovedHandlers, callback);
  }

  /**
   * Unregisters a component removed event callback.
   * @param {MapComponentRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapComponentRemoved(callback: MapComponentRemovedDelegate): void {
    // Unregister the component removed event handler
    EventHelper.offEvent(this.#onMapComponentRemovedHandlers, callback);
  }

  /**
   * Emits a component removed event to all handlers.
   * @private
   */
  #emitMapLanguageChanged(event: MapLanguageChangedEvent): void {
    // Emit the component removed event for all handlers
    EventHelper.emitEvent(this, this.#onMapLanguageChangedHandlers, event);
  }

  /**
   * Registers a component removed event callback.
   * @param {MapComponentRemovedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onMapLanguageChanged(callback: MapLanguageChangedDelegate): void {
    // Register the component removed event handler
    EventHelper.onEvent(this.#onMapLanguageChangedHandlers, callback);
  }

  /**
   * Unregisters a component removed event callback.
   * @param {MapComponentRemovedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offMapLanguageChanged(callback: MapLanguageChangedDelegate): void {
    // Unregister the component removed event handler
    EventHelper.offEvent(this.#onMapLanguageChangedHandlers, callback);
  }

  // #endregion
}

/**
 *  Definition of map state to attach to the map object for reference.
 */
export type TypeMapState = {
  currentProjection: number;
  currentZoom: number;
  mapCenterCoordinates: Coordinate;
  singleClickedPosition: TypeMapMouseInfo;
  pointerPosition: TypeMapMouseInfo;
};

/**
 * Type used to define the map mouse information
 * */
export type TypeMapMouseInfo = {
  lonlat: Coordinate;
  pixel: Coordinate;
  projected: Coordinate;
  dragging: boolean;
};

/**
 * Type used when fetching geometry json
 */
export type GeometryJsonResponse = {
  geometry: GeometryJsonResponseGeometry;
};

/**
 * Type used when fetching geometry json with coordinates property
 */
export type GeometryJsonResponseGeometry = {
  coordinates: number[] | Coordinate[][];
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapInitDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define a delegate for the event handler function signature
 */
export type MapReadyDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define a delegate for the event handler function signature
 */
export type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define a delegate for the event handler function signature
 */
export type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define an event for the delegate
 */
export type MapMoveEndEvent = {
  lonlat: Coordinate;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapPointerMoveEvent = TypeMapMouseInfo;

/**
 * Define a delegate for the event handler function signature
 */
export type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapSingleClickEvent = TypeMapMouseInfo;

/**
 * Define a delegate for the event handler function signature
 */
export type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapZoomEndEvent = {
  zoom: number;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapRotationEvent = {
  rotation: number;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapChangeSizeEvent = {
  size: Size;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapChangeSizeDelegate = EventDelegateBase<MapViewer, MapChangeSizeEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapProjectionChangedEvent = {
  projection: OLProjection;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapProjectionChangedDelegate = EventDelegateBase<MapViewer, MapProjectionChangedEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapComponentAddedEvent = {
  mapComponentId: string;
  component: JSX.Element;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapComponentRemovedEvent = {
  mapComponentId: string;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapLanguageChangedEvent = {
  language: TypeDisplayLanguage;
};

/**
 * Define a delegate for the event handler function signature
 */
export type MapLanguageChangedDelegate = EventDelegateBase<MapViewer, MapLanguageChangedEvent, void>;
