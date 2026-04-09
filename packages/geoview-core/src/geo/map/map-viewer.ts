import type { Root } from 'react-dom/client';

import type { i18n } from 'i18next';

import { Overlay, type MapBrowserEvent, type MapEvent } from 'ol';
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
import ScaleLine from 'ol/control/ScaleLine';

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
  TypeMapMouseInfo,
  TypeMapState,
} from '@/api/types/map-schema-types';
import {
  MAP_CENTER,
  MAP_EXTENTS,
  VALID_ZOOM_LEVELS,
  VALID_DISPLAY_LANGUAGE,
  VALID_DISPLAY_THEME,
  VALID_PROJECTION_CODES,
  MAP_ZOOM_LEVEL,
} from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';

import { BasemapApi } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Projection } from '@/geo/utils/projection';

import { ControllerRegistry } from '@/core/controllers/base/controller-registry';
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
import { debounce } from '@/core/utils/debounce';
import type { TimeIANA } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { NORTH_POLE_POSITION, TIMEOUT } from '@/core/utils/constant';
import type { TypeMapFeaturesConfig, TypeHTMLElement } from '@/core/types/global-types';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { Notifications } from '@/core/utils/notifications';
import {
  getStoreMapBasemapOptions,
  getStoreMapGeolocatorSearchArea,
  getStoreMapOrderedLayerInfo,
  setStoreMapLoaded,
  setStoreMapClickMarkerIconHide,
  setStoreMapZoom,
  setStoreMapHomeButtonView,
  type TypeOrderedLayerInfo,
  getStoreMapStateJson,
  setStoreMapDisplayed,
  setStoreMapPointerPosition,
  setStoreMapIsMouseInsideMap,
  setStoreMapRotation,
  setStoreMapScale,
  setStoreMapMoveEnd,
  type TypeScaleInfo,
  setStoreMapOverlayNorthMarker,
  setStoreMapOverlayClickMarker,
  getStoreMapCurrentProjectionEPSG,
  getStoreMapInteraction,
  setStoreMapInteraction,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { getStoreAppDisplayTheme } from '@/core/stores/store-interface-and-intial-values/app-state';
import { setStoreLayerSelectedLayersTabLayer, type TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { GeoUtilities } from '@/geo/utils/utilities';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { Fetch } from '@/core/utils/fetch-helper';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { UIDomain } from '@/core/domains/ui-domain';
import { LayerDomain } from '@/core/domains/layer-domain';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from './feature-highlight';

/**
 * Class used to manage created maps.
 */
export class MapViewer {
  /** A zoom level buffer to guarantee that the calculations being done via the resolutions, inches per meter, dpi are more strict than not enough
   * The value 0.21 seems rather specific, but it was the value giving us the best result during testing on layer
   * National Forest Inventory Photo Plot Summary (6433173f-bca8-44e6-be8e-3e8a19d3c299) at zoom level 3.78 +/- 0.25
   * It could be increased slightly if ever we need to, but it might offer worse precision depending on various layers */
  static readonly ZOOM_LEVEL_FROM_SCALE_BUFFER = 0.21;

  /** Minimum delay (in milliseconds) for map to be in loading state */
  static readonly #MIN_DELAY_LOADING = 2000; // 2 seconds

  /** Maximum delay to wait until the layers get processes/loaded/error state, should be high as other timeouts should expire before this.. */
  static readonly #MAX_DELAY_TO_WAIT_ON_MAP = 120 * 1000; // 2 minutes

  /** Default densification number when forming layer extents, to make ture to compensate for earth curvature */
  static DEFAULT_STOPS: number = 25;

  /** Default DPI values */
  static readonly DEFAULT_DPI_OPEN_LAYERS_LEGACY: number = 25.4 / 0.28; // <-- 90.71428571428571
  static readonly DEFAULT_DPI_MODERN: number = 96; // <--- Modern web maps almost universally assume 96 DPI for screens
  static DEFAULT_DPI: number = MapViewer.DEFAULT_DPI_MODERN;

  /** Default inches per meter used by OpenLayers */
  static readonly DEFAULT_INCHES_PER_METER = 39.3700787;

  /** Map features configuration properties */
  mapFeaturesConfig: TypeMapFeaturesConfig;

  /** The id of the map */
  mapId: string;

  /** The OpenLayers map instance */
  // Note: The '!' is used here, because it's being created just a bit late, but not late enough that we want to keep checking for undefined throughout the code base
  map!: OLMap;

  /** Plugins attached to the map */
  plugins: PluginsContainer = {};

  /** The overview map React root */
  overviewRoot: Root | undefined;

  /** Used to access button bar API to create buttons and button panels on the app-bar */
  appBarApi: AppBarApi;

  /** Used to access button bar API to create buttons and button panels on the nav-bar */
  navBarApi: NavBarApi;

  /** Used to access the footer bar API to create buttons and footer panels on the footer-bar */
  footerBarApi: FooterBarApi;

  /** Used to manage states */
  stateApi: StateApi;

  /** Used to attach the notification class */
  notifications: Notifications;

  /** Used to access geometry API to create and manage geometries */
  geometry: GeometryApi;

  /** Used to access basemap API functions */
  basemap: BasemapApi;

  /** Used to access layers functions */
  layer: LayerApi;

  /** Used to access feature highlight API functions */
  featureHighlight: FeatureHighlight;

  /** Modals creation */
  modal: ModalApi;

  /** The UI domain */
  #uiDomain: UIDomain;

  /** The Layer domain */
  #layerDomain: LayerDomain;

  // TODO: REFACTOR IMPORTANT - Ideally, the MapViewer class would be a proper 'Domain' class unaware of 'controllers'.
  // TO.DOCONT: We should review everywhere in this file where 'this.controllers.' is used - as those are backwards domain (MapViewer) calling a controller.
  // TO.DOCONT: However, we can only do this once we have another 'Application class' which holds the ControllersRegistry instead of the MapViewer itself.
  // TO.DOCONT: That's another big refactor to come.
  /** The controller registry owning all framework-level controllers */
  controllers: ControllerRegistry;

  // max number of icons cached
  /** Max number of icons cached */
  iconImageCacheSize: number;

  /** Indicates if the map has been initialized */
  #mapInit = false;

  /** Indicates if the map is ready */
  #mapReady = false;

  /** Indicates if the map has all its layers processed upon launch */
  #mapLayersProcessed = false;

  /** Indicates if the map has all its layers loaded upon launch */
  #mapLayersLoaded = false;

  /** Callback delegates for the map init event */
  #onMapInitHandlers: MapInitDelegate[] = [];

  /** Callback delegates for the map ready event */
  #onMapReadyHandlers: MapReadyDelegate[] = [];

  /** Callback delegates for the map layers processed event */
  #onMapLayersProcessedHandlers: MapLayersProcessedDelegate[] = [];

  /** Callback delegates for the map layers loaded event */
  #onMapLayersLoadedHandlers: MapLayersLoadedDelegate[] = [];

  /** Callback delegates for the map move end event */
  #onMapMoveEndHandlers: MapMoveEndDelegate[] = [];

  /** Whether pointer events should be handled */
  #pointerHandlersEnabled: boolean = true;

  /** Callback delegates for the map pointer move event */
  #onMapPointerMoveHandlers: MapPointerMoveDelegate[] = [];

  /** Callback delegates for the map pointer stop event */
  #onMapPointerStopHandlers: MapPointerMoveDelegate[] = [];

  /** Callback delegates for the map single click event */
  #onMapSingleClickHandlers: MapSingleClickDelegate[] = [];

  /** Callback delegates for the map zoom end event */
  #onMapZoomEndHandlers: MapZoomEndDelegate[] = [];

  /** Callback delegates for the map rotation event */
  #onMapRotationHandlers: MapRotationDelegate[] = [];

  /** Callback delegates for the map change size event */
  #onMapChangeSizeHandlers: MapChangeSizeDelegate[] = [];

  /** Callback delegates for the map projection changed event */
  #onMapProjectionChangedHandlers: MapProjectionChangedDelegate[] = [];

  /** Callback delegates for the map component added event */
  #onMapComponentAddedHandlers: MapComponentAddedDelegate[] = [];

  /** Callback delegates for the map component removed event */
  #onMapComponentRemovedHandlers: MapComponentRemovedDelegate[] = [];

  /** Callback delegates for the map language changed event */
  #onMapLanguageChangedHandlers: MapLanguageChangedDelegate[] = [];

  /** The starting time of the timer for the map ready */
  #checkMapReadyStartTime: number | undefined;

  /** Bounded reference to the handle map pointer move */
  #boundedHandleMapPointerMove: (event: MapBrowserEvent) => void;

  /** Bounded reference to the handle map pointer stopped */
  #boundedHandleMapPointerStopped: (event: MapBrowserEvent) => void;

  /** Bounded reference to the handle map single click */
  #boundedHandleMapSingleClick: (event: MapBrowserEvent) => void;

  /** Bounded reference to the debounced handle map pointer stopped */
  #boundedHandleMapPointerStoppedDebounced: (event: MapBrowserEvent) => void;

  /** Bounded reference to the debounced handle map single click */
  #boundedHandleMapSingleClickDebounced: (event: MapBrowserEvent) => void;

  /** Getter for map is init */
  get mapInit(): boolean {
    return this.#mapInit;
  }

  /** Getter for map is ready. A Map is ready when all layers have been processed. */
  get mapReady(): boolean {
    return this.#mapReady;
  }

  /** Getter for map layers processed */
  get mapLayersProcessed(): boolean {
    return this.#mapLayersProcessed;
  }

  /** Getter for map layers loaded */
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
   *
   * @param mapFeaturesConfig - Map properties
   * @param i18instance - Language instance
   */
  constructor(mapFeaturesConfig: TypeMapFeaturesConfig, i18instance: i18n) {
    this.mapId = mapFeaturesConfig.mapId;
    this.mapFeaturesConfig = mapFeaturesConfig;

    this.iconImageCacheSize = 1;

    // Initialize the ui domain
    this.#uiDomain = new UIDomain(i18instance, mapFeaturesConfig.displayLanguage ?? 'en');
    this.#layerDomain = new LayerDomain();

    // The geometry api
    this.geometry = new GeometryApi(this);

    // The feature highligh api
    this.featureHighlight = new FeatureHighlight(this);

    // Initialize the controller registry
    this.controllers = new ControllerRegistry(this, this.#uiDomain, this.#layerDomain, this.geometry, this.featureHighlight);
    this.controllers.hookControllers();

    this.appBarApi = new AppBarApi(this.controllers.uiController);
    this.navBarApi = new NavBarApi();
    this.footerBarApi = new FooterBarApi(this.controllers.uiController);
    this.stateApi = new StateApi(this.controllers.mapController);
    this.notifications = new Notifications(this.controllers.uiController);

    this.modal = new ModalApi();

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new BasemapApi(this, getStoreMapBasemapOptions(this.mapId));

    // Initialize layer api
    this.layer = new LayerApi(this.controllers, this.#layerDomain, this.geometry, this.featureHighlight);

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
   *
   * @param mapElement - HTML element to create the map within
   * @returns The OpenLayer map
   */
  createMap(mapElement: HTMLElement): OLMap {
    // config object
    const mapViewSettings = this.mapFeaturesConfig?.map.viewSettings;

    // create map projection object from code
    const projection = Projection.PROJECTIONS[mapViewSettings.projection];

    let extentProjected: Extent | undefined;
    if (mapViewSettings.maxExtent && projection) {
      extentProjected = MapViewer.#computeViewExtent(mapViewSettings.projection, mapViewSettings.maxExtent, projection);
    }

    const initialMap = new OLMap({
      target: mapElement,
      layers: [GeoUtilities.createEmptyBasemap()],
      view: new View({
        projection,
        center: Projection.transformFromLonLat(
          mapViewSettings.initialView?.zoomAndCenter
            ? mapViewSettings.initialView?.zoomAndCenter[1]
            : MAP_CENTER[mapViewSettings.projection],
          projection
        ),
        zoom: mapViewSettings.initialView?.zoomAndCenter
          ? mapViewSettings.initialView?.zoomAndCenter[0]
          : MAP_ZOOM_LEVEL[mapViewSettings.projection],
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
   * This function must be called once the Map is rendered.
   *
   * @returns A promise that resolves when the map initialization is complete
   */
  async initMap(): Promise<void> {
    // Note the time
    this.#checkMapReadyStartTime = Date.now();

    // Load the Map itself and the UI controls
    await this.initMapControls();

    // Load the core packages plugins
    await this.#loadCorePackages();

    // Reset the basemap - not awaited as we proceed with empty basemap while it loads
    this.controllers.mapController.resetBasemap().catch((error: unknown) => logger.logError('Basemap creation failed', error));

    // Emit map init
    this.#mapInit = true;
    this.#emitMapInit();

    // Check if geometries are provided from url and load them
    this.#loadGeometries();

    // Prepare the FeatureHighlight now that the map is available
    this.featureHighlight.init();

    // Load the list of geoview layers in the config to add all layers on the map.
    // After this call, all first level layers have been registered.
    await this.controllers.layerCreatorController.loadListOfGeoviewLayer(this.mapFeaturesConfig.map.listOfGeoviewLayerConfig);

    // Here, all base-level "this.mapFeaturesConfig.map.listOfGeoviewLayerConfig" have been registered (layerStatus === 'registered').
    // However, careful, the layers are still processing and some sub-layer-entries can get registered on-the-fly (notably: EsriDynamic, WMS).

    // Ready the map
    return this.#readyMap();
  }

  /**
   * Initializes the map controls
   */
  async initMapControls(): Promise<void> {
    // Log
    logger.logTraceCore('MAP VIEWER - initMapControls', this.mapId);

    // use api to access map because this function will set map element in store
    const { map } = this;
    const { mapId } = this;

    // Add map controls (scale)
    const scaleBarMetric = new ScaleLine({
      units: 'metric',
      target: document.getElementById(`${mapId}-scaleControlBarMetric`) as HTMLElement,
      bar: true,
      text: true,
    });

    const scaleBarImperial = new ScaleLine({
      units: 'imperial',
      target: document.getElementById(`${mapId}-scaleControlBarImperial`) as HTMLElement,
      bar: true,
      text: true,
    });

    map.addControl(scaleBarMetric);
    map.addControl(scaleBarImperial);

    // Get the projection
    // TODO: CHECK - Do we really have to go through the store to get the map projection when we're in the map-viewer class itself?
    // TO.DOCONT: Do a 'find-all-references' on 'getStoreMapCurrentProjection' and 'getStoreMapCurrentProjectionEPSG' to review them all.
    const mapProjection = Projection.getProjectionFromString(getStoreMapCurrentProjectionEPSG(this.mapId));

    // add map overlays
    // create overlay for north pole icon
    const northPoleId = `${mapId}-northpole`;
    const projectionPosition = Projection.transformFromLonLat([NORTH_POLE_POSITION[1], NORTH_POLE_POSITION[0]], mapProjection);

    const northPoleMarker = new Overlay({
      id: northPoleId,
      position: projectionPosition,
      positioning: 'center-center',
      element: document.getElementById(northPoleId) as HTMLElement,
      stopEvent: false,
    });
    map.addOverlay(northPoleMarker);

    // create overlay for click marker icon
    const clickMarkerId = `${mapId}-clickmarker`;
    const clickMarkerOverlay = new Overlay({
      id: clickMarkerId,
      position: [-1, -1],
      positioning: 'center-center',
      offset: [-18, -30],
      element: document.getElementById(clickMarkerId) as HTMLElement,
      stopEvent: false,
    });
    map.addOverlay(clickMarkerOverlay);

    // Save to the store
    setStoreMapOverlayNorthMarker(mapId, northPoleMarker);
    setStoreMapOverlayClickMarker(mapId, clickMarkerOverlay);

    // Get the size
    const size = await this.getMapSize();

    // Set map size
    this.controllers.mapController.setMapSize(size);

    // Get the scale information
    const scale = MapViewer.getScaleInfoFromDomElement(mapId);

    // Save to the store
    setStoreMapScale(mapId, scale);

    // Save to the store
    setStoreMapInteraction(mapId, getStoreMapInteraction(mapId));
  }

  // #region MAP STATES

  /**
   * Gets a plugin by its id.
   *
   * @param pluginId - The plugin id
   * @returns The plugin
   */
  getPlugin(pluginId: string): AbstractPlugin {
    return this.plugins[pluginId];
  }

  /**
   * Asynchronously attempts to get a plugin by its id.
   *
   * @param pluginId - The plugin id
   * @returns A promise that resolves with the plugin
   */
  getPluginAsync(pluginId: string): Promise<AbstractPlugin> {
    return whenThisThen(() => {
      return this.plugins[pluginId];
    });
  }

  /**
   * Retrieves the configuration object for a specific core plugin from the map's features configuration.
   *
   * @param pluginId - The ID of the core plugin to look up
   * @returns The configuration object for the specified plugin, or undefined if not found
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
   * Returns the current display language.
   *
   * @returns The display language
   */
  getDisplayLanguage(): TypeDisplayLanguage {
    return this.#uiDomain.getLanguage();
  }

  /**
   * Returns the current display theme.
   *
   * @returns The display theme
   */
  getDisplayTheme(): TypeDisplayTheme {
    return getStoreAppDisplayTheme(this.mapId);
  }

  /**
   * Returns the map current state information.
   *
   * @returns The map state
   */
  getMapState(): TypeMapState {
    // map state initialize with store data coming from configuration file/object.
    // updated values will be added by store subscription in controllers
    return getStoreMapStateJson(this.mapId);
  }

  /**
   * Gets the map viewSettings.
   *
   * @returns The map viewSettings
   */
  getView(): View {
    return this.map.getView();
  }

  /**
   * Set the map viewSettings (coordinate values in lon/lat).
   *
   * @param mapView - Map viewSettings object
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

    if (mapView.maxExtent) {
      const projObj = Projection.getProjectionFromString(`EPSG:${mapView.projection}`);
      viewOptions.extent = MapViewer.#computeViewExtent(Number(mapView.projection), mapView.maxExtent, projObj);
    }

    const newView = new View(viewOptions);
    this.map.setView(newView);

    // Because the view has changed we must re-register the view handlers
    this.#registerViewHandlers(newView);
  }

  /**
   * Asynchronously gets the map center coordinate to give a chance for the map to
   * render before returning the value.
   *
   * @returns A promise that resolves with the map center
   */
  getCenter(): Promise<Coordinate> {
    // When the getCenter() function actually returns a coordinate
    return whenThisThen(() => {
      return this.getView().getCenter()!;
    });
  }

  /**
   * Sets the map center.
   *
   * @param center - New center to use
   */
  setCenter(center: Coordinate): void {
    const currentView = this.getView();
    const transformedCenter = Projection.transformFromLonLat(center, currentView.getProjection());

    currentView.setCenter(transformedCenter);
  }

  /**
   * Asynchronously gets the map size to give a chance for the map to
   * render before returning the value.
   *
   * @returns A promise that resolves with the map size
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
   *
   * @param pointXY - The pixel coordinate to convert
   * @param timeoutMs - The maximum time in milliseconds to wait for the getCoordinateFromPixel to return a value
   * @returns A promise that resolves with the map coordinate at the given pixel location
   */
  getCoordinateFromPixel(pointXY: [number, number], timeoutMs: number): Promise<Coordinate> {
    // When the getCoordinateFromPixel() function actually returns a coordinate
    return whenThisThen(() => {
      return this.map.getCoordinateFromPixel(pointXY);
    }, timeoutMs);
  }

  /**
   * Gets the map projection
   * @returns The map projection
   */
  getProjection(): OLProjection {
    return this.getView().getProjection();
  }

  /**
   * Gets the map projection number
   * @returns The map projection number
   */
  getProjectionNumber(): number | undefined {
    return Projection.readEPSGNumber(this.getProjection());
  }

  /**
   * Gets the ordered layer info.
   *
   * @returns The ordered layer info
   */
  getMapLayerOrderInfo(): TypeOrderedLayerInfo[] {
    return getStoreMapOrderedLayerInfo(this.mapId);
  }

  /**
   * Gets the i18nInstance for localization.
   *
   * @returns The i18n instance
   */
  getI18nInstance(): i18n {
    return this.#uiDomain.geti18n();
  }

  /**
   * Gets geolocator search area.
   *
   * @returns The geolocator search area with coordinates and optional bounding box, or undefined if not set
   */
  getGeolocatorSearchArea(): { coords: Coordinate; bbox?: Extent } | undefined {
    return getStoreMapGeolocatorSearchArea(this.mapId);
  }

  /**
   * Set fullscreen / exit fullscreen.
   *
   * @param status - Toggle fullscreen or exit fullscreen status
   * @param element - The element to toggle fullscreen on
   */
  setFullscreen(status: boolean, element: TypeHTMLElement | undefined): void {
    // Redirect to controller
    this.controllers.uiController.setFullScreen(status, element);
  }

  /**
   * Set map to either dynamic or static.
   *
   * @param interaction - Map interaction
   */
  setInteraction(interaction: TypeInteraction): void {
    // Set active the map interactions if necessary
    this.map.getInteractions().forEach((x) => x.setActive(interaction === 'dynamic'));

    // Save to the store
    setStoreMapInteraction(this.mapId, interaction);

    // Register or unregister pointer handlers
    if (interaction === 'static') {
      this.unregisterMapPointerHandlers(this.map);
    } else {
      this.registerMapPointerHandlers(this.map);
    }
  }

  /**
   * Set the display language of the map.
   *
   * @param displayLanguage - The language to use (en, fr)
   * @param reloadLayers - Optional flag to ask viewer to reload layers with the new localize language
   * @returns A promise that resolves when the language change is complete
   */
  async setLanguage(displayLanguage: TypeDisplayLanguage, reloadLayers?: boolean | false): Promise<void> {
    // If the language hasn't changed don't do anything
    if (this.#uiDomain.getLanguage() === displayLanguage) return;

    if (!VALID_DISPLAY_LANGUAGE.includes(displayLanguage)) {
      // Unsupported
      this.notifications.addNotificationError(getLocalizedMessage(displayLanguage, 'validation.changeDisplayLanguage'));
      return;
    }

    // Proceed
    await this.controllers.uiController.setDisplayLanguage(displayLanguage);

    // if flag is true, reload just the GeoCore layers instead of reloading the whole map with current state
    if (reloadLayers) {
      this.controllers.layerCreatorController.reloadGeocoreLayers();
    }

    // Emit language changed event
    this.#emitMapLanguageChanged({ language: displayLanguage });
  }

  /**
   * Sets the timezone used to display date values for this map.
   *
   * This affects how parsed date instants are converted and presented in the UI,
   * without modifying the underlying stored values.
   *
   * @param displayDateTimezone - The IANA timezone identifier to use for display
   * @throws {InvalidTimezoneError} When the time zone is not a valid or supported IANA identifier
   */
  setDisplayDateTimezone(displayDateTimezone: TimeIANA): void {
    // Redirect to controller
    this.controllers.uiController.setDisplayDateTimezone(displayDateTimezone);
  }

  /**
   * Set the display projection of the map.
   *
   * @param projectionCode - The projection code (3978, 3857)
   * @returns A promise that resolves when the projection change is complete
   */
  setProjection(projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    if (VALID_PROJECTION_CODES.includes(Number(projectionCode))) {
      // Propagate to the store
      const promise = this.controllers.mapController.setProjection(projectionCode);

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
   * Rotates the view to align it at the given degrees.
   *
   * @param degree - The degrees to rotate the map to
   */
  rotate(degree: number): void {
    // Rotate the view, the store will get updated via this.#handleMapRotation listener
    this.getView().animate({ rotation: degree });
  }

  /**
   * Set the display theme of the map.
   *
   * @param displayTheme - The theme to use (geo.ca, light, dark)
   */
  setTheme(displayTheme: TypeDisplayTheme): void {
    if (VALID_DISPLAY_THEME.includes(displayTheme)) {
      this.controllers.uiController.setDisplayTheme(displayTheme);
    } else this.notifications.addNotificationError(getLocalizedMessage(this.getDisplayLanguage(), 'validation.changeDisplayTheme'));
  }

  /**
   * Gets map scale for Web Mercator or Lambert Conformal Conic projections.
   *
   * @returns The map scale (e.g. 50000 for 1:50,000), or undefined if meters per unit is unavailable
   */
  getMapScale(): number | undefined {
    return this.getMapScaleFromZoom(this.getView().getZoom() || 0);
  }

  /**
   * Converts a zoom level to a map scale.
   *
   * @param zoom - The desired zoom (e.g. 50000 for 1:50,000)
   * @returns The closest scale for the given zoom number, or undefined if meters per unit is unavailable
   */
  getMapScaleFromZoom(zoom: number): number | undefined {
    const projection = this.getView().getProjection();
    const mpu = projection.getMetersPerUnit();
    if (!mpu) return undefined;

    // Get resolution for zoom level
    const resolution = this.getView().getResolutionForZoom(zoom);

    // Calculate scale from resolution
    // Scale = Resolution * metersPerUnit * inchesPerMeter * DPI
    return resolution * mpu * MapViewer.DEFAULT_INCHES_PER_METER * MapViewer.DEFAULT_DPI;
  }

  /**
   * Converts a map scale denominator (1:X) into the corresponding OpenLayers resolution.
   *
   * Resolution is computed using: resolution = scale / (metersPerUnit * inchesPerMeter * dpi)
   *
   * @param targetScale - The scale denominator (e.g., 50000000 for 1:50,000,000). Optional; returns undefined if not provided.
   * @param dpiValue - Dots per inch to use for conversion. Defaults to `MapViewer.DEFAULT_DPI` (usually 96 or 90.714 depending on standard).
   * @returns The map resolution in map units per pixel, or `undefined` if `targetScale` is not provided.
   */
  getMapResolutionFromScale(targetScale: number | undefined, dpiValue: number = MapViewer.DEFAULT_DPI): number | undefined {
    if (!targetScale) return undefined;
    const projection = this.getView().getProjection();
    const mpu = projection.getMetersPerUnit()!;

    // Resolution = Scale / ( metersPerUnit * inchesPerMeter * DPI )
    return targetScale / (mpu * MapViewer.DEFAULT_INCHES_PER_METER * dpiValue);
  }

  /**
   * Converts a map scale denominator (1:X) into the corresponding OpenLayers zoom level.
   *
   * Uses `getMapResolutionFromScale` internally and then computes the zoom for that resolution.
   *
   * @param targetScale - The scale denominator (e.g., 50000000 for 1:50,000,000). Optional; returns undefined if not provided.
   * @param dpiValue - Dots per inch to use for conversion. Defaults to `MapViewer.DEFAULT_DPI`.
   * @returns The OpenLayers zoom level corresponding to the scale, or `undefined` if `targetScale` is not provided.
   */
  getMapZoomFromScale(targetScale: number | undefined, dpiValue: number = MapViewer.DEFAULT_DPI): number | undefined {
    // Get the resolution from the scale
    const resolution = this.getMapResolutionFromScale(targetScale, dpiValue);
    if (!resolution) return undefined;

    // Calculate the zoom level from the resolution
    const zoomLevel = this.getView().getZoomForResolution(resolution);
    if (!zoomLevel) return undefined;

    // Add a buffer, because the calculations are sometimes a bit off
    return zoomLevel + MapViewer.ZOOM_LEVEL_FROM_SCALE_BUFFER;
  }

  /**
   * Set the map zoom level.
   *
   * @param zoom - New zoom level
   * @returns A promise that resolves when the zoom operation completes
   */
  setMapZoomLevel(zoom: number): Promise<void> {
    // If zoom level is already set at this value, just resolve the promise
    const view = this.getView();
    const isSameZoom = view.getZoom() === zoom;
    const belowMin = zoom < view.getMinZoom();
    const aboveMax = zoom > view.getMaxZoom();

    if (isSameZoom || belowMin || aboveMax) return Promise.resolve();

    // Set zoom level
    this.getView().setZoom(zoom);

    return new Promise((resolve) => {
      this.map.once('rendercomplete', () => {
        resolve();
      });
    });
  }

  /**
   * Set the minimum map zoom level.
   *
   * @param zoom - New minimum zoom level
   */
  setMinZoomLevel(zoom: number): void {
    this.getView().setMinZoom(zoom);
  }

  /**
   * Set the maximum map zoom level.
   *
   * @param zoom - New maximum zoom level
   */
  setMaxZoomLevel(zoom: number): void {
    this.getView().setMaxZoom(zoom);
  }

  /**
   * Set map extent.
   *
   * @param extent - New extent to zoom to
   * @returns A promise that resolves when the zoom operation completes
   */
  setExtent(extent: Extent): Promise<void> {
    return this.controllers.mapController.zoomToExtent(extent);
  }

  /**
   * Set the maximum extent of the map.
   *
   * @param extent - New extent to use
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
   * Add a new custom component to the map.
   *
   * @param mapComponentId - An id to the new component
   * @param component - The component to add
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
   * Emits a map single click event.
   *
   * NOTE: This Does not update the store, only emit the click.
   *
   * @param clickCoordinates - The clicked coordinates to emit
   */
  emitMapSingleClick(clickCoordinates: MapSingleClickEvent): void {
    // Emit the event is done
    this.#emitMapSingleClick(clickCoordinates);
  }

  /**
   * Simulate a map click and return promises of store update and ui update.
   *
   * @param lonlat - The lonlat coordinates to simulate
   * @returns The simulated map click information
   */
  simulateMapClick(lonlat: Coordinate): SimulatedMapClick {
    // Transform lonlat to map projection
    const projCode = this.getProjection().getCode();
    const projected = Projection.transformPoints([lonlat], Projection.PROJECTION_NAMES.LONLAT, projCode)[0];

    // Create the clickCoordinates object
    const clickCoordinates = {
      lonlat: lonlat,
      pixel: [0, 0],
      projected,
      dragging: false,
    };

    // Update store... this will not emit the event because only when WCAG mode is enable
    this.controllers.mapController.setClickCoordinates(clickCoordinates);

    // The resolve of the query
    let resolveQuery: () => void;
    const promiseQuery = new Promise<void>((resolve) => {
      resolveQuery = resolve;
    });

    // The resolve of the query once batched
    let resolveQueryBatched: () => void;
    const promiseQueryBatched = new Promise<void>((resolve) => {
      resolveQueryBatched = resolve;
    });

    // Register one-time listener for query completion
    const handleQueryEnded = (): void => {
      // Unregister the listener immediately
      this.controllers.layerSetController.featureInfoLayerSet.offQueryEnded(handleQueryEnded);

      // Resolve the promise about the completion of the query
      resolveQuery();

      // Wait for UI batch propagation
      delay(TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH)
        .then(() => {
          // Now resolve the promise about the completion of the query and batched through the UI
          resolveQueryBatched();
        })
        .catch((error: unknown) => {
          logger.logPromiseFailed('in delay in simulateMapClick in testDetailsLayerSelectionPersistence', error);
        });
    };

    // Register the handler before clicking
    this.controllers.layerSetController.featureInfoLayerSet.onQueryEnded(handleQueryEnded);

    // Emit the event is done here, not from the processor to avoid circular references
    this.#emitMapSingleClick(clickCoordinates);

    // Return the simulated map click information
    return { promiseQuery, promiseQueryBatched };
  }

  /**
   * Hide a click marker from the map
   */
  clickMarkerIconHide(): void {
    // Save to the store
    setStoreMapClickMarkerIconHide(this.mapId);
  }

  /**
   * Show a marker on the map.
   *
   * @param marker - The marker to add
   */
  clickMarkerIconShow(marker: TypeClickMarker): void {
    // Redirect to the processor
    this.controllers.mapController.clickMarkerIconShow(marker);
  }

  /**
   * Deletes the MapViewer, including its plugins, layers, etc.
   * This function does not unmount the MapViewer. To completely delete a MapViewer, use
   * cgpv.api.deleteMapViewer() which will delete the MapViewer and unmount it - for React.
   *
   * @returns A promise that resolves when the deletion is complete
   */
  async delete(): Promise<void> {
    // Remove the dom element (remove rendered map and overview map)
    if (this.overviewRoot) this.overviewRoot.unmount();

    // Unload all plugins
    await Plugin.removePlugins(this.mapId);

    // Unhook the controllers
    this.controllers.unhookControllers();

    try {
      // Remove all layers
      this.controllers.layerCreatorController.removeAllGeoviewLayers();
    } catch (error: unknown) {
      // Failed to remove layers, eat the exception and continue to remove the map
      logger.logError('Failed to remove layers', error);
    }

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
   * @param extent - The extent to zoom to
   * @param options - Optional options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 })
   * @returns A promise that resolves when the zoom operation completes
   */
  zoomToExtent(extent: Extent, options?: FitOptions): Promise<void> {
    // Redirect to the processor
    return this.controllers.mapController.zoomToExtent(extent, options);
  }

  /**
   * Zoom to the initial extent defined in the map configuration.
   *
   * @returns A promise that resolves when the zoom operation completes
   */
  zoomToInitialExtent(): Promise<void> {
    // Redirect to the processor
    return this.controllers.mapController.zoomToInitialExtent();
  }

  /**
   * Update nav bar home button view settings.
   *
   * @param view - The new view settings
   */
  setHomeButtonView(view: TypeMapViewSettings): void {
    // Save to the store
    setStoreMapHomeButtonView(this.mapId, view);
  }

  /**
   * Zoom to specified extent or coordinate provided in lonlat.
   *
   * @param extent - The extent or coordinate to zoom to
   * @param options - Optional options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 })
   * @returns A promise that resolves when the zoom operation completes
   */
  zoomToLonLatExtentOrCoordinate(extent: Extent | Coordinate, options?: FitOptions): Promise<void> {
    const fullExtent = extent.length === 2 ? [extent[0], extent[1], extent[0], extent[1]] : extent;
    const projectedExtent = Projection.transformExtentFromProj(fullExtent, Projection.getProjectionLonLat(), this.getProjection());
    return this.controllers.mapController.zoomToExtent(projectedExtent, options);
  }

  /**
   * Update the size of the icon image list based on styles.
   *
   * @param legend - The legend to check
   */
  updateIconImageCache(legend: TypeLegend): void {
    // GV This will need to be revised if functionality to add additional icons to a layer is added
    let styleCount = this.iconImageCacheSize;
    if (legend.styleConfig)
      Object.keys(legend.styleConfig).forEach((geom) => {
        if (
          legend.styleConfig &&
          (legend.styleConfig[geom as TypeStyleGeometry]?.type === 'uniqueValue' ||
            legend.styleConfig[geom as TypeStyleGeometry]?.type === 'classBreaks')
        ) {
          if (legend.styleConfig[geom as TypeStyleGeometry]!.info?.length)
            styleCount += legend.styleConfig[geom as TypeStyleGeometry]!.info.length;
        }
      });
    // Set the openlayers icon image cache
    iconImageCache.setSize(styleCount);
    // Update the cache size for the map viewer
    this.iconImageCacheSize = styleCount;
  }

  /**
   * Waits for the map to be ready before resolving the promise.
   *
   * This function checks if the map is already ready, and if not, it waits for the onMapReady event to be triggered.
   *
   * @returns A promise that resolves when the map is ready.
   */
  waitForMapReady(): Promise<void> {
    // If already ready
    if (this.#mapReady) return Promise.resolve();

    // Wait for onMapReady to be triggered
    return new Promise((resolve) => {
      this.onMapReady(() => resolve());
    });
  }

  /**
   * Waits until all GeoView layers reach the specified status before resolving the promise.
   *
   * This function repeatedly checks whether all layers have reached the given layerStatus.
   *
   * @param layerStatus - The desired status to wait for (e.g., 'loaded', 'processed')
   * @returns A promise that resolves with the number of layers that have reached the specified status
   */
  async waitAllLayersStatus(layerStatus: TypeLayerStatus): Promise<number> {
    // Log
    logger.logInfo(`Waiting on layers to become ${layerStatus}`);

    // Wait for the layers to get the layerStatus required
    let layersCount = 0;
    await whenThisThen(
      () => {
        // Check if all layers have met the status
        const [allGood, layersCountInside] = this.controllers.layerController.checkLayerStatus(layerStatus, (layerConfig) => {
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

  /**
   * Waits for the map layers loaded event to be emitted.
   *
   * @returns A promise that resolves with the number of layers that have reached the specified status
   */
  async waitForLayersLoaded(): Promise<number> {
    // First, wait for the map to be ready in case it's not ready yet. We need the layer configs to be registered at least!
    await this.waitForMapReady();

    // Redirect
    return this.waitAllLayersStatus('loaded');
  }

  /**
   * Waits for the rendercomplete event to be triggered.
   *
   * @returns A promise that resolves when map render is complete
   */
  waitForRender(): Promise<void> {
    return new Promise((resolve) => {
      this.map.once('rendercomplete', () => resolve());
    });
  }

  // #endregion

  // #region MAP INTERACTIONS

  /**
   * Initializes selection interactions.
   *
   * @returns The select interaction
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
   * Initializes extent interactions.
   *
   * @returns The extent interaction
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
   * Initializes translation interactions.
   *
   * @returns The translate interaction
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
   *
   * @returns The translate interaction
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
   * Initializes drawing interactions on the given vector source.
   *
   * @param geomGroupKey - The geometry group key in which to hold the geometries
   * @param type - The type of geometry to draw (Polygon, LineString, Circle, etc)
   * @param style - The styles for the drawing
   * @param geometryFunction - Optional geometry function for custom drawing behavior
   * @returns The draw interaction
   */
  initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle, geometryFunction?: GeometryFunction): Draw {
    // Create the Draw component
    const draw = new Draw(
      {
        mapViewer: this,
        geometryGroupKey: geomGroupKey,
        type,
        style,
        geometryFunction,
      },
      this.geometry
    );
    draw.startInteraction();
    return draw;
  }

  /**
   * Initializes modifying interactions on the given vector source.
   *
   * @param geomGroupKey - The geometry group key in which to hold the geometries
   * @param style - Optional styles for the modification
   * @param insertVertexCondition - Optional condition for inserting vertices
   * @param pixelTolerance - Optional pixel tolerance for modification
   * @returns The modify interaction
   */
  initModifyInteractions(
    geomGroupKey: string,
    style?: TypeFeatureStyle,
    insertVertexCondition?: Condition,
    pixelTolerance?: number
  ): Modify {
    // Create the modify component
    const modify = new Modify(
      {
        mapViewer: this,
        geometryGroupKey: geomGroupKey,
        style,
        insertVertexCondition,
        pixelTolerance,
      },
      this.geometry
    );
    modify.startInteraction();
    return modify;
  }

  /**
   * Initializes snapping interactions on the given vector source.
   *
   * @param geomGroupKey - The geometry group key in which to hold the geometries
   * @returns The snap interaction
   */
  initSnapInteractions(geomGroupKey: string): Snap {
    // Create snapping capabilities
    const snap = new Snap(
      {
        mapViewer: this,
        geometryGroupKey: geomGroupKey,
      },
      this.geometry
    );
    snap.startInteraction();
    return snap;
  }

  /**
   * Initializes transform interactions for feature manipulation.
   *
   * @param options - Optional options for the transform interaction
   * @returns The transform interaction
   */
  initTransformInteractions(options?: Partial<TransformOptions>): Transform {
    // Create transform capabilities
    const transform = new Transform(
      {
        mapViewer: this,
        ...options,
      },
      this.geometry
    );
    transform.startInteraction();
    return transform;
  }

  // #endregion

  // #region OTHERS

  /**
   * Retrieves the scale information from the DOM elements for the given map ID.
   *
   * @param mapId - The unique identifier of the map.
   * @returns The scale information object
   */
  static getScaleInfoFromDomElement(mapId: string): TypeScaleInfo {
    // Get metric values
    const scaleControlBarMetric = document.getElementById(`${mapId}-scaleControlBarMetric`);
    const lineWidthMetric = (scaleControlBarMetric?.querySelector('.ol-scale-bar-inner') as HTMLElement)?.style.width;
    const labelGraphicMetric = (scaleControlBarMetric?.querySelector('.ol-scale-bar-inner')?.lastChild as HTMLElement)?.innerHTML;

    // Get metric values
    const scaleControlBarImperial = document.getElementById(`${mapId}-scaleControlBarImperial`);
    const lineWidthImperial = (scaleControlBarImperial?.querySelector('.ol-scale-bar-inner') as HTMLElement)?.style.width;
    const labelGraphicImperial = (scaleControlBarImperial?.querySelector('.ol-scale-bar-inner')?.lastChild as HTMLElement)?.innerHTML;

    // get resolution value (same for metric and imperial)
    const labelNumeric = (scaleControlBarMetric?.querySelector('.ol-scale-text') as HTMLElement)?.innerHTML;

    return { lineWidthMetric, labelGraphicMetric, lineWidthImperial, labelGraphicImperial, labelNumeric };
  }

  /**
   * Gets if north pole is visible. This is not a perfect solution and is more a work around.
   *
   * @returns A promise that resolves with true if visible, false otherwise
   */
  async getNorthPoleVisibility(): Promise<boolean> {
    // Check the container value for top middle of the screen
    // Convert this value to a lat long coordinate
    const size = await this.getMapSize();
    const pointXY: [number, number] = [size[0] / 2, 1];

    // GV: Sometime, the getCoordinateFromPixel return null... use await
    const pixel = await this.getCoordinateFromPixel(pointXY, TIMEOUT.northPoleVisibility);
    const pt = Projection.transformToLonLat(pixel, this.getView().getProjection());

    // If user is pass north, long value will start to be positive (other side of the earth).
    // This will work only for LCC Canada.
    return pt ? pt[0] > 0 : true;
  }

  /**
   * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection.
   * https://www.movable-type.co.uk/scripts/latlong.html
   *
   * @returns The arrow angle
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
   *
   * @param coordinate - The LonLat coordinate
   * @returns The coordinate in the map projection
   */
  convertCoordinateLonLatToMapProj(coordinate: Coordinate): Coordinate {
    // Redirect
    return this.convertCoordinateFromProjToMapProj(coordinate, Projection.getProjectionLonLat());
  }

  /**
   * Transforms coordinate from current projection of the map to LonLat.
   *
   * @param coordinate - The coordinate in map projection
   * @returns The coordinate in LonLat
   */
  convertCoordinateMapProjToLonLat(coordinate: Coordinate): Coordinate {
    // Redirect
    return this.convertCoordinateFromMapProjToProj(coordinate, Projection.getProjectionLonLat());
  }

  /**
   * Transforms extent from LonLat to the current projection of the map.
   *
   * @param extent - The LonLat extent
   * @param stops - The number of stops to perform densification on the extent
   * @returns The extent in the map projection
   */
  convertExtentLonLatToMapProj(extent: Extent, stops: number = MapViewer.DEFAULT_STOPS): Extent {
    // Redirect
    return this.convertExtentFromProjToMapProj(extent, Projection.getProjectionLonLat(), stops);
  }

  /**
   * Transforms extent from current projection of the map to LonLat.
   *
   * @param extent - The extent in map projection
   * @returns The extent in LonLat
   */
  convertExtentMapProjToLonLat(extent: Extent): Extent {
    // Redirect
    return this.convertExtentFromMapProjToProj(extent, Projection.getProjectionLonLat());
  }

  /**
   * Transforms coordinate from given projection to the current projection of the map.
   *
   * @param coordinate - The given coordinate
   * @param fromProj - The projection of the given coordinate
   * @returns The coordinate in the map projection
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
   *
   * @param coordinate - The given coordinate
   * @param toProj - The projection that should be output
   * @returns The coordinate in the given projection
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
   *
   * @param extent - The given extent
   * @param fromProj - The projection of the given extent
   * @param stops - The number of stops to perform densification on the extent
   * @returns The extent in the map projection
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
   * Transforms extent from map projection to given projection. If the projections are the same, the extent is simply returned.
   *
   * @param extent - The given extent
   * @param toProj - The projection that should be output
   * @returns The extent in the given projection
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
   *
   * @param overrideGeocoreServiceNames - Optional - Indicates if geocore layer names should be kept as is or returned to defaults.
   *   Set to false after a language change to update the layer names with the new language.
   * @returns Map config with current map state, or undefined if unavailable
   */
  createMapConfigFromMapState(overrideGeocoreServiceNames: boolean | 'hybrid' = true): TypeMapFeaturesInstance | undefined {
    return this.controllers.mapController.createMapConfigFromMapState(overrideGeocoreServiceNames);
  }

  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   *
   * @param namePairs - The array of name pairs. Presumably one english and one french name in each pair
   * @param mapConfig - Optional config to modify, or one created using the current map state if not provided
   * @param removeUnlisted - Optional - Whether or not names not provided should be removed from config
   * @returns Map config with updated names, or undefined if no config is available
   */
  replaceMapConfigLayerNames(
    namePairs: string[][],
    mapConfig?: TypeMapFeaturesConfig,
    removeUnlisted: boolean = false
  ): TypeMapFeaturesInstance | undefined {
    return this.controllers.mapController.replaceMapConfigLayerNames(namePairs, mapConfig, removeUnlisted);
  }

  /**
   * Register map handlers on view initialization.
   *
   * @param map - Map to register events on
   */
  #registerMapHandlers(map: OLMap): void {
    // If map isn't static
    this.registerMapPointerHandlers(map);

    // Register mouse interaction events. On mouse enter or leave, focus or blur the map container
    const mapHTMLElement = map.getTargetElement();
    mapHTMLElement.addEventListener('mouseenter', () => {
      mapHTMLElement.focus({ preventScroll: true });

      // Save to the store
      setStoreMapIsMouseInsideMap(this.mapId, true);
    });
    mapHTMLElement.addEventListener('mouseleave', () => {
      mapHTMLElement.blur();

      // Save to the store
      setStoreMapIsMouseInsideMap(this.mapId, false);
    });

    // Now that the map dom is loaded, register a handle when size is changing
    map.on('change:size', this.#handleMapChangeSize.bind(this));

    // Register essential map-view handlers
    map.on('moveend', this.#handleMapMoveEnd.bind(this));
  }

  /**
   * Register handlers on pointer move and map single click.
   *
   * @param map - Map to register events on
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
   * Unregister handlers on pointer move and map single click.
   *
   * @param map - Map to unregister events on
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
   *
   * @param view - View to register events on
   */
  #registerViewHandlers(view: View): void {
    // Register essential view handlers
    view.on('change:resolution', debounce(this.#handleMapZoomEnd.bind(this), 100).bind(this));
    view.on('change:rotation', debounce(this.#handleMapRotation.bind(this), 100).bind(this));
  }

  /**
   * Computes the view extent for a given projection, handling projection-specific edge cases.
   *
   * For polar projections (e.g. EPSG:3573), transforming a lon/lat bounding box clips
   * the view too tightly, so the projection's own extent is used directly instead.
   *
   * @param projectionCode - The numeric projection code (e.g. 3978, 3857, 3573).
   * @param maxExtent - The max extent in lon/lat.
   * @param projection - The OpenLayers projection object.
   * @returns The computed view extent, or undefined if none could be determined.
   */
  static #computeViewExtent(projectionCode: number, maxExtent: Extent, projection: OLProjection): Extent | undefined {
    switch (projectionCode) {
      case 3573:
        // Polar projection: use the projection's own extent directly
        return projection.getExtent() || undefined;

      case 3978: {
        const extent = Projection.transformExtentFromProj(maxExtent, Projection.getProjectionLonLat(), projection);
        // Avoid cutting Canada's north parts when north boundary = 90
        if (maxExtent[3] === 90) extent[3] = 9000000;
        return extent;
      }

      default:
        return Projection.transformExtentFromProj(maxExtent, Projection.getProjectionLonLat(), projection);
    }
  }

  /**
   * Handles when the map ends moving.
   *
   * @param event - The map event associated with the ending of the map movement
   * @returns A promise that resolves when done processing the map move
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
   * Handles when the map pointer moves.
   *
   * @param event - The map event associated with the map pointer movement
   */
  #handleMapPointerMove(event: MapBrowserEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = GeoUtilities.getPointerPositionFromMapEvent(event, projCode);

      // Save to the store
      setStoreMapPointerPosition(this.mapId, pointerPosition);

      // Emit to the outside
      this.#emitMapPointerMove(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapPointerMove', error);
    }
  }

  /**
   * Handles when the map pointer stops.
   *
   * @param event - The map event associated with the map pointer movement
   */
  #handleMapPointerStopped(event: MapBrowserEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = GeoUtilities.getPointerPositionFromMapEvent(event, projCode);

      // Emit to the outside
      this.#emitMapPointerStop(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapPointerStopped', error);
    }
  }

  /**
   * Handles when the map received a single click.
   *
   * @param event - The map event associated with the map single click
   */
  #handleMapSingleClick(event: MapBrowserEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = GeoUtilities.getPointerPositionFromMapEvent(event, projCode);

      // Save to the store
      this.controllers.mapController.setClickCoordinates(pointerPosition);

      // Emit to the outside
      this.#emitMapSingleClick(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapSingleClick', error);
    }
  }

  /**
   * Handles when the map zoom ends.
   *
   * @param event - The event associated with the zoom end
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapZoomEnd(event: ObjectEvent): void {
    try {
      // Read the zoom value
      const zoom = this.getView().getZoom();
      if (!zoom) return;

      // Save to the store
      setStoreMapZoom(this.mapId, zoom);

      // Get all layers
      const allLayers = this.controllers.layerController.getGeoviewLayers();

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

        // Save to the store
        this.controllers.mapController.setLayerInVisibleRange(layerPath, inVisibleRange);
      });

      // Emit to the outside
      this.#emitMapZoomEnd({ zoom });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapZoomEnd', error);
    }
  }

  /**
   * Handles when the map rotates.
   *
   * @param event - The event associated with rotation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapRotation(event: ObjectEvent): void {
    try {
      // Get the map rotation
      const rotation = this.getView().getRotation();

      // Save to the store
      setStoreMapRotation(this.mapId, rotation);

      // Emit to the outside
      this.#emitMapRotation({ rotation });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapRotation', error);
    }
  }

  /**
   * Handles when the map changes size.
   *
   * @param event - The event associated with size change
   * @returns A promise that resolves when done processing the map change size
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async #handleMapChangeSize(event: ObjectEvent): Promise<void> {
    try {
      // Get the scale information
      const scale = MapViewer.getScaleInfoFromDomElement(this.mapId);

      // Get the size
      const size = await this.getMapSize();

      // Save to the store
      this.controllers.mapController.setMapSize(size);
      setStoreMapScale(this.mapId, scale);

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
    this.geometry.createGeometryGroup(this.geometry.defaultGeometryGroupId);

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
              // TODO: ? use the geometry as GeoJSON and add properties to by queried by the details panel
              this.geometry.addPolygon(data.geometry.coordinates, undefined, generateId());
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
   *
   * @returns A promise that resolves when the map is fully ready
   */
  async #readyMap(): Promise<void> {
    // Log
    logger.logInfo(`Map is ready. Layers are still being processed... 1`, this.mapId);

    // Log Marker Start
    logger.logMarkerStart(`readyMap-${this.mapId}`);

    // Load the guide
    this.controllers.uiController.createGuide().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in uiController.createGuide in MapViewer.#readyMap', error);
    });

    // Check how load in milliseconds has it been processing thus far
    const elapsedMilliseconds = Date.now() - this.#checkMapReadyStartTime!;

    // Wait at least the minimum delay before officializing the map as loaded for the UI
    await delay(MapViewer.#MIN_DELAY_LOADING - elapsedMilliseconds); // Negative value will simply resolve immediately

    // Save to the store that the map is loaded
    // GV This removes the spinning circle overlay and starts showing the map correctly in the html dom
    setStoreMapLoaded(this.mapId, true);

    // Save to the store that the map is properly being displayed now
    setStoreMapDisplayed(this.mapId);

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
    if (selectedLayerPath) setStoreLayerSelectedLayersTabLayer(this.mapId, selectedLayerPath);

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
   * Load the core packages plugins.
   *
   * @returns A promise that resolves when all core packages plugins are loaded
   */
  #loadCorePackages(): Promise<void[]> {
    // Load the core packages which are the ones who load on map (not footer plugin, not app-bar plugin)
    const promises: Promise<void>[] = [];
    this.mapFeaturesConfig?.corePackages?.forEach((corePackage: string): void => {
      // Load and add the plugin compiling the promise in a list
      const promise = this.controllers.pluginController.loadAndAddPlugin(corePackage);

      // Compile
      promises.push(promise);
    });

    // Await all
    return Promise.all(promises);
  }

  /**
   * Updates the map controls (the store) based on the current map view state.
   *
   * @returns A promise that resolves when the map controls are updated
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

    // Get the north pole visibility
    const isNorthVisible = await this.getNorthPoleVisibility();

    // Get the map Extent
    const extent = this.getView().calculateExtent();

    // Get the scale information
    const scale = MapViewer.getScaleInfoFromDomElement(this.mapId);

    // Save to the store
    setStoreMapMoveEnd(this.mapId, centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, extent, scale);
  }

  /**
   * Zooms the map on the to the extents of specified layers once they are fully loaded or to the extent specified in initialView and do so right away.
   * - If `initialView.extent` is defined, it tries to create the extent and zoom on it.
   * - If `initialView.extent` is undefined, it won't do anything.
   *
   * @returns A promise that resolves when the zoom operation completes
   */
  #zoomOnExtentMaybe(): Promise<void> {
    // Zoom to extents of layers selected in config, if provided
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.extent) {
      // Not zooming on layers, but we have an extent to zoom to instead
      // If extent is not lon/lat, we assume it is in the map projection and use it as is.
      const extent = GeoUtilities.isExtentLonLat(this.mapFeaturesConfig.map.viewSettings.initialView.extent)
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
   *
   * @returns A promise that resolves when the zoom operation completes
   */
  async #zoomOnLayerIdsMaybe(): Promise<void> {
    // If the layerIds property in initialView is defined
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.layerIds) {
      // If the layerIds array is empty, use all layers
      const layerIdsToZoomTo = this.mapFeaturesConfig.map.viewSettings.initialView.layerIds.length
        ? this.mapFeaturesConfig.map.viewSettings.initialView.layerIds
        : this.controllers.layerController.getGeoviewLayerIds();

      let layerExtents = await this.controllers.layerController.getExtentOfMultipleLayers(layerIdsToZoomTo);

      // If extents have infinity, use default instead
      if (!layerExtents || layerExtents.includes(Infinity))
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
   *
   * @returns A promise that resolves when all layers are in processed state
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
   *
   * @returns A promise that resolves when all layers are in loaded state
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
   */
  #emitMapInit(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapInitHandlers, undefined);
  }

  /**
   * Registers a map init event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapInit(callback: MapInitDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapInitHandlers, callback);
  }

  /**
   * Unregisters a map init event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapInit(callback: MapInitDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapInitHandlers, callback);
  }

  /**
   * Emits a map ready event to all handlers.
   */
  #emitMapReady(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapReadyHandlers, undefined);
  }

  /**
   * Registers a map ready event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapReady(callback: MapReadyDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapReadyHandlers, callback);
  }

  /**
   * Unregisters a map ready event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapReady(callback: MapReadyDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapReadyHandlers, callback);
  }

  /**
   * Emits a map layers processed event to all handlers.
   */
  #emitMapLayersProcessed(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapLayersProcessedHandlers, undefined);
  }

  /**
   * Registers a map layers processed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapLayersProcessed(callback: MapLayersProcessedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapLayersProcessedHandlers, callback);
  }

  /**
   * Unregisters a map layers processed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapLayersProcessed(callback: MapLayersProcessedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapLayersProcessedHandlers, callback);
  }

  /**
   * Emits a map layers loaded event to all handlers.
   */
  #emitMapLayersLoaded(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapLayersLoadedHandlers, undefined);
  }

  /**
   * Registers a map layers loaded event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapLayersLoaded(callback: MapLayersLoadedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapLayersLoadedHandlers, callback);
  }

  /**
   * Unregisters a map layers loaded event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapLayersLoaded(callback: MapLayersLoadedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapLayersLoadedHandlers, callback);
  }

  /**
   * Emits a map move end event to all handlers.
   */
  #emitMapMoveEnd(event: MapMoveEndEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapMoveEndHandlers, event);
  }

  /**
   * Registers a map move end event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapMoveEnd(callback: MapMoveEndDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapMoveEndHandlers, callback);
  }

  /**
   * Unregisters a map move end event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapMoveEnd(callback: MapMoveEndDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapMoveEndHandlers, callback);
  }

  /**
   * Emits a map pointer move event to all handlers.
   */
  #emitMapPointerMove(event: MapPointerMoveEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapPointerMoveHandlers, event);
    }
  }

  /**
   * Registers a map pointer move event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapPointerMove(callback: MapPointerMoveDelegate): MapPointerMoveDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapPointerMoveHandlers, callback);
  }

  /**
   * Unregisters a map pointer move event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapPointerMove(callback: MapPointerMoveDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapPointerMoveHandlers, callback);
  }

  /**
   * Emits a map pointer stop event to all handlers.
   */
  #emitMapPointerStop(event: MapPointerMoveEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapPointerStopHandlers, event);
    }
  }

  /**
   * Registers a map pointer stop event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapPointerStop(callback: MapPointerMoveDelegate): MapPointerMoveDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapPointerStopHandlers, callback);
  }

  /**
   * Unregisters a map pointer stop event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapPointerStop(callback: MapPointerMoveDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapPointerStopHandlers, callback);
  }

  /**
   * Emits a map single click event to all handlers.
   */
  #emitMapSingleClick(event: MapSingleClickEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapSingleClickHandlers, event);
    }
  }

  /**
   * Registers a map single click event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapSingleClick(callback: MapSingleClickDelegate): MapSingleClickDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapSingleClickHandlers, callback);
  }

  /**
   * Unregisters a map single click end event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapSingleClick(callback: MapSingleClickDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapSingleClickHandlers, callback);
  }

  /**
   * Emits a map zoom end event to all handlers.
   */
  #emitMapZoomEnd(event: MapZoomEndEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapZoomEndHandlers, event);
  }

  /**
   * Registers a map zoom end event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapZoomEnd(callback: MapZoomEndDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapZoomEndHandlers, callback);
  }

  /**
   * Unregisters a map zoom end event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapZoomEnd(callback: MapZoomEndDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapZoomEndHandlers, callback);
  }

  /**
   * Emits a map rotation event to all handlers.
   */
  #emitMapRotation(event: MapRotationEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapRotationHandlers, event);
  }

  /**
   * Registers a map rotation event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapRotation(callback: MapRotationDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapRotationHandlers, callback);
  }

  /**
   * Unregisters a map rotation event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapRotation(callback: MapRotationDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapRotationHandlers, callback);
  }

  /**
   * Emits a map change size event to all handlers.
   */
  #emitMapChangeSize(event: MapChangeSizeEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapChangeSizeHandlers, event);
  }

  /**
   * Registers a map change size event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapChangeSize(callback: MapChangeSizeDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapChangeSizeHandlers, callback);
  }

  /**
   * Unregisters a map change size event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapChangeSize(callback: MapChangeSizeDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapChangeSizeHandlers, callback);
  }

  /**
   * Emits a map projection changed event.
   *
   * @param event - The projection change event
   */
  #emitMapProjectionChanged(event: { projection: OLProjection }): void {
    // Emit the event
    EventHelper.emitEvent(this, this.#onMapProjectionChangedHandlers, event);
  }

  /**
   * Registers a map projection change event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapProjectionChanged(callback: MapProjectionChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onMapProjectionChangedHandlers, callback);
  }

  /**
   * Unregisters a map projection changed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapProjectionChanged(callback: MapChangeSizeDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapChangeSizeHandlers, callback);
  }

  /**
   * Emits a component added event to all handlers.
   */
  #emitMapComponentAdded(event: MapComponentAddedEvent): void {
    // Emit the component added event for all handlers
    EventHelper.emitEvent(this, this.#onMapComponentAddedHandlers, event);
  }

  /**
   * Registers a component added event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapComponentAdded(callback: MapComponentAddedDelegate): void {
    // Register the component added event handler
    EventHelper.onEvent(this.#onMapComponentAddedHandlers, callback);
  }

  /**
   * Unregisters a component added event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapComponentAdded(callback: MapComponentAddedDelegate): void {
    // Unregister the component added event handler
    EventHelper.offEvent(this.#onMapComponentAddedHandlers, callback);
  }

  /**
   * Emits a component removed event to all handlers.
   */
  #emitMapComponentRemoved(event: MapComponentRemovedEvent): void {
    // Emit the component removed event for all handlers
    EventHelper.emitEvent(this, this.#onMapComponentRemovedHandlers, event);
  }

  /**
   * Registers a component removed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapComponentRemoved(callback: MapComponentRemovedDelegate): void {
    // Register the component removed event handler
    EventHelper.onEvent(this.#onMapComponentRemovedHandlers, callback);
  }

  /**
   * Unregisters a component removed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapComponentRemoved(callback: MapComponentRemovedDelegate): void {
    // Unregister the component removed event handler
    EventHelper.offEvent(this.#onMapComponentRemovedHandlers, callback);
  }

  /**
   * Emits a language changed event to all handlers.
   */
  #emitMapLanguageChanged(event: MapLanguageChangedEvent): void {
    // Emit the component removed event for all handlers
    EventHelper.emitEvent(this, this.#onMapLanguageChangedHandlers, event);
  }

  /**
   * Registers a language changed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onMapLanguageChanged(callback: MapLanguageChangedDelegate): void {
    // Register the component removed event handler
    EventHelper.onEvent(this.#onMapLanguageChangedHandlers, callback);
  }

  /**
   * Unregisters a language changed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapLanguageChanged(callback: MapLanguageChangedDelegate): void {
    // Unregister the component removed event handler
    EventHelper.offEvent(this.#onMapLanguageChangedHandlers, callback);
  }

  // #endregion
}

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
 * Delegate for the map init event handler function signature.
 */
