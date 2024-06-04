import { Root } from 'react-dom/client';

import { i18n } from 'i18next';

import { debounce } from 'lodash';
import { MapBrowserEvent, MapEvent } from 'ol';
import { ObjectEvent } from 'ol/Object';
import OLMap from 'ol/Map';
import View, { FitOptions, ViewOptions } from 'ol/View';
import { Coordinate } from 'ol/coordinate';
import { Extent } from 'ol/extent';
import { Projection as OLProjection, ProjectionLike } from 'ol/proj';

import queryString from 'query-string';
import {
  CV_MAP_CENTER,
  CV_MAP_EXTENTS,
  VALID_DISPLAY_LANGUAGE,
  VALID_DISPLAY_THEME,
  VALID_PROJECTION_CODES,
} from '@config/types/config-constants';
import {
  TypeViewSettings,
  TypeInteraction,
  TypeValidMapProjectionCodes,
  TypeDisplayLanguage,
  TypeDisplayTheme,
} from '@config/types/map-schema-types';
import { removeGeoviewStore } from '@/core/stores/stores-managers';

import { Basemap } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Projection } from '@/geo/utils/projection';

import { api, unmountMap } from '@/app';
import { Plugin } from '@/api/plugin/plugin';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';

import { AppBarApi } from '@/core/components/app-bar/app-bar-api';
import { NavBarApi } from '@/core/components/nav-bar/nav-bar-api';
import { FooterBarApi } from '@/core/components/footer-bar/footer-bar-api';

