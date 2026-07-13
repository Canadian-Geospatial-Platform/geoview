import type { Root } from 'react-dom/client';

import type { i18n } from 'i18next';

import { Overlay, type MapBrowserEvent, type MapEvent } from 'ol';
import { ObjectEvent } from 'ol/Object';
import OLMap from 'ol/Map';
import type { FitOptions, ViewOptions } from 'ol/View';
import View from 'ol/View';
import type { Coordinate } from 'ol/coordinate';
import type { Extent } from 'ol/extent';
import type { Type as OLGeomType } from 'ol/geom/Geometry';
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
  TypeStyleGeometry,
  TypeMapMouseInfo,
  TypeMapState,
  TypeMapViewSettings,
} from '@/api/types/map-schema-types';
import {
  MAP_CENTER,
  MAP_EXTENTS,
  VALID_ZOOM_LEVELS,
  VALID_DISPLAY_LANGUAGE,
  VALID_DISPLAY_THEME,
  VALID_PROJECTION_CODES,
  MAP_ZOOM_LEVEL,
  MAX_EXTENTS_RESTRICTION_LONLAT,
} from '@/api/types/map-schema-types';
import type { EffectiveLayerScales, TypeLegend } from '@/api/types/layer-schema-types';

import { BasemapApi, type BasemapErrorEvent } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Projection } from '@/geo/utils/projection';

