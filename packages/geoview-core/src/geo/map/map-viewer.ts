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
  CV_VALID_ZOOM_LEVELS,
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
import { getGeoViewStore, removeGeoviewStore } from '@/core/stores/stores-managers';

import { Basemap } from '@/geo/layer/basemap/basemap';
import { LayerApi } from '@/geo/layer/layer';
import { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { Projection } from '@/geo/utils/projection';

import { TypeMapFeaturesInstance, TypeOrderedLayerInfo, api, unmountMap } from '@/app';
import { Plugin } from '@/api/plugin/plugin';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';

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
import { GVGroupLayer } from '../layer/gv-layers/gv-group-layer';

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

  // The default densification number when forming layer extents, to make ture to compensate for earth curvature
  static DEFAULT_STOPS: number = 25;

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

  // used to manage states
  stateApi: StateApi;

  // used to access basemap functions
  basemap: Basemap;

  // used to attach the notification class
  notifications: Notifications;

  // used to access layers functions
  // Note: The '!' is used here, because it's being created just a bit late, but not late enough that we want to keep checking for undefined throughout the code base
  layer!: LayerApi;

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

  // Keep all callback delegates references
  #onMapLanguageChangedHandlers: MapLanguageChangedDelegate[] = [];

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

    this.iconImageCacheSize = 1;

    this.appBarApi = new AppBarApi(this.mapId);
    this.navBarApi = new NavBarApi(this.mapId);
    this.footerBarApi = new FooterBarApi(this.mapId);
    this.stateApi = new StateApi(this.mapId);
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
      extentProjected = Projection.transformExtentFromProj(
        mapViewSettings.maxExtent,
        Projection.PROJECTION_NAMES.LNGLAT,
        projection.getCode()
      );

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
        minZoom: mapViewSettings.minZoom || CV_VALID_ZOOM_LEVELS[0],
        maxZoom: mapViewSettings.maxZoom || CV_VALID_ZOOM_LEVELS[1],
        rotation: mapViewSettings.rotation || 0,
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
      this.map.on('pointermove', debounce(this.#handleMapPointerMove.bind(this), 250, { leading: true }).bind(this));
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

    MapEventProcessor.resetBasemap(this.mapId).catch((error) => {
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
    try {
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
      const isNorthVisible = this.getNorthVisibility();

      // Get the map Extent
      const extent = this.getView().calculateExtent();

      // Get the scale information
      const scale = await MapEventProcessor.getScaleInfoFromDomElement(this.mapId);

      // Save in the store
      MapEventProcessor.setMapMoveEnd(this.mapId, centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, extent, scale);

      // Emit to the outside
      this.#emitMapMoveEnd({ lnglat: centerCoordinates });
    } catch (error) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapMoveEnd', error);
    }
  }

  /**
   * Handles when the map pointer moves
   * @param {MapEvent} event - The map event associated with the map pointer movement
   * @private
   */
  #handleMapPointerMove(event: MapEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the pointer position info
      const pointerPosition = {
        projected: (event as MapBrowserEvent<UIEvent>).coordinate,
        pixel: (event as MapBrowserEvent<UIEvent>).pixel,
        lnglat: Projection.transformPoints(
          [(event as MapBrowserEvent<UIEvent>).coordinate],
          projCode,
          Projection.PROJECTION_NAMES.LNGLAT
        )[0],
        dragging: (event as MapBrowserEvent<UIEvent>).dragging,
      };

      // Save in the store
      MapEventProcessor.setMapPointerPosition(this.mapId, pointerPosition);

      // Emit to the outside
      this.#emitMapPointerMove(pointerPosition);
    } catch (error) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapPointerMove', error);
    }
  }

  /**
   * Handles when the map received a single click
   * @param {MapEvent} event - The map event associated with the map single click
   * @private
   */
  #handleMapSingleClick(event: MapEvent): void {
    try {
      // Get the projection code
      const projCode = this.getView().getProjection().getCode();

      // Get the click coordinates
      const clickCoordinates = {
        projected: (event as MapBrowserEvent<UIEvent>).coordinate,
        pixel: (event as MapBrowserEvent<UIEvent>).pixel,
        lnglat: Projection.transformPoints(
          [(event as MapBrowserEvent<UIEvent>).coordinate],
          projCode,
          Projection.PROJECTION_NAMES.LNGLAT
        )[0],
        dragging: (event as MapBrowserEvent<UIEvent>).dragging,
      };

      // Save in the store
      MapEventProcessor.setClickCoordinates(this.mapId, clickCoordinates);

      // Emit to the outside
      this.#emitMapSingleClick(clickCoordinates);
    } catch (error) {
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
      MapEventProcessor.setZoom(this.mapId, zoom, newOrderedLayerInfo);
      MapEventProcessor.setVisibleRangeLayerMapState(this.mapId, visibleRangeLayers);

      // Emit to the outside
      this.#emitMapZoomEnd({ zoom });
    } catch (error) {
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
    } catch (error) {
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
      const scale = await MapEventProcessor.getScaleInfoFromDomElement(this.mapId);

      // Get the size as [number, number]
      const size = this.map.getSize() as unknown as [number, number];

      // Save in the store
      MapEventProcessor.setMapChangeSize(this.mapId, size, scale);

      // Emit to the outside
      this.#emitMapChangeSize({ size });
    } catch (error) {
      // Log
      logger.logError('Failed in MapViewer.#handleMapChangeSize', error);
    }
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
            logger.logTraceDetailed(
              'checkMapReady - 1 - waiting on layer registration...',
              geoviewLayer.getLayerConfig().geoviewLayerConfig.geoviewLayerId
            );
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

    // Register mouse interaction events. On mouse enter or leave, focus or blur the map container
    const mapHTMLElement = this.map.getTargetElement();
    mapHTMLElement.addEventListener('mouseenter', () => {
      mapHTMLElement.focus({ preventScroll: true });
      MapEventProcessor.setIsMouseInsideMap(this.mapId, true);
    });
    mapHTMLElement.addEventListener('mouseleave', () => {
      mapHTMLElement.blur();
      MapEventProcessor.setIsMouseInsideMap(this.mapId, false);
    });

    // Start checking for layers result sets to be ready
    this.#checkLayerResultSetReady().catch((error) => {
      // Log
      logger.logError('Failed in #checkLayerResultSetReady', error);
    });

    // Check how load in milliseconds has it been processing thus far
    const elapsedMilliseconds = Date.now() - this.#checkMapReadyStartTime!;

    // Wait at least the minimum delay before officializing the map as loaded for the UI
    await delay(MapViewer.#MIN_DELAY_LOADING - elapsedMilliseconds); // Negative value will simply resolve immediately

    // Save in the store that the map is loaded
    // GV This removes the spinning circle overlay
    MapEventProcessor.setMapLoaded(this.mapId, true);

    // Zoom to extent provided in config, if present
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.extent)
      // TODO: Timeout allows for map height to be set before zoom happens, so padding is applied properly
      setTimeout(
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        () =>
          this.zoomToExtent(this.convertExtentLngLatToMapProj(this.mapFeaturesConfig.map.viewSettings.initialView!.extent as Extent), {
            padding: [0, 0, 0, 0],
          }).catch((error) => logger.logPromiseFailed('promiseMapLayers in #checkMapLayersProcessed in map-viewer', error)),
        200
      );

    // Zoom to extents of layers selected in config, if provided.
    if (this.mapFeaturesConfig.map.viewSettings.initialView?.layerIds) {
      // If the layerIds array is empty, use all layers
      const layerIdsToZoomTo = this.mapFeaturesConfig.map.viewSettings.initialView.layerIds.length
        ? this.mapFeaturesConfig.map.viewSettings.initialView.layerIds
        : this.layer.getGeoviewLayerIds();

      this.onMapLayersLoaded(() => {
        let layerExtents = this.layer.getExtentOfMultipleLayers(layerIdsToZoomTo);

        // If extents have infinity, use default instead
        if (layerExtents.includes(Infinity))
          layerExtents = this.convertExtentLngLatToMapProj(CV_MAP_EXTENTS[this.mapFeaturesConfig.map.viewSettings.projection]);

        // Zoom to calculated extent
        if (layerExtents.length) {
          // GV Breaking the rule to not change the config here to prevent later issues
          // GV Here we replace the ids in the config with an extent in case the layers are removed
          // Replace layerIds with extent in configs
          delete this.mapFeaturesConfig.map.viewSettings.initialView!.layerIds;

          // The conversions may cause a small amount of inaccuracy as we go to lon/lat for config and convert back when zooming
          const lnglatExtent = this.convertExtentMapProjToLngLat(layerExtents);
          this.mapFeaturesConfig.map.viewSettings.initialView!.extent = lnglatExtent;

          const storeConfig = getGeoViewStore(this.mapId).getState().mapConfig;
          delete storeConfig!.map.viewSettings.initialView!.layerIds;
          storeConfig!.map.viewSettings.initialView!.extent = lnglatExtent;

          // TODO: Timeout allows for map height to be set before zoom happens, so padding is applied properly
          setTimeout(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            () =>
              this.zoomToExtent(layerExtents).catch((error) =>
                logger.logPromiseFailed('zoomtToExtent in #checkMapReadyGo in map-viewer', error)
              ),
            200
          );
        }
      });
    }

    // Start checking for map layers processed after the onMapLayersLoaded is define!
    this.#checkMapLayersProcessed();
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
            logger.logTraceDetailed(
              'checkMapReady - 2 - waiting on layer processed...',
              geoviewLayer.getLayerConfig().geoviewLayerConfig.geoviewLayerId
            );
          }
        );

        if (allGood) {
          // Clear interval
          clearInterval(mapInterval);

          // Log
          logger.logInfo(`Map is ready with ${layersCount} processed layers`, this.mapId);
          logger.logMarkerCheck(`mapReady-${this.mapId}`, `for all ${layersCount} layers to be processed`);

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
            logger.logTraceDetailed(
              'checkMapReady - 3 - waiting on layer loaded/error status...',
              geoviewLayer.getLayerConfig().geoviewLayerConfig.geoviewLayerId
            );
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

          // Create and dispatch the resolution change event to force the registration of layers in the
          // inVisibleRange array when layers are loaded.
          const event = new ObjectEvent('change:resolution', 'visibleRange', null);
          this.getView().dispatchEvent(event);
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
   * Gets the ordered layer info.
   * @returns {TypeOrderedLayerInfo[]} The ordered layer info
   */
  getMapLayerOrderInfo(): TypeOrderedLayerInfo[] {
    return MapEventProcessor.getMapOrderedLayerInfo(this.mapId);
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
      // Store the extent before any size changes occur
      const currentExtent = this.getView().calculateExtent();
      const currentZoom = this.getView().getZoom();

      // Add one-time size change listener only when we are zoomed out to keep the bottom
      // extent so the viewer does not zoom center Canada
      if (currentZoom! < 4.5)
        this.map.once('change:size', () => {
          // Update map size first
          this.map.updateSize();

          // Calculate the new center to focus on bottom portion
          const width = currentExtent[2] - currentExtent[0];
          const height = currentExtent[3] - currentExtent[1];

          // Calculate center point that will show bottom of previous extent
          const centerX = currentExtent[0] + width / 2;
          const centerY = currentExtent[1] - height / 2;

          // Set the new center and zoom
          this.getView().setCenter([centerX, centerY]);
          this.getView().setZoom(currentZoom!);

          // Force render
          this.map.renderSync();
        });

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
    this.notifications.addNotificationError(getLocalizedMessage('validation.changeDisplayLanguage', displayLanguage));
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
    viewOptions.rotation = mapView.rotation ? mapView.rotation : currentView.getRotation();
    if (mapView.maxExtent)
      viewOptions.extent = Projection.transformExtentFromProj(
        mapView.maxExtent,
        Projection.PROJECTION_NAMES.LNGLAT,
        `EPSG:${mapView.projection}`
      );

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
      maxExtent: Projection.transformExtentFromProj(extent, Projection.PROJECTION_NAMES.LNGLAT, currentView.getProjection()),
      projection: currentView.getProjection().getCode().split(':')[1] as unknown as TypeValidMapProjectionCodes,
    };

    this.setView(newView);
  }

  // #endregion

  // #region MAP ACTIONS

  emitMapSingleClick(clickCoordinates: MapSingleClickEvent): void {
    // Emit the event
    this.#emitMapSingleClick(clickCoordinates);
  }

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
                    this.layer.geometry.addPolygon(data.geometry.coordinates, undefined, generateId());
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
   * @param {boolean} deleteContainer - True if we want to delete div from the page
   * @returns {HTMLElement} The HTML element
   */
  async remove(deleteContainer: boolean): Promise<HTMLElement> {
    // Get the map container to unmount
    // Remove geoview-class if we need to reuse the div
    const mapContainer = document.getElementById(this.mapId)!;
    mapContainer.classList.remove('geoview-map');

    // GV If this is done after plugin removal, it triggers a rerender, and the plugins can cause an error, depending on state
    // Remove the dom element (remove rendered map and overview map)
    if (this.overviewRoot) this.overviewRoot.unmount();
    unmountMap(this.mapId);

    // Unload all loaded plugins on the map
    await Plugin.removePlugins(this.mapId);

    // Remove all layers
    try {
      this.layer.removeAllGeoviewLayers();
    } catch (err) {
      // Failed to remove layers, eat the exception and continue to remove the map
      logger.logError('Failed to remove layers', err);
    }

    // Delete store and event processor
    removeGeoviewStore(this.mapId);

    // If deleteContainer, delete the HTML div
    if (deleteContainer) mapContainer.remove();

    // Delete the map instance from the maps array, will delete attached plugins
    api.setMapViewer(this.mapId, null);

    // Return the map container to be remove
    return mapContainer;
  }

  /**
   * Reload a map from a config object stored in store, or provided. It first removes then recreates the map.
   * @param {TypeMapFeaturesConfig | TypeMapFeaturesInstance} mapConfig - Optional map config to use for reload.
   */
  async reload(mapConfig?: TypeMapFeaturesConfig | TypeMapFeaturesInstance): Promise<void> {
    // If no config is provided, get the original from the store
    const config = mapConfig || MapEventProcessor.getGeoViewMapConfig(this.mapId);

    // Get map height
    // GV: This is important because on reload, the mapHeight is set to 0px then reset to a bad value.
    // GV.CONT: This fix maintain the height on reload for the createMapFromConfig function. On first past the optional
    // GV.CONT: does not have to be provided because the div exist and map will take its height.
    const height = this.map.getSize() !== undefined ? this.map.getSize()![1] : 800;

    // Remove the map
    const mapDiv = await this.remove(false);

    // TODO: There is still as problem with bad config schema value and layers loading... should be refactor when config is done
    api.createMapFromConfig(mapDiv.id, JSON.stringify(config), height).catch((error) => {
      // Log
      logger.logError(`Couldn't reload the map in map-viewer`, error);
    });
  }

  /**
   * Reload a map from a config object created using current map state. It first removes then recreates the map.
   * @param {boolean} maintainGeocoreLayerNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   *                                              Set to false after a language change to update the layer names with the new language.
   */
  reloadWithCurrentState(maintainGeocoreLayerNames: boolean = true): void {
    const currentMapConfig = this.createMapConfigFromMapState(maintainGeocoreLayerNames);
    this.reload(currentMapConfig).catch((error) => {
      // Log
      logger.logError(`Couldn't reload the map in map-viewer`, error);
    });
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
    const projectedExtent = Projection.transformExtentFromProj(
      fullExtent,
      Projection.PROJECTION_NAMES.LNGLAT,
      `EPSG:${this.getMapState().currentProjection}`
    );
    return MapEventProcessor.zoomToExtent(this.mapId, projectedExtent, options);
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
   * Gets if north is visible. This is not a perfect solution and is more a work around
   *
   * @returns {boolean} true if visible, false otherwise
   */
  getNorthVisibility(): boolean {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
   * @param {number} stops - The number of stops to perform densification on the extent
   * @returns {Extent} The extent in the map projection
   */
  convertExtentLngLatToMapProj(extent: Extent, stops: number = MapViewer.DEFAULT_STOPS): Extent {
    // Redirect
    return this.convertExtentFromProjToMapProj(extent, Projection.PROJECTION_NAMES.LNGLAT, stops);
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
    // If different projections
    if (fromProj !== this.getProjection().getCode()) {
      return Projection.transform(coordinate, fromProj, this.getProjection());
    }

    // Same projection
    return coordinate;
  }

  /**
   * Transforms coordinate from map projection to given projection.
   * @param {Coordinate} coordinate - The given coordinate
   * @param {ProjectionLike} toProj - The projection that should be output
   * @returns {Coordinate} The coordinate in the map projection
   */
  convertCoordinateFromMapProjToProj(coordinate: Coordinate, toProj: ProjectionLike): Coordinate {
    // If different projections
    if (toProj !== this.getProjection().getCode()) {
      return Projection.transform(coordinate, this.getProjection(), toProj);
    }

    // Same projection
    return coordinate;
  }

  /**
   * Transforms extent from given projection to the current projection of the map.
   * @param {Extent} extent - The given extent
   * @param {ProjectionLike} fromProj - The projection of the given extent
   * @param {number} stops - The number of stops to perform densification on the extent
   * @returns {Extent} The extent in the map projection
   */
  convertExtentFromProjToMapProj(extent: Extent, fromProj: ProjectionLike, stops: number = MapViewer.DEFAULT_STOPS): Extent {
    // If different projections
    if (fromProj !== this.getProjection().getCode()) {
      return Projection.transformExtentFromProj(extent, fromProj, this.getProjection(), stops);
    }

    // Same projection
    return extent;
  }

  /**
   * Transforms extent from map projection to given projection. If the projects are the same, the extent is simply returned.
   * @param {Extent} extent - The given extent
   * @param {ProjectionLike} toProj - The projection that should be output
   * @returns {Extent} The extent in the map projection
   */
  convertExtentFromMapProjToProj(extent: Extent, toProj: ProjectionLike): Extent {
    // If different projections
    if (toProj !== this.getProjection().getCode()) {
      return Projection.transformExtentFromProj(extent, this.getProjection(), toProj);
    }

    // Same projection
    return extent;
  }

  // TODO: Move to config API after refactor?
  /**
   * Creates a map config based on current map state.
   * @param {BooleanExpression} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   *                                                         Set to false after a language change to update the layer names with the new language.
   * @returns {TypeMapFeaturesInstance | undefined} Map config with current map state.
   */
  createMapConfigFromMapState(overrideGeocoreServiceNames: boolean | 'hybrid' = true): TypeMapFeaturesInstance | undefined {
    return MapEventProcessor.createMapConfigFromMapState(this.mapId, overrideGeocoreServiceNames);
  }

  // TODO: Move to config API after refactor?
  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   *
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
  lnglat: Coordinate;
  pixel: Coordinate;
  projected: Coordinate;
  dragging: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapInitDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define a delegate for the event handler function signature
 */
type MapReadyDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define a delegate for the event handler function signature
 */
type MapLayersProcessedDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define a delegate for the event handler function signature
 */
type MapLayersLoadedDelegate = EventDelegateBase<MapViewer, undefined, void>;

/**
 * Define an event for the delegate
 */
export type MapMoveEndEvent = {
  lnglat: Coordinate;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapMoveEndDelegate = EventDelegateBase<MapViewer, MapMoveEndEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapPointerMoveEvent = TypeMapMouseInfo;

/**
 * Define a delegate for the event handler function signature
 */
type MapPointerMoveDelegate = EventDelegateBase<MapViewer, MapPointerMoveEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapSingleClickEvent = TypeMapMouseInfo;

/**
 * Define a delegate for the event handler function signature
 */
type MapSingleClickDelegate = EventDelegateBase<MapViewer, MapSingleClickEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapZoomEndEvent = {
  zoom: number;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapZoomEndDelegate = EventDelegateBase<MapViewer, MapZoomEndEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapRotationEvent = {
  rotation: number;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapRotationDelegate = EventDelegateBase<MapViewer, MapRotationEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapChangeSizeEvent = {
  size: [number, number];
};

/**
 * Define a delegate for the event handler function signature
 */
type MapChangeSizeDelegate = EventDelegateBase<MapViewer, MapChangeSizeEvent, void>;

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
type MapComponentAddedDelegate = EventDelegateBase<MapViewer, MapComponentAddedEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapComponentRemovedEvent = {
  mapComponentId: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapComponentRemovedDelegate = EventDelegateBase<MapViewer, MapComponentRemovedEvent, void>;

/**
 * Define an event for the delegate
 */
export type MapLanguageChangedEvent = {
  language: TypeDisplayLanguage;
};

/**
 * Define a delegate for the event handler function signature
 */
type MapLanguageChangedDelegate = EventDelegateBase<MapViewer, MapLanguageChangedEvent, void>;