export type MapInitDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Delegate for the map ready event handler function signature.
 */
export type MapReadyDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Delegate for the map layers processed event handler function signature.
 */
export type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Delegate for the map layers loaded event handler function signature.
 */
export type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Event for the map move end delegate.
 */
export type MapMoveEndEvent = {
  lonlat: Coordinate;
};

/**
 * Delegate for the map move end event handler function signature.
 */
export type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;

/**
 * Event for the map pointer move delegate.
 */
export type MapPointerMoveEvent = TypeMapMouseInfo;

/**
 * Delegate for the map pointer move event handler function signature.
 */
export type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent, void>;

/**
 * Event for the map single click delegate.
 */
export type MapSingleClickEvent = TypeMapMouseInfo;

/**
 * Delegate for the map single click event handler function signature.
 */
export type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent, void>;

/**
 * Event for the map zoom end delegate.
 */
export type MapZoomEndEvent = {
  zoom: number;
};

/**
 * Delegate for the map zoom end event handler function signature.
 */
export type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent, void>;

/**
 * Event for the map rotation delegate.
 */
export type MapRotationEvent = {
  rotation: number;
};

/**
 * Delegate for the map rotation event handler function signature.
 */
export type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent, void>;

/**
 * Event for the map change size delegate.
 */