import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { Plugin } from '@/api/plugin/plugin';
import type { PluginsContainer } from '@/api/plugin/plugin-types';
import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { UIDomain } from '@/core/domains/ui-domain';
import { LayerDomain } from '@/core/domains/layer-domain';
import { AppBarApi } from '@/core/components/app-bar/app-bar-api';
import { NavBarApi } from '@/core/components/nav-bar/nav-bar-api';
import { FooterBarApi } from '@/core/components/footer-bar/footer-bar-api';
import { StateApi } from '@/core/stores/state-api';
import { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { Fetch } from '@/core/utils/fetch-helper';

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
import { delay, generateId, getLocalizedMessage } from '@/core/utils/utilities';
import { debounce } from '@/core/utils/debounce';
import type { TimeIANA } from '@/core/utils/date-mgt';
import { logger } from '@/core/utils/logger';
import { DEFAULT_OL_FITOPTIONS, NORTH_POLE_POSITION_LONLAT, OL_ZOOM_DURATION } from '@/core/utils/constant';
import type { TypeMapFeaturesConfig, TypeHTMLElement } from '@/core/types/global-types';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { InvalidExtentError } from '@/core/exceptions/geoview-exceptions';
import { Notifications } from '@/core/utils/notifications';
import {
  getStoreMapCurrentBasemapOptionsOrInitial,
  getStoreMapConfigViewSettings,
  getStoreMapStateJson,
  type TypeScaleInfo,
} from '@/core/stores/states/map-state';
import { TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH, type TypeFeatureInfoResultSet } from '@/core/stores/states/feature-info-state';
import { GeoUtilities } from '@/geo/utils/utilities';

import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { FeatureHighlight } from './feature-highlight';

/**
 * Class used to manage created maps.
 */
export class MapViewer {
  /** Minimum delay (in milliseconds) for map to be in loading state */
  static readonly #MIN_DELAY_LOADING = 2000; // 2 seconds

  /** Default densification number when forming layer extents, to make ture to compensate for earth curvature */
  static DEFAULT_STOPS = 25;

  /** Default DPI values */
  static readonly DEFAULT_DPI_OPEN_LAYERS_LEGACY: number = 25.4 / 0.28; // <-- 90.71428571428571
  static readonly DEFAULT_DPI_MODERN: number = 96; // <--- Modern web maps almost universally assume 96 DPI for screens
  static DEFAULT_DPI: number = MapViewer.DEFAULT_DPI_MODERN;

  /** Default inches per meter used by OpenLayers */
  static readonly DEFAULT_INCHES_PER_METER = 39.3700787;

  /** Buffer applied to effective scale calculations to account for visibility thresholds */
  static readonly EFFECTIVE_SCALE_VISIBILITY_BUFFER = 0.11;

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
  // TO.DOCONT: At the same time, we should remove the 'store' imports (getStore, setStore, etc), because the MapViewer shouldn't 'know' about any stores.
  // TO.DOCONT: That's another big refactor to come, because we sill use the MapViewer very much like an application class instead of a domain class when
  // TO.DOCONT: we do things like cgpv.api.getMapViewer().doSomething.
  /**
   * The controller registry owning all framework-level controllers.
   *
   * Try not to use this accessor, as it creates a backwards dependency from the domain to the controllers.
   * It is here for legacy reasons, but should be removed in the future.
   */
  controllers: ControllerRegistry;

  /** Max number of icons cached */
  iconImageCacheSize = 1;

  /** Indicates if the map has been initialized */
  #mapInit = false;

  /** Indicates if the map is ready */
  #mapReady = false;

  /** Indicates if the map has all its layers processed upon launch */
  #mapLayersProcessed = false;

  /** Indicates if the map has all its layers loaded upon launch */
  #mapLayersLoaded = false;

  /** The click marker overlay */
  #clickMarkerOverlay?: Overlay;

  /** The north pole marker overlay */
  #northPoleMarkerOverlay?: Overlay;

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
  #pointerHandlersEnabled = true;

  /** Callback delegates for the map pointer move event */
  #onMapPointerMoveHandlers: MapPointerMoveDelegate[] = [];

  /** Callback delegates for the map mouse enter event */
  #onMapMouseEnterHandlers: MapMouseEnterDelegate[] = [];

  /** Callback delegates for the map mouse leave event */
  #onMapMouseLeaveHandlers: MapMouseLeaveDelegate[] = [];

  /** Callback delegates for the map pointer stop event */
  #onMapPointerStopHandlers: MapPointerMoveDelegate[] = [];

  /** Callback delegates for the map single click event */
  #onMapSingleClickHandlers: MapSingleClickDelegate[] = [];

  /** Callback delegates for the map zoom end event */
  #onMapResolutionChangedHandlers: MapResolutionChangedDelegate[] = [];

  /** Callback delegates for the map rotation event */
  #onMapRotationHandlers: MapRotationDelegate[] = [];

  /** Callback delegates for the map change size event */
  #onMapSizeChangedHandlers: MapSizeChangedDelegate[] = [];

  /** Callback delegates for the map projection changed event */
  #onMapProjectionChangeStartedHandlers: MapProjectionChangedDelegate[] = [];

  /** Callback delegates for the map projection changed event */
  #onMapProjectionChangedHandlers: MapProjectionChangedDelegate[] = [];

  /** Callback delegates for the map component added event */
  #onMapComponentAddedHandlers: MapComponentAddedDelegate[] = [];

  /** Callback delegates for the map component removed event */
  #onMapComponentRemovedHandlers: MapComponentRemovedDelegate[] = [];

  /** Callback delegates for the interaction changed event */
  #onMapInteractionChangedHandlers: MapInteractionChangedDelegate[] = [];

  /** Callback delegates for the map language changed event */
  #onMapLanguageChangedHandlers: MapLanguageChangedDelegate[] = [];

  /** Callback delegates for the marker icon showed event */
  #onMarkerIconShowedHandlers: MarkerIconShowedDelegate[] = [];

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

  /** Bounded reference to the handle basemap error */
  #boundedHandleBasemapError: (sender: BasemapApi, event: BasemapErrorEvent) => void;

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

    // Initialize the ui domain
    this.#uiDomain = new UIDomain(
      i18instance,
      mapFeaturesConfig.displayLanguage ?? 'en',
      mapFeaturesConfig.theme ?? 'geo.ca',
      mapFeaturesConfig.globalSettings?.displayDateMode ?? 'long',
      'local'
    );
    this.#layerDomain = new LayerDomain();

    // Initialize the controller registry
    this.controllers = new ControllerRegistry(this, this.#uiDomain, this.#layerDomain);

    // The geometry api
    this.geometry = new GeometryApi(this);

    // The feature highlight api
    this.featureHighlight = new FeatureHighlight(this, this.controllers.mapController);

    this.appBarApi = new AppBarApi(this.controllers.uiController);
    this.navBarApi = new NavBarApi(this.controllers.uiController);
    this.footerBarApi = new FooterBarApi(this.controllers.uiController);
    this.stateApi = new StateApi(this.controllers.layerController);
    this.notifications = new Notifications(this.controllers.uiController);

    this.modal = new ModalApi();

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new BasemapApi(this, this.controllers.mapController, getStoreMapCurrentBasemapOptionsOrInitial(this.mapId));

    // Initialize layer api
    this.layer = new LayerApi(this.controllers, this.#layerDomain, this.geometry, this.featureHighlight);

    // Bind hooks
    this.#boundedHandleBasemapError = this.#handleBasemapError.bind(this);

    // Mouse bounded handle references
    this.#boundedHandleMapPointerMove = this.#handleMapPointerMove.bind(this);
    this.#boundedHandleMapPointerStopped = this.#handleMapPointerStopped.bind(this);
    this.#boundedHandleMapSingleClick = this.#handleMapSingleClick.bind(this);
    this.#boundedHandleMapPointerStoppedDebounced = debounce(this.#boundedHandleMapPointerStopped, 750, { leading: false });
    this.#boundedHandleMapSingleClickDebounced = debounce(this.#boundedHandleMapSingleClick, 1000, { leading: true });

    // Register handler when basemap has error
    this.basemap.onBasemapError(this.#boundedHandleBasemapError);
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

    // GV Patch: guard against OpenLayers race condition known issue where redrawText iterates stale layerStatesArray
    // GV entries with null layers during layer removal or projection changes (font-load event timing).
    const originalRedrawText = this.map.redrawText.bind(this.map);
    this.map.redrawText = (): void => {
      try {
        originalRedrawText();
      } catch (e) {
        // Suppress stale frameState race condition during layer removal
        logger.logDebug('Suppressed OL redrawText race condition', e);
      }
    };

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
    this.initMapControls();

    // Load the core packages plugins
    await this.#loadCorePackages();

    // Load plugins configured in footer-bar and app-bar tabs
    await this.controllers.pluginController.loadConfiguredPlugins();

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

    // Repeat the last feature query performed once all layers are loaded, the last click coordinates are set from initialClickCoordinate at this point.
    // This is mainly used to restore map state from createMapConfigFromMapState, but can be used through config to set an initial query.
    this.#initLastQuery();

    // Here, all base-level "this.mapFeaturesConfig.map.listOfGeoviewLayerConfig" have been registered (layerStatus === 'registered').
    // However, careful, the layers are still processing and some sub-layer-entries can get registered on-the-fly (notably: EsriDynamic, WMS).

    // Ready the map
    return this.#readyMap();
  }

  /**
   * Initializes the map controls
   */
  initMapControls(): void {
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

    // Create an overlay for the north pole icon
    const northPoleId = `${mapId}-northpole`;
    const northPolePosition = Projection.transformFromLonLat(
      [NORTH_POLE_POSITION_LONLAT[1], NORTH_POLE_POSITION_LONLAT[0]],
      this.getProjection()
    );
    this.#northPoleMarkerOverlay = new Overlay({
      id: northPoleId,
      position: northPolePosition,
      positioning: 'center-center',
      element: document.getElementById(northPoleId) as HTMLElement,
      stopEvent: false,
    });
    map.addOverlay(this.#northPoleMarkerOverlay);

    // Create an overlay for click marker icon
    const clickMarkerId = `${mapId}-clickmarker`;
    this.#clickMarkerOverlay = new Overlay({
      id: clickMarkerId,
      position: [-1, -1],
      positioning: 'center-center',
      offset: [-18, -30],
      element: document.getElementById(clickMarkerId) as HTMLElement,
      stopEvent: false,
    });
    map.addOverlay(this.#clickMarkerOverlay);
  }

  /**
   * Returns the click marker overlay.
   *
   * @returns The click marker overlay
   */
  getClickMarkerOverlay(): Overlay {
    // GV Using '!' here, because initMapControls is always supposed to be executed
    return this.#clickMarkerOverlay!;
  }

  /**
   * Returns the north pole marker overlay.
   *
   * @returns The north pole marker overlay
   */
  getNorthPoleMarkerOverlay(): Overlay {
    // GV Using '!' here, because initMapControls is always supposed to be executed
    return this.#northPoleMarkerOverlay!;
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
   * Set the display language of the map.
   *
   * @param displayLanguage - The language to use (en, fr)
   * @param reloadLayers - Optional flag to ask viewer to reload layers with the new localize language
   * @returns A promise that resolves when the language change is complete
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself
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
   * Returns the current display theme.
   *
   * @returns The display theme
   */
  getDisplayTheme(): TypeDisplayTheme {
    return this.#uiDomain.getDisplayTheme();
  }

  /**
   * Set the display theme of the map.
   *
   * @param displayTheme - The theme to use (geo.ca, light, dark)
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself
  setTheme(displayTheme: TypeDisplayTheme): void {
    if (VALID_DISPLAY_THEME.includes(displayTheme)) {
      this.controllers.uiController.setDisplayTheme(displayTheme);
    } else this.notifications.addNotificationError(getLocalizedMessage(this.getDisplayLanguage(), 'validation.changeDisplayTheme'));
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
   * @param mapViewSettings - Map viewSettings object
   */
  setView(mapViewSettings: TypeViewSettings): void {
    const currentView = this.getView();
    const viewOptions: ViewOptions = {};
    viewOptions.projection = `EPSG:${mapViewSettings.projection}`;
    viewOptions.zoom = mapViewSettings.initialView?.zoomAndCenter ? mapViewSettings.initialView?.zoomAndCenter[0] : currentView.getZoom();
    viewOptions.center = mapViewSettings.initialView?.zoomAndCenter
      ? Projection.transformFromLonLat(
          mapViewSettings.initialView?.zoomAndCenter[1],
          Projection.getProjectionFromStringOrNumber(viewOptions.projection)
        )
      : Projection.transformFromLonLat(
          Projection.transformToLonLat(currentView.getCenter()!, currentView.getProjection()),
          Projection.getProjectionFromStringOrNumber(viewOptions.projection)
        );
    viewOptions.minZoom = mapViewSettings.minZoom ? mapViewSettings.minZoom : currentView.getMinZoom();
    viewOptions.maxZoom = mapViewSettings.maxZoom ? mapViewSettings.maxZoom : currentView.getMaxZoom();
    viewOptions.rotation = mapViewSettings.rotation ? mapViewSettings.rotation : currentView.getRotation();

    if (mapViewSettings.maxExtent) {
      const projObj = Projection.getProjectionFromStringOrNumber(mapViewSettings.projection);
      viewOptions.extent = MapViewer.#computeViewExtent(Number(mapViewSettings.projection), mapViewSettings.maxExtent, projObj);
    }

    const newView = new View(viewOptions);
    this.map.setView(newView);

    // Because the view has changed we must re-register the view handlers
    this.#registerViewHandlers(newView);
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
   * Gets the map projection.
   *
   * @returns The map projection
   */
  getProjection(): OLProjection {
    return this.getView().getProjection();
  }

  /**
   * Gets the map projection EPSG string.
   *
   * @returns The map projection EPSG string
   */
  getProjectionEPSG(): string {
    return this.getProjection().getCode();
  }

  /**
   * Gets the map projection number.
   *
   * @returns The map projection number
   */
  getProjectionNumber(): TypeValidMapProjectionCodes {
    return Projection.readEPSGNumber(this.getProjection()) as TypeValidMapProjectionCodes;
  }

  /**
   * Set the display projection of the map.
   *
   * @param projectionNumber - The projection code (3978, 3857)
   * @param maxExtent - Optional max extent for the view
   * @returns True if the projection was changed, false if the projection code is unsupported
   */
  setProjection(projectionNumber: TypeValidMapProjectionCodes): boolean {
    if (VALID_PROJECTION_CODES.includes(Number(projectionNumber))) {
      // Get the current projection
      const currentProjection = this.getProjection();

      // Get the new projection
      const newProjection = Projection.PROJECTIONS[projectionNumber];

      // Get the view settings as configured
      const viewSettings = getStoreMapConfigViewSettings(this.mapId);

      // Get view status (center and projection) to calculate new center
      const currentView = this.getView();
      const currentCenter = currentView.getCenter();
      const currentProjectionCode = currentProjection.getCode();
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjectionCode, Projection.PROJECTION_NAMES.LONLAT)[0] as [
        number,
        number,
      ];

      // GV The extent is different between LCC and WM and switching from one to the other may introduce weird constraint.
      // GV We may have to keep extent as array for configuration file but, technically, user does not change projection often.
      // GV A wider LCC extent like [-125, 30, -60, 89] (minus -125) will introduce distortion on larger screen...
      // GV It is why we apply the max extent only on native projection, otherwise we send undefined so that it applies default
      // If we're switching to the projection as configured
      let maxExtent4326 = MAX_EXTENTS_RESTRICTION_LONLAT[projectionNumber];
      if (projectionNumber === viewSettings?.projection && viewSettings.maxExtent) {
        maxExtent4326 = viewSettings.maxExtent;
      }

      // Create new view settings
      const newView: TypeViewSettings = {
        initialView: { zoomAndCenter: [currentView.getZoom() as number, centerLatLng] },
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: maxExtent4326,
        projection: projectionNumber,
      };

      // Emit about the projection change has started
      this.#emitMapProjectionChangeStarted({ projection: newProjection, previousProjection: currentProjection });

      // Before changing the view, clear the basemaps right away to prevent a moment where a
      // vector tile basemap might, momentarily, be in different projection than the view.
      // Note: It seems that since OpenLayers 10.5 OpenLayers throws an exception about this. So this line was added.
      this.basemap.clearBasemaps();

      // Set the view
      this.setView(newView);

      // Update the north pole position based on the new projection
      const northPolePosition = Projection.transformFromLonLat(
        [NORTH_POLE_POSITION_LONLAT[1], NORTH_POLE_POSITION_LONLAT[0]],
        newProjection
      );
      this.getNorthPoleMarkerOverlay().setPosition(northPolePosition);

      // Emit to outside
      this.#emitMapProjectionChanged({ projection: newProjection, previousProjection: currentProjection });
      return true;
    }

    // Unsupported
    this.notifications.addNotificationError('validation.changeDisplayProjection');
    return false;
  }

  /**
   * Gets the ordered layer paths.
   *
   * @returns The ordered layer paths
   * @deprecated This method doesn't seem to be used anymore, remove?
   */
  // TODO: REFACTOR MAPVIEWER - Move this function to the 'layer api'
  getMapLayerOrderPaths(): string[] {
    // Redirect to controller
    return this.controllers.layerController.getMapLayerOrderPaths();
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
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself
  getGeolocatorSearchArea(): { coords: Coordinate; bbox?: Extent } | undefined {
    // Redirect to controller
    return this.controllers.uiController.getMapGeolocatorSearchArea();
  }

  /**
   * Set fullscreen / exit fullscreen.
   *
   * @param status - Toggle fullscreen or exit fullscreen status
   * @param element - The element to toggle fullscreen on
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself
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

    // Register or unregister pointer handlers
    if (interaction === 'static') {
      this.unregisterMapPointerHandlers(this.map);
    } else {
      this.registerMapPointerHandlers(this.map);
    }

    // Emit about it
    this.#emitMapInteractionChanged({ interaction });
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
    // Redirect to UI domain
    this.#uiDomain.setDisplayDateTimezone(displayDateTimezone);
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
   * @returns The closest scale for the given zoom number, rounded to the nearest unit, or undefined if meters per unit is unavailable
   */
  getMapScaleFromZoom(zoom: number): number | undefined {
    const projection = this.getProjection();
    const mpu = projection.getMetersPerUnit();
    if (!mpu) return undefined;

    // Get resolution for zoom level
    const resolution = this.getView().getResolutionForZoom(zoom);

    // Calculate scale from resolution
    // Scale = Resolution * metersPerUnit * inchesPerMeter * DPI
    const scale = resolution * mpu * MapViewer.DEFAULT_INCHES_PER_METER * MapViewer.DEFAULT_DPI;

    // Round the scale to the nearest unit
    return Math.round(scale);
  }

  /**
   * Converts a map scale denominator to the corresponding zoom level.
   *
   * @param scale - The scale denominator (e.g. 50000 for 1:50,000)
   * @returns The zoom level for the given scale, or undefined if conversion is unavailable
   */
  getZoomFromScale(scale: number): number | undefined {
    const resolution = this.getMapResolutionFromScale(scale);
    if (resolution === undefined) return undefined;
    return this.getView().getZoomForResolution(resolution) ?? undefined;
  }

  /**
   * Converts a map scale denominator (1:X) into the corresponding OpenLayers resolution.
   *
   * Resolution is computed using: resolution = scale / (metersPerUnit * inchesPerMeter * dpi)
   *
   * @param targetScale - The scale denominator (e.g., 50000000 for 1:50,000,000). Optional; returns undefined if not provided
   * @param dpiValue - Dots per inch to use for conversion. Defaults to `MapViewer.DEFAULT_DPI` (usually 96 or 90.714 depending on standard)
   * @returns The map resolution in map units per pixel, or `undefined` if `targetScale` is not provided
   */
  getMapResolutionFromScale(targetScale: number | undefined, dpiValue: number = MapViewer.DEFAULT_DPI): number | undefined {
    if (!targetScale) return undefined;
    const projection = this.getProjection();
    const mpu = projection.getMetersPerUnit()!;

    // Resolution = Scale / ( metersPerUnit * inchesPerMeter * DPI )
    return targetScale / (mpu * MapViewer.DEFAULT_INCHES_PER_METER * dpiValue);
  }

  /**
   * Animates the map to the specified zoom level.
   *
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param zoom - The target zoom level
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @param duration - Optional animation duration in ms
   * @returns A promise that resolves when the zoom animation is complete
   */
  zoomMap(zoom: number, useAnimation = true, duration: number = OL_ZOOM_DURATION): Promise<void> {
    // If using animation
    if (useAnimation) {
      // Resolve when OL signals animation completion (immune to background-tab setTimeout throttling)
      return new Promise<void>((resolve) => {
        this.getView().animate({ zoom, duration }, () => resolve());
        // GV No need to Save to the store, because this will trigger an event on MapViewer which will take care of updating the store
      });
    }

    // Straight fast zoom
    this.setMapZoomLevel(zoom);
    return Promise.resolve();
  }

  /**
   * Zoom to specified extent or coordinate provided in lonlat.
   *
   * @param extent - The extent or coordinate to zoom to
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @param options - Optional options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 })
   * @returns A promise that resolves when the zoom operation completes
   */
  zoomToLonLatExtentOrCoordinate(extent: Extent | Coordinate, useAnimation = true, options?: FitOptions): Promise<void> {
    const fullExtent = extent.length === 2 ? [extent[0], extent[1], extent[0], extent[1]] : extent;
    const projectedExtent = Projection.transformExtentFromProj(fullExtent, Projection.getProjectionLonLat(), this.getProjection());
    return this.zoomToExtent(projectedExtent, useAnimation, options);
  }

  /**
   * Set the map zoom level instantaneously, no animation.
   *
   * @param zoom - New zoom level
   */
  setMapZoomLevel(zoom: number): void {
    const view = this.getView();
    // eslint-disable-next-line no-param-reassign
    if (zoom < view.getMinZoom()) zoom = view.getMinZoom();
    // eslint-disable-next-line no-param-reassign
    if (zoom > view.getMaxZoom()) zoom = view.getMaxZoom();

    // If zoom level is already set at this value, just return
    if (view.getZoom() === zoom) return;

    // Set zoom level
    this.getView().setZoom(zoom);
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

    // Perform the map click
    const promiseQuery = this.controllers.layerSetController.performMapClickAction(clickCoordinates);

    // Wait for the query + UI batch propagation delay + buffer to make sure of Zustand delays
    const promiseQueryBatched = promiseQuery.then(() => delay(TIME_DELAY_BETWEEN_PROPAGATION_FOR_BATCH + 300));

    // Emit the single click event which triggers the feature info query
    this.#emitMapSingleClick(clickCoordinates);

    // Return the simulated map click information
    return { promiseQuery, promiseQueryBatched };
  }

  /**
   * Shows a marker on the map.
   *
   * @param marker - The marker to add
   * @returns The projected coordinates of the marker, in the same projection of the map
   */
  clickMarkerIconShow(marker: TypeClickMarker): number[] {
    // Project coords
    const projectedCoords = Projection.transformPoints(
      [marker.lonlat],
      Projection.PROJECTION_NAMES.LONLAT,
      this.getProjection().getCode()
    )[0];

    // Set it on the MapViewer
    this.getClickMarkerOverlay().setPosition(projectedCoords);

    // Emit the marker icon showed event
    this.#emitMarkerIconShowed({ projectedCoords });

    // Return the projected coordinates
    return projectedCoords;
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

    // Unhook the basemap error handler
    this.basemap.offBasemapError(this.#boundedHandleBasemapError);

    // Remove all controls
    this.map.getControls().clear();

    // Remove all interactions
    this.map.getInteractions().clear();

    // Unset the map target to remove the DOM link
    this.map.setTarget(undefined);
  }

  /**
   * Zooms to the specified extent.
   *
   * @param extent - The extent to zoom to
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @param options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 })
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the extent is invalid
   */
  zoomToExtent(extent: Extent, useAnimation = true, options: FitOptions = DEFAULT_OL_FITOPTIONS): Promise<void> {
    // Merge user options with defaults
    const mergedOptions: FitOptions = { ...DEFAULT_OL_FITOPTIONS, ...options };

    // Validate the extent coordinates - need to make sure we aren't excluding zero with !number or using invalid extents
    const validatedExtent = GeoUtilities.validateExtent(extent, this.getProjectionEPSG());
    if (
      validatedExtent.some((number) => {
        return (!number && number !== 0) || Number.isNaN(number);
      })
    ) {
      // Invalid extent
      this.notifications.showWarning('error.map.invalidZoomExtent');
      throw new InvalidExtentError(extent);
    }

    // If not using animation
    const userCallback = mergedOptions.callback;
    if (!useAnimation) {
      mergedOptions.duration = 0;
    }

    // Perform the fit operation and call the userCallback and resolve the promise upon fit callback
    return new Promise<void>((resolve) => {
      // Use the validated (clamped) extent so out-of-bounds coordinates are accepted after clamping
      this.getView().fit(validatedExtent, {
        ...mergedOptions,
        callback: (complete) => {
          userCallback?.(complete);
          resolve();
        },
      });
    });
  }

  /**
   * Sets the home button view settings for the map.
   *
   * @param view - The view settings to set for the home button
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself (more applicative) (or if so, keep the home view settings at the domain level instead of coupling to store via controller here)
  setHomeButtonView(view: TypeMapViewSettings): void {
    // Redirect to controller
    this.controllers.mapController.setHomeButtonView(view);
  }

  /**
   * Returns to initial view state of the map using config.
   *
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @returns A promise that resolves when the zoom animation is complete
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself (more applicative)
  zoomToInitialExtent(useAnimation = true): Promise<void> {
    // Redirect to controller
    return this.controllers.mapController.zoomToInitialExtent(useAnimation);
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
   * @returns A promise that resolves when the map is ready
   */
  waitForMapReady(): Promise<MapBaseEvent> {
    // If already ready
    if (this.#mapReady) return Promise.resolve({});

    // Wait for onMapReady to be triggered
    return this.onceMapReady();
  }

  /**
   * Waits for the next map move-end event to be emitted.
   *
   * @returns A promise that resolves when the map move-end event fires
   */
  waitForMoveEnd(): Promise<MapMoveEndEvent> {
    // Get the view
    const view = this.getView();

    // If the map is not currently moving, there is nothing to wait for
    if (!view.getAnimating() && !view.getInteracting()) return Promise.resolve({ lonlat: this.getView().getCenter()! });

    // Return a promise that resolves when the map move-end event fires
    return this.onceMapMoveEnd();
  }

  /**
   * Waits for the next rendercomplete event to be emitted.
   *
   * Forces a synchronous frame via `map.renderSync()` so `rendercomplete` is guaranteed to fire,
   * even when the map is idle. Without this, waiting on `rendercomplete` for an idle map hangs
   * forever because OL does not schedule a frame unless something invalidates the view.
   *
   * @returns A promise that resolves when the map render is complete
   */
  waitForRender(): Promise<void> {
    // Return a promise that resolves when the map render is complete
    return new Promise((resolve) => {
      this.map.once('rendercomplete', () => resolve());
      this.map.renderSync();
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
  initDrawInteractions(geomGroupKey: string, type: OLGeomType, style: TypeFeatureStyle, geometryFunction?: GeometryFunction): Draw {
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
   * @param mapId - The unique identifier of the map
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
   * Computes the effective minimum and maximum scales for a layer from its configuration and initial settings.
   *
   * Combines scales from configuration and initial settings zoom levels, selecting the most restrictive value.
   *
   * @param mapViewer - The map viewer used for zoom-to-scale conversions
   * @param layerConfig - The layer configuration to compute scales from
   * @returns Object with effective scale thresholds and buffered visibility limits
   */
  static computeEffectiveLayerScales(mapViewer: MapViewer, layerConfig: ConfigBaseClass): EffectiveLayerScales {
    const initialSettings = layerConfig.getInitialSettings();

    // Zoom-in limit (maxScale: smaller denominator, e.g. 1:50 000)
    // Most restrictive = largest value (requires being less zoomed-in to be visible)
    const maxScaleFromConfig = layerConfig.getMaxScaleIncludingParent();
    const maxScaleFromInitialSettingsZoom =
      initialSettings?.maxZoom !== undefined ? mapViewer.getMapScaleFromZoom(initialSettings.maxZoom) : undefined;
    const effectiveMaxScaleCandidates = [maxScaleFromConfig, maxScaleFromInitialSettingsZoom].filter(
      (scale): scale is number => scale !== undefined
    );
    const effectiveMaxScale = effectiveMaxScaleCandidates.length ? Math.max(...effectiveMaxScaleCandidates) : undefined;

    // Zoom-out limit (minScale: larger denominator, e.g. 1:1 000 000)
    // Most restrictive = smallest value (restricts how far out the user can zoom)
    const minScaleFromConfig = layerConfig.getMinScaleIncludingParent();
    const minScaleFromInitialSettingsZoom =
      initialSettings?.minZoom !== undefined ? mapViewer.getMapScaleFromZoom(initialSettings.minZoom) : undefined;
    const effectiveMinScaleCandidates = [minScaleFromConfig, minScaleFromInitialSettingsZoom].filter(
      (scale): scale is number => scale !== undefined
    );
    const effectiveMinScale = effectiveMinScaleCandidates.length ? Math.min(...effectiveMinScaleCandidates) : undefined;

    // Round the effective scales
    const roundedMaxScale = effectiveMaxScale ? Math.round(effectiveMaxScale) : undefined;
    const roundedMinScale = effectiveMinScale ? Math.round(effectiveMinScale) : undefined;

    // Calculate the max/min scale tolerances for which the layer should be considered non-visible, because we can't guarantee the service will actually return information or not (too close to limit)
    const maxScaleTolerance = roundedMaxScale ? Math.round(roundedMaxScale * (1 + MapViewer.EFFECTIVE_SCALE_VISIBILITY_BUFFER)) : undefined;
    const minScaleTolerance = roundedMinScale ? Math.round(roundedMinScale * (1 - MapViewer.EFFECTIVE_SCALE_VISIBILITY_BUFFER)) : undefined;

    return {
      maxScale: roundedMaxScale,
      maxScaleZoomAt: maxScaleTolerance, // Same as the tolerance, adjust this to add an additional offset if necessary
      minScale: roundedMinScale,
      minScaleZoomAt: minScaleTolerance, // Same as the tolerance, adjust this to add an additional offset if necessary
    };
  }

  /**
   * Gets if north pole is visible. This is not a perfect solution and is more a work around.
   *
   * This approach is rotation-agnostic — it works regardless of the map's current rotation angle.
   *
   * @returns True if the north pole is visible in the viewport, false otherwise
   */
  getNorthPoleVisibility(): boolean {
    // Transform north pole from lon/lat to map projection coordinates
    const northPoleMapCoord = Projection.transformFromLonLat(
      [NORTH_POLE_POSITION_LONLAT[1], NORTH_POLE_POSITION_LONLAT[0]],
      this.getProjection()
    );

    if (!northPoleMapCoord) return false;

    // Convert map coordinates to pixel position on the viewport
    const northPolePixel = this.map.getPixelFromCoordinate(northPoleMapCoord);
    if (!northPolePixel) return false;

    // Check if the pixel is within the map canvas
    const size = this.map.getSize();
    if (!size) return false;

    return northPolePixel[0] >= 0 && northPolePixel[0] <= size[0] && northPolePixel[1] >= 0 && northPolePixel[1] <= size[1];
  }

  /**
   * Get north arrow bearing. Angle use to rotate north arrow for non Web Mercator projection.
   * https://www.movable-type.co.uk/scripts/latlong.html
   *
   * @returns The arrow angle
   */
  getNorthArrowAngle(): number {
    try {
      // north value
      const pointA = { x: NORTH_POLE_POSITION_LONLAT[1], y: NORTH_POLE_POSITION_LONLAT[0] };

      // map center in lon/lat — rotation-safe since getCenter() returns the true view center
      const center: Coordinate = Projection.transformToLonLat(this.getView().getCenter()!, this.getProjection());
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
      return parseFloat(((bearing + 360) % 360).toFixed(1));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error: unknown) {
      return 180.0;
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
   * @param includeFeatureInfo - Optional - Indicates if feature info should be included in the config for each layer.
   * @returns Map config with current map state, or undefined if unavailable
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself
  createMapConfigFromMapState(
    overrideGeocoreServiceNames: boolean | 'hybrid' = true,
    includeFeatureInfo = false
  ): TypeMapFeaturesInstance | undefined {
    // Redirect to controller
    return this.controllers.mapController.createMapConfigFromMapState(overrideGeocoreServiceNames, includeFeatureInfo);
  }

  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   *
   * @param namePairs - The array of name pairs. Presumably one english and one french name in each pair
   * @param mapConfig - Optional config to modify, or one created using the current map state if not provided
   * @param removeUnlisted - Optional - Whether or not names not provided should be removed from config
   * @returns Map config with updated names, or undefined if no config is available
   */
  // TODO: REFACTOR MAPVIEWER - Move this function at the 'application' level, because it has nothing to do with the map itself
  replaceMapConfigLayerNames(
    namePairs: string[][],
    mapConfig?: TypeMapFeaturesConfig,
    removeUnlisted = false
  ): TypeMapFeaturesInstance | undefined {
    // Redirect to controller
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

      // Emit to the outside
      this.#emitMapMouseEnter({});
    });

    mapHTMLElement.addEventListener('mouseleave', () => {
      mapHTMLElement.blur();

      // Emit to the outside
      this.#emitMapMouseLeave({});
    });

    // Now that the map dom is loaded, register a handle when size is changing
    map.on('change:size', this.#handleMapSizeChanged.bind(this));

    // Register essential map-view handlers
    map.on('moveend', this.#handleMapMoveEnd.bind(this));
    map.on('postrender', this.#handleMapPostRender.bind(this));
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
    view.on('change:center', this.#handleViewCenterChanged.bind(this));
    view.on('change:resolution', this.#handleViewResolutionChanged.bind(this));
    view.on('change:rotation', this.#handleViewRotationChanged.bind(this));
  }

  /**
   * Computes the view extent for a given projection, handling projection-specific edge cases.
   *
   * For polar projections (e.g. EPSG:3573), transforming a lon/lat bounding box clips
   * the view too tightly, so the projection's own extent is used directly instead.
   *
   * @param projectionCode - The numeric projection code (e.g. 3978, 3857, 3573)
   * @param maxExtent - The max extent in lon/lat
   * @param projection - The OpenLayers projection object
   * @returns The computed view extent, or undefined if none could be determined
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
   */
  #handleMapMoveEnd(event: MapEvent): void {
    try {
      // Emit to the outside
      this.#emitMapMoveEnd({ lonlat: this.getView().getCenter()! });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapMoveEnd', error);
    }
  }

  /**
   * Handles when the map has finished rendering a frame.
   *
   * @param event - The map event associated with the post-render
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapPostRender(event: MapEvent): void {
    try {
      // Nothing?
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapPostRender', error);
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
      const projCode = this.getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = GeoUtilities.getPointerPositionFromMapEvent(event, projCode);

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
      const projCode = this.getProjection().getCode();

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
      const projCode = this.getProjection().getCode();

      // Get the pointer position information based on the map event
      const pointerPosition: TypeMapMouseInfo = GeoUtilities.getPointerPositionFromMapEvent(event, projCode);

      // Emit to the outside
      this.#emitMapSingleClick(pointerPosition);
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapSingleClick', error);
    }
  }

  /**
   * Handles when the view center changes.
   *
   * @param event - The event associated with the center change
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleViewCenterChanged(event: ObjectEvent): void {
    try {
      // Nothing?
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleViewCenterChanged', error);
    }
  }

  /**
   * Handles when the map zoom ends.
   *
   * @param event - The event associated with the zoom end
   */
  #handleViewResolutionChanged(event: ObjectEvent): void {
    try {
      // Read the zoom value
      const view = event.target;
      const resolution = view.getResolution();
      const zoom = view.getZoom();

      // Emit to the outside
      this.#emitMapResolutionChanged({ resolution, zoom });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleViewResolutionChanged', error);
    }
  }

  /**
   * Handles when the map rotates.
   *
   * @param event - The event associated with rotation
   */
  #handleViewRotationChanged(event: ObjectEvent): void {
    try {
      // Get the map rotation
      const rotation = this.getView().getRotation();

      // Emit to the outside
      this.#emitMapRotation({ rotation });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleViewRotationChanged', error);
    }
  }

  /**
   * Handles when the map changes size.
   *
   * @param event - The event associated with size change
   */
  #handleMapSizeChanged(event: ObjectEvent): void {
    try {
      // Get the size
      const size = this.map.getSize();
      if (!size) return;

      // Get the scale information
      const scale = MapViewer.getScaleInfoFromDomElement(this.mapId);

      // Emit to the outside
      this.#emitMapSizeChanged({ size, scale });
    } catch (error: unknown) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapSizeChanged', error);
    }
  }

  /**
   * Handles basemap errors.
   *
   * @param sender - The basemap API instance that triggered the error
   * @param event - The event containing error details
   */
  #handleBasemapError(sender: BasemapApi, event: BasemapErrorEvent): void {
    // Show the error using the GeoViewError messageKey and params
    this.notifications.showError(event.error.messageKey, event.error.messageParams);
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

    // Zoom on layers ids, if necessary, but don't wait for it
    this.#zoomOnLayerIdsMaybe().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('in #zoomOnLayerIdsMaybe in initMap', error);
    });

    // If there's a layer path that should be selected in footerBar or appBar configs, select it
    const selectedLayerPath =
      this.mapFeaturesConfig.footerBar?.selectedLayersLayerPath || this.mapFeaturesConfig.appBar?.selectedLayersLayerPath;
    if (selectedLayerPath) this.controllers.layerController.setSelectedLayerPath(selectedLayerPath);

    // Await for all layers to be 'loaded'
    await this.#checkMapLayersLoaded();

    // Create and dispatch the resolution change event to force the registration of layers in the
    // inVisibleRange array when layers are loaded.
    // This is to trigger a 'this.#handleViewResolutionChanged' once layers are loaded
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
        ? this.convertExtentLonLatToMapProj(this.mapFeaturesConfig.map.viewSettings.initialView.extent)
        : this.mapFeaturesConfig.map.viewSettings.initialView.extent;

      // Zoom to extent
      return this.zoomToExtent(extent, false, {
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
      if (!layerExtents || layerExtents.includes(Infinity)) {
        layerExtents = this.convertExtentLonLatToMapProj(MAP_EXTENTS[this.mapFeaturesConfig.map.viewSettings.projection]);
      }

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
    const layersCount = await this.layer.waitForAllLayersStatus('processed');

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
    const layersCount = await this.layer.waitForAllLayersStatus('loaded');

    // Log
    logger.logInfo(`Map is ready with ${layersCount} loaded layer entries`, this.mapId);
    logger.logMarkerCheck(`readyMap-${this.mapId}`, `for all ${layersCount} layer entries to be loaded`);

    // Is ready
    this.#mapLayersLoaded = true;
    this.#emitMapLayersLoaded();
  }

  /**
   * Function called to monitor when the map has its layers in loaded state and then repeat last query if any.
   *
   * This is done after the layers are loaded to ensure that the map features depending on the layers (details, geochart) are properly updated with the repeated query.
   */
  #initLastQuery(): void {
    this.layer
      .waitForLayersLoaded()
      .then(() => {
        this.controllers.layerSetController
          .repeatLastQueryIfAny(false)
          .then(() => {
            // Set selected layer paths for details if available in the config.
            if (this.mapFeaturesConfig.appBar?.selectedDetailsLayerPath || this.mapFeaturesConfig.footerBar?.selectedDetailsLayerPath) {
              this.controllers.detailsController.setSelectedLayerPath(
                this.mapFeaturesConfig.appBar?.selectedDetailsLayerPath || this.mapFeaturesConfig.footerBar?.selectedDetailsLayerPath!
              );
            }

            // Set selected layer paths for geochart if available in the config.
            if (this.controllers.geoChartController && this.mapFeaturesConfig.footerBar?.selectedGeochartLayerPath) {
              this.controllers.geoChartController.setSelectedLayerPath(this.mapFeaturesConfig.footerBar?.selectedGeochartLayerPath);
            }
          })
          .catch((error: unknown) => logger.logError('Failed to repeat last query', error));
      })
      .catch((error: unknown) => logger.logError('Failed while waiting for layers to load', error));
  }

  // #endregion

  // #region EVENTS

  /**
   * Emits a map init event to all handlers.
   */
  #emitMapInit(): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapInitHandlers, {});
  }

  /**
   * Registers a map init event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapInit(callback: MapInitDelegate): MapInitDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapInitHandlers, callback);
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
    EventHelper.emitEvent(this, this.#onMapReadyHandlers, {});
  }

  /**
   * Returns a promise that resolves the next time the map ready event fires.
   *
   * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
   * @returns A promise that resolves with the event payload when map ready fires
   */
  onceMapReady(filter?: (event: MapBaseEvent) => boolean): Promise<MapBaseEvent> {
    // Register a one-shot event handler that resolves a promise
    return EventHelper.onceEventPromise(this.#onMapReadyHandlers, filter);
  }

  /**
   * Registers a map ready event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapReady(callback: MapReadyDelegate): MapReadyDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapReadyHandlers, callback);
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
    EventHelper.emitEvent(this, this.#onMapLayersProcessedHandlers, {});
  }

  /**
   * Registers a map layers processed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapLayersProcessed(callback: MapLayersProcessedDelegate): MapLayersProcessedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapLayersProcessedHandlers, callback);
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
    EventHelper.emitEvent(this, this.#onMapLayersLoadedHandlers, {});
  }

  /**
   * Registers a map layers loaded event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapLayersLoaded(callback: MapLayersLoadedDelegate): MapLayersLoadedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapLayersLoadedHandlers, callback);
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
   * Returns a promise that resolves the next time the map move end event fires.
   *
   * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
   * @returns A promise that resolves with the event payload when map move end fires
   */
  onceMapMoveEnd(filter?: (event: MapMoveEndEvent) => boolean): Promise<MapMoveEndEvent> {
    // Register a one-shot event handler that resolves a promise
    return EventHelper.onceEventPromise(this.#onMapMoveEndHandlers, filter);
  }

  /**
   * Registers a map move end event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapMoveEnd(callback: MapMoveEndDelegate): MapMoveEndDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapMoveEndHandlers, callback);
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
   * @returns The callback delegate that was registered
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
   * Emits a map mouse enter event to all handlers.
   */
  #emitMapMouseEnter(event: MapBaseEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapMouseEnterHandlers, event);
    }
  }

  /**
   * Registers a map mouse enter event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapMouseEnter(callback: MapMouseEnterDelegate): MapMouseEnterDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapMouseEnterHandlers, callback);
  }

  /**
   * Unregisters a map mouse enter event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapMouseEnter(callback: MapMouseEnterDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapMouseEnterHandlers, callback);
  }

  /**
   * Emits a map mouse leave event to all handlers.
   */
  #emitMapMouseLeave(event: MapBaseEvent): void {
    // Emit the event for all handlers
    if (this.#pointerHandlersEnabled) {
      EventHelper.emitEvent(this, this.#onMapMouseLeaveHandlers, event);
    }
  }

  /**
   * Registers a map mouse leave event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapMouseLeave(callback: MapMouseLeaveDelegate): MapMouseLeaveDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapMouseLeaveHandlers, callback);
  }

  /**
   * Unregisters a map mouse leave event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapMouseLeave(callback: MapMouseLeaveDelegate | undefined): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapMouseLeaveHandlers, callback);
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
   * @returns The callback delegate that was registered
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
   * @returns The callback delegate that was registered
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
  #emitMapResolutionChanged(event: MapResolutionChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapResolutionChangedHandlers, event);
  }

  /**
   * Registers a map zoom end event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapResolutionChanged(callback: MapResolutionChangedDelegate): MapResolutionChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapResolutionChangedHandlers, callback);
  }

  /**
   * Unregisters a map zoom end event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapResolutionChanged(callback: MapResolutionChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapResolutionChangedHandlers, callback);
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
   * @returns The callback delegate that was registered
   */
  onMapRotation(callback: MapRotationDelegate): MapRotationDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapRotationHandlers, callback);
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
  #emitMapSizeChanged(event: MapSizeChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapSizeChangedHandlers, event);
  }

  /**
   * Registers a map change size event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapSizeChanged(callback: MapSizeChangedDelegate): MapSizeChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapSizeChangedHandlers, callback);
  }

  /**
   * Unregisters a map change size event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapSizeChanged(callback: MapSizeChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapSizeChangedHandlers, callback);
  }

  /**
   * Emits a map projection changed event.
   *
   * @param event - The projection change event
   */
  #emitMapProjectionChangeStarted(event: MapProjectionChangedEvent): void {
    // Emit the event
    EventHelper.emitEvent(this, this.#onMapProjectionChangeStartedHandlers, event);
  }

  /**
   * Registers a map projection change event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapProjectionChangeStarted(callback: MapProjectionChangedDelegate): MapProjectionChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapProjectionChangeStartedHandlers, callback);
  }

  /**
   * Unregisters a map projection changed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapProjectionChangeStarted(callback: MapProjectionChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapProjectionChangeStartedHandlers, callback);
  }

  /**
   * Emits a map projection changed event.
   *
   * @param event - The projection change event
   */
  #emitMapProjectionChanged(event: MapProjectionChangedEvent): void {
    // Emit the event
    EventHelper.emitEvent(this, this.#onMapProjectionChangedHandlers, event);
  }

  /**
   * Registers a map projection changed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapProjectionChanged(callback: MapProjectionChangedDelegate): MapProjectionChangedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMapProjectionChangedHandlers, callback);
  }

  /**
   * Unregisters a map projection changed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapProjectionChanged(callback: MapProjectionChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMapProjectionChangedHandlers, callback);
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
   * @returns The callback delegate that was registered
   */
  onMapComponentAdded(callback: MapComponentAddedDelegate): MapComponentAddedDelegate {
    // Register the component added event handler
    return EventHelper.onEvent(this.#onMapComponentAddedHandlers, callback);
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
   * @returns The callback delegate that was registered
   */
  onMapComponentRemoved(callback: MapComponentRemovedDelegate): MapComponentRemovedDelegate {
    // Register the component removed event handler
    return EventHelper.onEvent(this.#onMapComponentRemovedHandlers, callback);
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
   * Emits an interaction changed event to all handlers.
   */
  #emitMapInteractionChanged(event: MapInteractionChangedEvent): void {
    // Emit the interaction changed event for all handlers
    EventHelper.emitEvent(this, this.#onMapInteractionChangedHandlers, event);
  }

  /**
   * Registers an interaction changed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapInteractionChanged(callback: MapInteractionChangedDelegate): MapInteractionChangedDelegate {
    // Register the interaction changed event handler
    return EventHelper.onEvent(this.#onMapInteractionChangedHandlers, callback);
  }

  /**
   * Unregisters an interaction changed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapInteractionChanged(callback: MapInteractionChangedDelegate): void {
    // Unregister the interaction changed event handler
    EventHelper.offEvent(this.#onMapInteractionChangedHandlers, callback);
  }

  /**
   * Emits a language changed event to all handlers.
   */
  #emitMapLanguageChanged(event: MapLanguageChangedEvent): void {
    // Emit the language changed event for all handlers
    EventHelper.emitEvent(this, this.#onMapLanguageChangedHandlers, event);
  }

  /**
   * Registers a language changed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMapLanguageChanged(callback: MapLanguageChangedDelegate): MapLanguageChangedDelegate {
    // Register the language changed event handler
    return EventHelper.onEvent(this.#onMapLanguageChangedHandlers, callback);
  }

  /**
   * Unregisters a language changed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMapLanguageChanged(callback: MapLanguageChangedDelegate): void {
    // Unregister the language changed event handler
    EventHelper.offEvent(this.#onMapLanguageChangedHandlers, callback);
  }

  /**
   * Emits a marker icon showed event to all handlers.
   */
  #emitMarkerIconShowed(event: MarkerIconShowedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMarkerIconShowedHandlers, event);
  }

  /**
   * Registers a marker icon showed event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onMarkerIconShowed(callback: MarkerIconShowedDelegate): MarkerIconShowedDelegate {
    // Register the event handler
    return EventHelper.onEvent(this.#onMarkerIconShowedHandlers, callback);
  }

  /**
   * Unregisters a marker icon showed event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offMarkerIconShowed(callback: MarkerIconShowedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onMarkerIconShowedHandlers, callback);
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

/** Base interface for map events */
export interface MapBaseEvent {}

/**
 * Delegate for the map init event handler function signature.
 */
export type MapInitDelegate = EventDelegateBase<MapViewer, MapBaseEvent, void>;

/**
 * Delegate for the map ready event handler function signature.
 */
export type MapReadyDelegate = EventDelegateBase<MapViewer, MapBaseEvent, void>;

/**
 * Delegate for the map layers processed event handler function signature.
 */
export type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, MapBaseEvent, void>;

/**
 * Delegate for the map layers loaded event handler function signature.
 */
export type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, MapBaseEvent, void>;

/**
 * Event for the map move end delegate.
 */
export interface MapMoveEndEvent extends MapBaseEvent {
  lonlat: Coordinate;
}

/**
 * Delegate for the map move end event handler function signature.
 */
export type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;

/**
 * Event for the map pointer move delegate.
 */
export interface MapPointerMoveEvent extends MapBaseEvent, TypeMapMouseInfo {}

/**
 * Delegate for the map pointer move event handler function signature.
 */
export type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent, void>;

/**
 * Delegate for the map mouse enter event handler function signature.
 */
export type MapMouseEnterDelegate = EventDelegateBase<MapViewer, MapBaseEvent, void>;

/**
 * Delegate for the map mouse leave event handler function signature.
 */
export type MapMouseLeaveDelegate = EventDelegateBase<MapViewer, MapBaseEvent, void>;

/**
 * Event for the map single click delegate.
 */
export interface MapSingleClickEvent extends MapBaseEvent, TypeMapMouseInfo {}

/**
 * Delegate for the map single click event handler function signature.
 */
export type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent, void>;

/**
 * Event for the map zoom end delegate.
 */
export interface MapResolutionChangedEvent extends MapBaseEvent {
  resolution: number;
  zoom: number;
}

/**
 * Delegate for the map zoom end event handler function signature.
 */
export type MapResolutionChangedDelegate = EventDelegateBase<MapViewer, MapResolutionChangedEvent, void>;

/**
 * Event for the map rotation delegate.
 */
export interface MapRotationEvent extends MapBaseEvent {
  rotation: number;
}

/**
 * Delegate for the map rotation event handler function signature.
 */
export type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent, void>;

/**
 * Event for the map change size delegate.
 */
export interface MapSizeChangedEvent extends MapBaseEvent {
  size: Size;
  scale: TypeScaleInfo;
}

/**
 * Delegate for the map change size event handler function signature.
 */
export type MapSizeChangedDelegate = EventDelegateBase<MapViewer, MapSizeChangedEvent, void>;

/**
 * Event for the map projection changed delegate.
 */
export interface MapProjectionChangedEvent extends MapBaseEvent {
  projection: OLProjection;
  previousProjection: OLProjection;
}

/**
 * Delegate for the map projection changed event handler function signature.
 */
export type MapProjectionChangedDelegate = EventDelegateBase<MapViewer, MapProjectionChangedEvent, void>;

/**
 * Event for the map component added delegate.
 */
export interface MapComponentAddedEvent extends MapBaseEvent {
  mapComponentId: string;
  component: JSX.Element;
}

/**
 * Delegate for the map component added event handler function signature.
 */
export type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent, void>;

/**
 * Event for the map component removed delegate.
 */
export interface MapComponentRemovedEvent extends MapBaseEvent {
  mapComponentId: string;
}

/**
 * Delegate for the map component removed event handler function signature.
 */
export type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent, void>;

/**
 * Event for the map language changed delegate.
 */
export interface MapLanguageChangedEvent extends MapBaseEvent {
  language: TypeDisplayLanguage;
}

/**
 * Delegate for the map language changed event handler function signature.
 */
export type MapLanguageChangedDelegate = EventDelegateBase<MapViewer, MapLanguageChangedEvent, void>;

/**
 * Event for the interaction changed delegate.
 */
export interface MapInteractionChangedEvent extends MapBaseEvent {
  interaction: TypeInteraction;
}

/**
 * Delegate for the interaction changed event handler function signature.
 */
export type MapInteractionChangedDelegate = EventDelegateBase<MapViewer, MapInteractionChangedEvent, void>;

/**
 * Event for the marker icon showed delegate.
 */
export interface MarkerIconShowedEvent extends MapBaseEvent {
  /** The projected coordinates of the marker. */
  projectedCoords: number[];
}

/**
 * Delegate for the marker icon showed event handler function signature.
 */
export type MarkerIconShowedDelegate = EventDelegateBase<MapViewer, MarkerIconShowedEvent, void>;

/**
 * Define a return type for a map click simulation to be able to await on different promises.
 */
export type SimulatedMapClick = {
  /** Promise resolving when the query of the map click is complete */
  promiseQuery: Promise<TypeFeatureInfoResultSet>;
  /** Promise resolving when the query of the map click is complete and the UI has been updated */
  promiseQueryBatched: Promise<void>;
};