import { Select } from '@/geo/interaction/select';
import { Draw } from '@/geo/interaction/draw';
import { Extent as ExtentInteraction } from '@/geo/interaction/extent';
import { Modify } from '@/geo/interaction/modify';
import { Snap } from '@/geo/interaction/snap';
import { Translate } from '@/geo/interaction/translate';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { ModalApi } from '@/ui';
import { delay, generateId, getLocalizedMessage } from '@/core/utils/utilities';
import { createEmptyBasemap } from '@/geo/utils/utilities';
import { logger } from '@/core/utils/logger';
import { NORTH_POLE_POSITION } from '@/core/utils/constant';
import { TypeMapFeaturesConfig, TypeHTMLElement, TypeJsonObject } from '@/core/types/global-types';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import { Notifications } from '@/core/utils/notifications';

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
  // Minimum delay (in milliseconds) for map to be in loading state
  static readonly #MIN_DELAY_LOADING = 2000;

  // map config properties
  mapFeaturesConfig: TypeMapFeaturesConfig;

  // the id of the map
  mapId: string;

  // the openlayer map
  // Note: The '!' is used here, because it's being created just a bit late, but not late enough that we want to keep checking for undefined throughout the code base
  map!: OLMap;

  // plugins attach to the map
  plugins: TypeRecordOfPlugin = {};

  // the overview map reat root
  overviewRoot: Root | undefined;

  // used to access button bar API to create buttons and button panels on the app-bar
  appBarApi: AppBarApi;

  // used to access button bar API to create buttons and button panels on the nav-bar
  navBarApi: NavBarApi;

  // used to access the footer bar API to create buttons and footer panels on the footer-bar
  footerBarApi: FooterBarApi;

  // used to access basemap functions
  basemap: Basemap;

  // used to attach the notification class
  notifications: Notifications;

  // used to access layers functions
  // Note: The '!' is used here, because it's being created just a bit late, but not late enough that we want to keep checking for undefined throughout the code base
  layer!: LayerApi;

  // modals creation
  modal: ModalApi;

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

  // Keep all callback delegates references
  #onMapMoveEndHandlers: MapMoveEndDelegate[] = [];

  // Keep all callback delegates references
  #onMapPointerMoveHandlers: MapPointerMoveDelegate[] = [];

  // Keep all callback delegates references
  #onMapSingleClickHandlers: MapSingleClickDelegate[] = [];

  // Keep all callback delegates references
  #onMapZoomEndHandlers: MapZoomEndDelegate[] = [];

  // Keep all callback delegates references
  #onMapRotationHandlers: MapRotationDelegate[] = [];

  // Keep all callback delegates references
  #onMapChangeSizeHandlers: MapChangeSizeDelegate[] = [];

  // Keep all callback delegates references
  #onMapComponentAddedHandlers: MapComponentAddedDelegate[] = [];

  // Keep all callback delegates references
  #onMapComponentRemovedHandlers: MapComponentRemovedDelegate[] = [];

  // The starting time of the timer for the map ready
  #checkMapReadyStartTime: number | undefined;

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

    this.appBarApi = new AppBarApi(this.mapId);
    this.navBarApi = new NavBarApi(this.mapId);
    this.footerBarApi = new FooterBarApi(this.mapId);
    this.notifications = new Notifications(this.mapId);

    this.modal = new ModalApi();

    // create basemap and pass in the map id to be able to access the map instance
    this.basemap = new Basemap(MapEventProcessor.getBasemapOptions(this.mapId), this.mapId);
  }

  /**
   * Create an Open Layer map from configuration attached to the class
   * @param {HTMLElement} mapElement - HTML element to create the map within
   * @returns {OLMap} The OpenLayer map
   */
  createMap(mapElement: HTMLElement): OLMap {
    // config object
    const mapViewSettings = this.mapFeaturesConfig?.map.viewSettings;

    // create map projection object from code
    const projection = Projection.PROJECTIONS[mapViewSettings.projection];

    let extentProjected: Extent | undefined;
    if (mapViewSettings.maxExtent)
      extentProjected = Projection.transformExtent(mapViewSettings.maxExtent, Projection.PROJECTION_NAMES.LNGLAT, projection.getCode());

    const initialMap = new OLMap({
      target: mapElement,
      layers: [createEmptyBasemap()],
      view: new View({
        projection,
        center: Projection.transformFromLonLat(
          mapViewSettings.initialView?.zoomAndCenter
            ? mapViewSettings.initialView?.zoomAndCenter[1]
            : CV_MAP_CENTER[mapViewSettings.projection],
          projection
        ),
        zoom: mapViewSettings.initialView?.zoomAndCenter ? mapViewSettings.initialView?.zoomAndCenter[0] : 3.5,
        extent: extentProjected || undefined,
        minZoom: mapViewSettings.minZoom || 0,
        maxZoom: mapViewSettings.maxZoom || 17,
      }),
      controls: [],
      keyboardEventTarget: document.getElementById(`map-${this.mapId}`) as HTMLElement,
    });

    // Set the map
    this.map = initialMap;
    this.initMap();

    return initialMap;
  }

  /**
   * Initializes map, layer class and geometries
   */
  initMap(): void {
    // Register essential map-view handlers
    this.map.on('moveend', this.#handleMapMoveEnd.bind(this));
    this.#registerViewHelpers(this.getView());

    // If map isn't static
    if (this.mapFeaturesConfig.map.interaction !== 'static') {
      // Register handlers on pointer move and map single click
      this.map.on('pointermove', debounce(this.#handleMapPointerMove.bind(this), 10, { leading: true }).bind(this));
      this.map.on('singleclick', debounce(this.#handleMapSingleClick.bind(this), 1000, { leading: true }).bind(this));
    }

    // Note the time
    this.#checkMapReadyStartTime = Date.now();

    // initialize layers and load the layers passed in from map config if any
    this.layer = new LayerApi(this);

    // Load the list of geoview layers in the config to add all layers on the map
    this.layer.loadListOfGeoviewLayer(this.mapFeaturesConfig.map.listOfGeoviewLayerConfig).catch((error) => {
      // Log
      logger.logPromiseFailed('loadListOfGeoviewLayer in initMap in MapViewer', error);
    });

    // check if geometries are provided from url
    this.loadGeometries();

    // Emit map init
    this.#mapInit = true;
    this.#emitMapInit();

    MapEventProcessor.resetBasemap(this.mapId)
      .then()
      .catch((error) => {
        // Log
        logger.logPromiseFailed(' MapEventProcessor.resetBasemap in map-viewer', error);
      });

    // Start checking for when the map will be ready
    this.#checkMapReady();
  }

  /**
   * Register on view initialization
   * @param {View} view - View to register events on
   */
  #registerViewHelpers(view: View): void {
    // Register essential map handlers
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
    // Get the center coordinates
    const centerCoordinates = this.getView().getCenter()!;

    // Get the projection code
    const projCode = this.getView().getProjection().getCode();

    // Get the pointer position
    const pointerPosition = {
      projected: centerCoordinates,
      pixel: this.map.getPixelFromCoordinate(centerCoordinates),
      lnglat: Projection.transformPoints([centerCoordinates], projCode, Projection.PROJECTION_NAMES.LNGLAT)[0],
      dragging: false,
    };

    // Get the degree rotation
    const degreeRotation = this.getNorthArrowAngle();

    // Get the north visibility
    const isNorthVisible = this.checkNorth();

    // Get the scale information
    const scale = await MapEventProcessor.getScaleInfoFromDomElement(this.mapId);

    // Save in the store
    MapEventProcessor.setMapMoveEnd(this.mapId, centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, scale);

    // Emit to the outside
    this.#emitMapMoveEnd({ lnglat: centerCoordinates });
  }

  /**
   * Handles when the map pointer moves
   * @param {MapEvent} event - The map event associated with the map pointer movement
   * @private
   */
  #handleMapPointerMove(event: MapEvent): void {
    // Get the projection code
    const projCode = this.getView().getProjection().getCode();

    // Get the pointer position info
    const pointerPosition = {
      projected: (event as MapBrowserEvent<UIEvent>).coordinate,
      pixel: (event as MapBrowserEvent<UIEvent>).pixel,
      lnglat: Projection.transformPoints([(event as MapBrowserEvent<UIEvent>).coordinate], projCode, Projection.PROJECTION_NAMES.LNGLAT)[0],
      dragging: (event as MapBrowserEvent<UIEvent>).dragging,
    };

    // Save in the store
    MapEventProcessor.setMapPointerPosition(this.mapId, pointerPosition);

    // Emit to the outside
    this.#emitMapPointerMove(pointerPosition);
  }

  /**
   * Handles when the map received a single click
   * @param {MapEvent} event - The map event associated with the map single click
   * @private
   */
  #handleMapSingleClick(event: MapEvent): void {
    // Get the projection code
    const projCode = this.getView().getProjection().getCode();

    // Get the click coordinates
    const clickCoordinates = {
      projected: (event as MapBrowserEvent<UIEvent>).coordinate,
      pixel: (event as MapBrowserEvent<UIEvent>).pixel,
      lnglat: Projection.transformPoints([(event as MapBrowserEvent<UIEvent>).coordinate], projCode, Projection.PROJECTION_NAMES.LNGLAT)[0],
      dragging: (event as MapBrowserEvent<UIEvent>).dragging,
    };

    // Save in the store
    MapEventProcessor.setClickCoordinates(this.mapId, clickCoordinates).catch((error) => {
      // Log
      logger.logPromiseFailed('setClickCoordinates in #handleMapSingleClick in MapViewer', error);
    });

    // Emit to the outside
    this.#emitMapSingleClick(clickCoordinates);
  }

  /**
   * Handles when the map zoom ends
   * @param {ObjectEvent} event - The event associated with the zoom end
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapZoomEnd(event: ObjectEvent): void {
    // Read the zoom value
    const zoom = this.getView().getZoom()!;

    // Save in the store
    MapEventProcessor.setZoom(this.mapId, zoom);

    // Emit to the outside
    this.#emitMapZoomEnd({ zoom });
  }

  /**
   * Handles when the map rotates
   * @param {ObjectEvent} event - The event associated with rotation
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapRotation(event: ObjectEvent): void {
    // Get the map rotation
    const rotation = this.getView().getRotation();

    // Save in the store
    MapEventProcessor.setRotation(this.mapId, rotation);

    // Emit to the outside
    this.#emitMapRotation({ rotation });
  }

  /**
   * Handles when the map changes size
   * @param {ObjectEvent} event - The event associated with rotation
   * @returns {Promise<void>} Promise when done processing the map change size
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async #handleMapChangeSize(event: ObjectEvent): Promise<void> {
    // Get the scale information
    const scale = await MapEventProcessor.getScaleInfoFromDomElement(this.mapId);

    // Get the size as [number, number]
    const size = this.map.getSize() as unknown as [number, number];

    // Save in the store
    MapEventProcessor.setMapChangeSize(this.mapId, size, scale);

    // Emit to the outside
    this.#emitMapChangeSize({ size });
  }

  /**
   * Function called to monitor when the map is actually ready.
   * @private
   */
  #checkMapReady(): void {
    // Log Marker Start
    logger.logMarkerStart(`mapReady-${this.mapId}`);

    // TODO: Refactor minimal - Rewrite the code here to not have to rely on a setInterval anymore.
    // Start an interval checker
    const mapInterval = setInterval(() => {
      if (this.layer) {
        // Check if all registered layers are registered
        const [allGood, layersCount] = this.layer.checkLayerStatus(
          'registered',
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig,
          (geoviewLayer) => {
            logger.logTraceDetailed('checkMapReady - 1 - waiting on layer registration...', geoviewLayer.geoviewLayerId);
          }
        );

        if (allGood) {
          // Clear interval
          clearInterval(mapInterval);

          // Log
          logger.logInfo(`Map is ready with ${layersCount} registered layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for map to be ready. Layers are still being processed...`);

          // Redirect
          this.#checkMapReadyGo().catch((error) => {
            // Log
            logger.logPromiseFailed('checkMapReadyGo in checkMapReady in MapViewer', error);
          });
        }
      }
    }, 250);
  }

  /**
   * Function called when the map is ready and additional processing can happen.
   * @returns {Promise<void>}
   * @private
   */
  async #checkMapReadyGo(): Promise<void> {
    // Is ready
    this.#mapReady = true;
    this.#emitMapReady();

    // Load the Map itself and the UI controls
    MapEventProcessor.initMapControls(this.mapId);

    // Load the guide
    AppEventProcessor.setGuide(this.mapId).catch((error) => {
      // Log
      logger.logPromiseFailed('in setGuide in #checkMapReadyGo', error);
    });

    // Now that the map dom is loaded, register a handle when size is changing
    this.map.on('change:size', this.#handleMapChangeSize.bind(this));
    this.map.dispatchEvent('change:size'); // dispatch event to set initial value

    // Register mouse interaction events
    // set autofocus/blur on mouse enter/leave the map so user can scroll (zoom) without having to click the map
    const mapHTMLElement = this.map.getTargetElement();
    mapHTMLElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault(); // Abort event
      mapHTMLElement.focus();
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mapHTMLElement.addEventListener('mouseleave', (event: MouseEvent) => {
      mapHTMLElement.blur();
    });

    // Start checking for layers result sets to be ready
    this.#checkLayerResultSetReady().catch((error) => {
      // Log
      logger.logError('Failed in #checkLayerResultSetReady', error);
    });

    // Zoom to extent provided in config, it present
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.extent)
      await this.zoomToExtent(
        Projection.transformExtent(
          this.mapFeaturesConfig.map.viewSettings.initialView?.extent,
          Projection.PROJECTION_NAMES.LNGLAT,
          `EPSG:${this.mapFeaturesConfig.map.viewSettings.projection}`
        )
      );

    // Start checking for map layers processed
    this.#checkMapLayersProcessed();

    // Check how load in milliseconds has it been processing thus far
    const elapsedMilliseconds = Date.now() - this.#checkMapReadyStartTime!;

    // Wait at least the minimum delay before officializing the map as loaded for the UI
    await delay(MapViewer.#MIN_DELAY_LOADING - elapsedMilliseconds); // Negative value will simply resolve immediately

    // Save in the store that the map is loaded
    // GV This removes the spinning circle overlay
    MapEventProcessor.setMapLoaded(this.mapId, true);
  }

  /**
   * Function called to monitor when the map has its layers in processed state.
   * @private
   */
  #checkMapLayersProcessed(): void {
    // Start an interval checker
    // TODO: Refactor minimal - Rewrite the code here to not have to rely on a setInterval anymore.
    const mapInterval = setInterval(() => {
      if (this.layer) {
        // Check if all registered layers are processed
        const [allGood, layersCount] = this.layer.checkLayerStatus(
          'processed',
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig,
          (geoviewLayer) => {
            logger.logTraceDetailed('checkMapReady - 2 - waiting on layer processed...', geoviewLayer.geoviewLayerId);
          }
        );

        if (allGood) {
          // Clear interval
          clearInterval(mapInterval);

          // Log
          logger.logInfo(`Map is ready with ${layersCount} processed layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for all ${layersCount} layers to be processed`);

          // Zoom to extents of layers selected in config, if provided.
          if (this.mapFeaturesConfig.map.viewSettings.initialView?.layerIds) {
            let layerExtents = this.layer.getExtentOfMultipleLayers(this.mapFeaturesConfig.map.viewSettings.initialView.layerIds);
            if (layerExtents.includes(Infinity))
              layerExtents = Projection.transformExtent(
                CV_MAP_EXTENTS[this.mapFeaturesConfig.map.viewSettings.projection],
                Projection.PROJECTION_NAMES.LNGLAT,
                `EPSG:${this.mapFeaturesConfig.map.viewSettings.projection}`
              );
            if (layerExtents.length)
              this.zoomToExtent(layerExtents).catch((error) =>
                logger.logPromiseFailed('promiseMapLayers in #checkMapLayersProcessed in map-viewer', error)
              );
          }

          // Is ready
          this.#mapLayersProcessed = true;
          this.#emitMapLayersProcessed();

          // Start checking for map layers loaded
          this.#checkMapLayersLoaded();
        }
      }
    }, 250);
  }

  /**
   * Function called to monitor when the map has its layers in loaded state.
   * @private
   */
  #checkMapLayersLoaded(): void {
    // Start an interval checker
    // TODO: Refactor minimal - Rewrite the code here to not have to rely on a setInterval anymore.
    const mapInterval = setInterval(() => {
      if (this.layer) {
        // Check if all registered layers are loaded
        const [allGood, layersCount] = this.layer.checkLayerStatus(
          'loaded',
          this.mapFeaturesConfig.map.listOfGeoviewLayerConfig,
          (geoviewLayer) => {
            logger.logTraceDetailed('checkMapReady - 3 - waiting on layer loaded/error status...', geoviewLayer.geoviewLayerId);
          }
        );

        if (allGood) {
          // Clear interval
          clearInterval(mapInterval);

          // Log
          logger.logInfo(`Map is ready with ${layersCount} loaded layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for all ${layersCount} layers to be loaded`);

          // Is ready
          this.#mapLayersLoaded = true;
          this.#emitMapLayersLoaded();
        }
      }
    }, 250);
  }

  /**
   * Function called to monitor when the layers result sets are actually ready
   * @returns {Promise<void>} Promise when the layer resultset is ready for all layers
   * @private
   */
  #checkLayerResultSetReady(): Promise<void> {
    // Start another interval checker
    return new Promise<void>((resolve) => {
      // TODO: Refactor minimal - Rewrite the code here to not have to rely on a setInterval anymore.
      const layersInterval = setInterval(() => {
        if (this.layer) {
          // Check if all registered layers have their results set
          const allGood = this.layer.checkFeatureInfoLayerResultSetsReady((layerEntryConfig) => {
            logger.logTraceDetailed('checkMapReady - 4 - waiting on layer resultSet...', layerEntryConfig.layerPath);
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
   * @param {TypeJsonObject} translations - The translation object to add
   */
  addLocalizeRessourceBundle(language: TypeDisplayLanguage, translations: TypeJsonObject): void {
    this.#i18nInstance.addResourceBundle(language, 'translation', translations, true, false);
  }

  // #region MAP STATES

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
   * Gets the map projection
   * @returns the map viewSettings
   */
  getProjection(): OLProjection {
    return this.getView().getProjection();
  }

  /**
   * set fullscreen / exit fullscreen
   *
   * @param status - Toggle fullscreen or exit fullscreen status
   * @param {HTMLElement} element - The element to toggle fullscreen on
   */
  static setFullscreen(status: boolean, element: TypeHTMLElement): void {
    // TODO: Refactor - For reusability, this function should be static and moved to a browser-utilities class
    // TO.DOCONT: If we want to keep a function here, in MapViewer, it should just be a redirect to the browser-utilities'
    // enter fullscreen
    if (status) {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch((error) => {
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
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((error) => {
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
   * @returns {Promise<[void, void]>}
   */
  setLanguage(displayLanguage: TypeDisplayLanguage, resetLayer?: boolean | false): Promise<[void, void]> {
    if (VALID_DISPLAY_LANGUAGE.includes(displayLanguage)) {
      const promise = AppEventProcessor.setDisplayLanguage(this.mapId, displayLanguage);

      // if flag is true, check if config support the layers change and apply
      if (resetLayer) {
        logger.logInfo('reset layers not implemented yet');
      }

      // Return the promise
      return promise;
    }

    // Unsupported
    this.notifications.addNotificationError(getLocalizedMessage('validation.changeDisplayLanguage', displayLanguage));
    return Promise.resolve([undefined, undefined]);
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

      // TODO: Emit to outside
      // this.#emitMapInit...

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
    } else this.notifications.addNotificationError(getLocalizedMessage('validation.changeDisplayTheme', this.getDisplayLanguage()));
  }

  /**
   * Set the map viewSettings (coordinate values in lat/long)
   *
   * @param {TypeViewSettings} mapView - Map viewSettings object
   */
  setView(mapView: TypeViewSettings): void {
    const currentView = this.getView();
    const viewOptions: ViewOptions = {};
    viewOptions.projection = `EPSG:${mapView.projection}`;
    viewOptions.zoom = mapView.initialView?.zoomAndCenter ? mapView.initialView?.zoomAndCenter[0] : currentView.getZoom();
    viewOptions.center = mapView.initialView?.zoomAndCenter
      ? Projection.transformFromLonLat(mapView.initialView?.zoomAndCenter[1], viewOptions.projection)
      : Projection.transformFromLonLat(
          Projection.transformToLonLat(currentView.getCenter()!, currentView.getProjection()),
          viewOptions.projection
        );
    viewOptions.minZoom = mapView.minZoom ? mapView.minZoom : currentView.getMinZoom();
    viewOptions.maxZoom = mapView.maxZoom ? mapView.maxZoom : currentView.getMaxZoom();
    if (mapView.maxExtent)
      viewOptions.extent = Projection.transformExtent(mapView.maxExtent, Projection.PROJECTION_NAMES.LNGLAT, `EPSG:${mapView.projection}`);

    const newView = new View(viewOptions);
    this.map.setView(newView);

    this.#registerViewHelpers(newView);
  }

  /**
   * Set the map center.
   *
   * @param {Coordinate} center - New center to use
   */
  setCenter(center: Coordinate): void {
    const currentView = this.getView();
    const transformedCenter = Projection.transformFromLonLat(center, currentView.getProjection());

    currentView.setCenter(transformedCenter);
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
   *
   * @param {Extent} extent - New extent to zoom to.
   */
  async setExtent(extent: Extent): Promise<void> {
    await MapEventProcessor.zoomToExtent(this.mapId, extent);
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
          this.convertCoordinateLngLatToMapProj(currentView.getCenter()!) as [number, number],
        ],
      },
      minZoom: currentView.getMinZoom(),
      maxZoom: currentView.getMaxZoom(),
      maxExtent: Projection.transformExtent(extent, Projection.PROJECTION_NAMES.LNGLAT, currentView.getProjection()),
      projection: currentView.getProjection().getCode().split(':')[1] as unknown as TypeValidMapProjectionCodes,
    };

    this.setView(newView);
  }

  // #endregion

  // #region MAP ACTIONS

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   *
   * @returns A Promise which resolves when the rendering is completed after the source(s) were changed.
   */
  refreshLayers(): Promise<void> {
    // Redirect
    this.layer.refreshLayers();

    // Return a promise for when rendering will complete
    return new Promise<void>((resolve) => {
      this.map.once('rendercomplete', () => {
        // Done
        resolve();
      });
    });
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
        fetch(`${servEndpoint}${key}`)
          .then((response) => {
            // only process valid response
            if (response.status === 200) {
              response
                .json()
                .then((data) => {
                  if (data.geometry !== undefined) {
                    // add the geometry
                    // TODO: use the geometry as GeoJSON and add properties to by queried by the details panel
                    this.layer.geometry.addPolygon(data.geometry.coordinates, undefined, generateId(null));
                  }
                })
                .catch((error) => {
                  // Log
                  logger.logPromiseFailed('response.json in loadGeometry in MapViewer', error);
                });
            }
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('fetch in loadGeometries in MapViewer', error);
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
    // get the map container to unmount
    // remove geoview-class if we need to reuse the div
    const mapContainer = document.getElementById(this.mapId)!;
    mapContainer.classList.remove('geoview-map');

    // unload all loaded plugins on the map
    Plugin.removePlugins(this.mapId)
      .then(() => {
        // Remove all layers
        try {
          this.layer.removeAllGeoviewLayers();
        } catch (err) {
          // Failed to remove layers, eat the exception and continue to remove the map
        }

        // remove the dom element (remove rendered map and overview map)
        if (this.overviewRoot) this.overviewRoot?.unmount();
        unmountMap(this.mapId);

        // delete store and event processor
        removeGeoviewStore(this.mapId);

        // if deleteContainer, delete the HTML div
        if (deleteContainer) mapContainer.remove();

        // delete the map instance from the maps array, will delete attached plugins
        // TODO: need a time out here because if not, map is deleted before everything is done on the map
        // TO.DOCONT: This whole sequence need to be async
        setTimeout(() => delete api.maps[this.mapId], 1000);
      })
      .catch((error) => {
        logger.logError(`Couldn't remove map in map-viewer`, error);
      });

    // return the map container to be remove
    return mapContainer;
  }

  /**
   * Reload a map from a config object stored in store. It first remove then recreate the map.
   */
  reload(): void {
    // remove the map, then get config to use to recreate it
    const mapDiv = this.remove(false);
    const config = MapEventProcessor.getStoreConfig(this.mapId);
    // TODO: Remove time out and make this async so remove/recreate work one after the other
    // TO.DOCONT: There is still as problem with bad config schema value and layers loading... should be refactor when config is done
    setTimeout(
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      () =>
        api.createMapFromConfig(mapDiv.id, JSON.stringify(config)).catch((error) => {
          // Log
          logger.logError(`Couldn't reload the map in map-viewer`, error);
        }),
      1500
    );
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {Extent} extent - The extent to zoom to.
   * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   */
  zoomToExtent(extent: Extent, options?: FitOptions): Promise<void> {
    // TODO: Discussion - Where is the line between a function using MapEventProcessor in MapViewer vs in MapState action?
    // TO.DOCONT: This function (and there are many others in this class) redirects to the MapEventProcessor, should it be in MapState with the others or do we keep some in MapViewer and some in MapState?
    // TO.DOCONT: If we keep some, we should maybe add a fourth call-stack possibility in the MapEventProcessor paradigm documentation.
    // Redirect to the processor
    return MapEventProcessor.zoomToExtent(this.mapId, extent, options);
  }

  /**
   * Zoom to specified extent or coordinate provided in lnglat.
   *
   * @param {Extent | Coordinate} extent - The extent or coordinate to zoom to.
   * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   */
  zoomToLngLatExtentOrCoordinate(extent: Extent | Coordinate, options?: FitOptions): Promise<void> {
    const fullExtent = extent.length === 2 ? [extent[0], extent[1], extent[0], extent[1]] : extent;
    const projectedExtent = Projection.transformExtent(
      fullExtent,
      Projection.PROJECTION_NAMES.LNGLAT,
      `EPSG:${this.getMapState().currentProjection}`
    );
    return MapEventProcessor.zoomToExtent(this.mapId, projectedExtent, options);
  }

  // #endregion

  /**
   * Fit the map to its boundaries. It is assumed that the boundaries use the map projection. If projectionCode is undefined,
   * the boundaries are used as is, otherwise they are reprojected from the specified projection code to the map projection.
   *
   * @param {Extent} bounds - Bounding box to zoom to
   * @param {string | number | undefined} projectionCode - Optional projection code used by the bounds.
   */
  // TODO: only use in the layers panel package... see if still needed and if it is the right place
  fitBounds(bounds?: Extent, projectionCode: string | number | undefined = undefined): void {
    let mapBounds: Extent | undefined;
    if (bounds) {
      const { currentProjection } = this.getMapState();
      mapBounds = projectionCode
        ? Projection.transformExtent(bounds, `EPSG:${projectionCode}`, Projection.PROJECTIONS[currentProjection], 20)
        : Projection.transformExtent(bounds, Projection.PROJECTIONS[currentProjection], Projection.PROJECTIONS[currentProjection], 25);
    } else {
      this.layer.getGeoviewLayerIds().forEach((geoviewLayerId) => {
        // TODO Refactor - Layers refactoring. There needs to be a getMetadataBounds (new layers and new config) to complete the full layers migration.
        // TO.DOCONT: Johann: Need on both, config extract bounds from metadata and layers do it again at the end from features for vector and compound bound for group
        if (!mapBounds) mapBounds = this.layer.getGeoviewLayer(geoviewLayerId)?.getMetadataBounds(geoviewLayerId);
        else {
          const newMapBounds = this.layer.getGeoviewLayer(geoviewLayerId)?.getMetadataBounds(geoviewLayerId);
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
      this.getView().fit(mapBounds, { size: this.map.getSize() });
      this.getView().setZoom(this.getView().getZoom()! - 0.15);
    }
  }

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
   * Initializes drawing interactions on the given vector source
   * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
   * @param {string} type - The type of geometry to draw (Polygon, LineString, Circle, etc)
   * @param {TypeFeatureStyle} styles - The styles for the drawing
   */
  initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle): Draw {
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
   * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
   */
  initModifyInteractions(geomGroupKey: string): Modify {
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

  // #endregion

  /**
   * Check if north is visible. This is not a perfect solution and is more a work around
   *
   * @returns {boolean} true if visible, false otherwise
   */
  checkNorth(): boolean {
    // Check the container value for top middle of the screen
    // Convert this value to a lat long coordinate
    const pointXY = [this.map.getSize()![0] / 2, 1];
    const pt = Projection.transformToLonLat(this.map.getCoordinateFromPixel(pointXY), this.getView().getProjection());

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
    } catch (error) {
      return '180.0';
    }
  }

  /**
   * Transforms coordinate from LngLat to the current projection of the map.
   * @param {Coordinate} coordinate - The LngLat coordinate
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateLngLatToMapProj(coordinate: Coordinate): Coordinate {
    // Redirect
    return this.convertCoordinateFromProjToMapProj(coordinate, Projection.PROJECTION_NAMES.LNGLAT);
  }

  /**
   * Transforms coordinate from current projection of the map to LngLat.
   * @param {Coordinate} coordinate - The coordinate in map projection
   * @returns {Coordinate} The coordinate in LngLat
   */
  convertCoordinateMapProjToLngLat(coordinate: Coordinate): Coordinate {
    // Redirect
    return this.convertCoordinateFromMapProjToProj(coordinate, Projection.PROJECTION_NAMES.LNGLAT);
  }

  /**
   * Transforms extent from LngLat to the current projection of the map.
   * @param {Extent} extent - The LngLat extent
   * @returns {Extent} The extent in the map projection
   */
  convertExtentLngLatToMapProj(extent: Extent): Extent {
    // Redirect
    return this.convertExtentFromProjToMapProj(extent, Projection.PROJECTION_NAMES.LNGLAT);
  }

  /**
   * Transforms extent from current projection of the map to LngLat.
   * @param {Extent} extent - The extent in map projection
   * @returns {Extent} The extent in LngLat
   */
  convertExtentMapProjToLngLat(extent: Extent): Extent {
    // Redirect
    return this.convertExtentFromMapProjToProj(extent, Projection.PROJECTION_NAMES.LNGLAT);
  }

  /**
   * Transforms coordinate from given projection to the current projection of the map.
   * @param {Coordinate} coordinate - The given coordinate
   * @param {ProjectionLike} fromProj - The projection of the given coordinate
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateFromProjToMapProj(coordinate: Coordinate, fromProj: ProjectionLike): Coordinate {
    // TODO: In this function and equivalent 3 others below, make it so that if the given projection is the same as the map projection
    // TO.DOCONT: it just skips and returns the same geometry. It'd save many 'if' like 'if projA <> projB then call this' in the code base
    return Projection.transform(coordinate, fromProj, this.getProjection());
  }

  /**
   * Transforms coordinate from map projection to given projection.
   * @param {Coordinate} coordinate - The given coordinate
   * @param {ProjectionLike} toProj - The projection that should be output
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateFromMapProjToProj(coordinate: Coordinate, toProj: ProjectionLike): Coordinate {
    return Projection.transform(coordinate, this.getProjection(), toProj);
  }

  /**
   * Transforms extent from given projection to the current projection of the map.
   * @param {Extent} extent - The given extent
   * @param {ProjectionLike} fromProj - The projection of the given extent
   * @returns {Extent} The extent in the map projection
   */
  convertExtentFromProjToMapProj(extent: Extent, fromProj: ProjectionLike): Extent {
    return Projection.transformExtent(extent, fromProj, this.getProjection());
  }

  /**
   * Transforms extent from map projection to given projection.
   * @param {Extent} extent - The given extent
   * @param {ProjectionLike} toProj - The projection that should be output
   * @returns {Extent} The extent in the map projection
   */
  convertExtentFromMapProjToProj(extent: Extent, toProj: ProjectionLike): Extent {
    return Projection.transformExtent(extent, this.getProjection(), toProj);
  }

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
    EventHelper.emitEvent(this, this.#onMapPointerMoveHandlers, event);
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
   * Emits a map single click event to all handlers.
   * @private
   */
  #emitMapSingleClick(event: MapSingleClickEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onMapSingleClickHandlers, event);
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
  lnglat: Coordinate;
  pixel: Coordinate;
  projected: Coordinate;
  dragging: boolean;
};

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

/**
 * Define an event for the delegate
 */
export type MapMoveEndEvent = {
  lnglat: Coordinate;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent>;

/**
 * Define an event for the delegate
 */
export type MapPointerMoveEvent = TypeMapMouseInfo;

/**
 * Define a delegate for the event handler function signature
 */
type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent>;

/**
 * Define an event for the delegate
 */
export type MapSingleClickEvent = TypeMapMouseInfo;

/**
 * Define a delegate for the event handler function signature
 */
type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent>;

/**
 * Define an event for the delegate
 */
export type MapZoomEndEvent = {
  zoom: number;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent>;

/**
 * Define an event for the delegate
 */
export type MapRotationEvent = {
  rotation: number;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent>;

/**
 * Define an event for the delegate
 */
export type MapChangeSizeEvent = {
  size: [number, number];
};

/**
 * Define a delegate for the event handler function signature
 */
type MapChangeSizeDelegate = EventDelegateBase<MapViewer, MapChangeSizeEvent>;

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
type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent>;

/**
 * Define an event for the delegate
 */
export type MapComponentRemovedEvent = {
  mapComponentId: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent>;