export type MapChangeSizeEvent = {
  size: Size;
};

/**
 * Delegate for the map change size event handler function signature.
 */
export type MapChangeSizeDelegate = EventDelegateBase<MapViewer, MapChangeSizeEvent, void>;

/**
 * Event for the map projection changed delegate.
 */
export type MapProjectionChangedEvent = {
  projection: OLProjection;
};

/**
 * Delegate for the map projection changed event handler function signature.
 */
export type MapProjectionChangedDelegate = EventDelegateBase<MapViewer, MapProjectionChangedEvent, void>;

/**
 * Event for the map component added delegate.
 */
export type MapComponentAddedEvent = {
  mapComponentId: string;
  component: JSX.Element;
};

/**
 * Delegate for the map component added event handler function signature.
 */
export type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent, void>;

/**
 * Event for the map component removed delegate.
 */
export type MapComponentRemovedEvent = {
  mapComponentId: string;
};

/**
 * Delegate for the map component removed event handler function signature.
 */
export type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent, void>;

/**
 * Event for the map language changed delegate.
 */
export type MapLanguageChangedEvent = {
  language: TypeDisplayLanguage;
};

/**
 * Delegate for the map language changed event handler function signature.
 */
export type MapLanguageChangedDelegate = EventDelegateBase<MapViewer, MapLanguageChangedEvent, void>;

/**
 * Define a return type for a map click simulation to be able to await on different promises.
 */
export type SimulatedMapClick = {
  /** Promise resolving when the query of the map click is complete */
  promiseQuery: Promise<void>;
  /** Promise resolving when the query of the map click is complete and the UI has been updated */
  promiseQueryBatched: Promise<void>;
};
