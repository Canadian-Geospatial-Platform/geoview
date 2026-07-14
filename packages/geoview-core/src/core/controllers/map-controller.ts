import type { Root } from 'react-dom/client';
import type { Pixel } from 'ol/pixel';
import type { Coordinate } from 'ol/coordinate';
import type { OverviewMap as OLOverviewMap } from 'ol/control';
import type { Type as OLGeomType } from 'ol/geom/Geometry';

import {
  MAP_EXTENTS,
  VALID_PROJECTION_CODES,
  type Extent,
  type TypeAltitudeResponse,
  type TypeBasemapOptions,
  type TypeFeatureInfoEntry,
  type TypeMapConfig,
  type TypeMapFeaturesInstance,
  type TypeMapMouseInfo,
  type TypeMapViewSettings,
  type TypeNtsResponse,
  type TypePointMarker,
  type TypeServiceUrls,
  type TypeUtmZoneResponse,
  type TypeValidAppBarCoreProps,
  type TypeValidFooterBarTabsCoreProps,
  type TypeValidMapProjectionCodes,
  type TypeViewSettings,
} from '@/api/types/map-schema-types';
import {
  CONST_LAYER_TYPES,
  type MapConfigLayerEntry,
  type TypeGeoviewLayerConfig,
  type TypeLayerEntryConfig,
  type TypeLayerInitialSettings,
} from '@/api/types/layer-schema-types';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import {
  getStoreMapClickCoordinates,
  getStoreMapConfigAppBar,
  getStoreMapConfigComponents,
  getStoreMapConfigCorePackages,
  getStoreMapConfigCorePackagesConfig,
  getStoreMapConfigExternalPackages,
  getStoreMapConfigFooterBar,
  getStoreMapConfigGlobalSettings,
  getStoreMapConfigHighlightColor,
  getStoreMapConfigListOfGeoviewLayerConfig,
  getStoreMapConfigNavBar,
  getStoreMapConfigOverviewMap,
  getStoreMapConfigMeta,
  getStoreMapConfigServiceUrls,
  getStoreMapConfigViewSettings,
  getStoreMapCurrentBasemapOptions,
  getStoreMapHighlightedFeatures,
  getStoreMapHighlightedFeaturesByUid,
  getStoreMapHomeView,
  getStoreMapInitialView,
  getStoreMapInteraction,
  getStoreMapPointMarkers,
  getStoreMapRotation,
  isStoreMapConfigInitialized,
  setStoreMapAttribution,
  setStoreMapClickCoordinates,
  setStoreMapClickMarker,
  setStoreMapClickMarkerIconHide,
  setStoreMapCurrentBasemapOptions,
  setStoreMapDisplayed,
  setStoreMapFixNorth,
  setStoreMapGeolocatorSearchArea,
  setStoreMapHighlightedFeatures,
  setStoreMapHomeButtonView,
  setStoreMapInteraction,
  setStoreMapIsMouseInsideMap,
  setStoreMapLoaded,
  setStoreMapMoveEnd,
  setStoreMapPointerPosition,
  setStoreMapPointMarkers,
  setStoreMapProjection,
  setStoreMapRotation,
  setStoreMapSize,
  setStoreMapZoom,
  setStoreMapScale,
} from '@/core/stores/states/map-state';
import { getStoreDataTableSelectedLayerPath } from '@/core/stores/states/data-table-state';
import { getStoreUIActiveAppBarTab, getStoreUIActiveFooterBarTab } from '@/core/stores/states/ui-state';
import { getStoreAppDisplayTheme } from '@/core/stores/states/app-state';
import {
  getStoreLayerHighlightedLayer,
  getStoreLayerHoverable,
  getStoreLayerLegendLayerByPath,
  getStoreLayerOrderedLayerPaths,
  getStoreLayerQueryable,
  getStoreLayerSelectedLayerPath,
} from '@/core/stores/states/layer-state';
import {
  getStoreTimeSliderLayers,
  getStoreTimeSliderSelectedLayerPath,
  isStoreTimeSliderInitialized,
  type TypeTimeSliderProps,
} from '@/core/stores/states/time-slider-state';
import {
  updateStoreCoordinateInfoLayer,
  getStoreDetailsCoordinateInfoEnabled,
  getStoreDetailsSelectedLayerPath,
  setStoreDetailsCoordinateInfoEnabled,
  LAYER_PATH_COORDINATE_INFO,
} from '@/core/stores/states/feature-info-state';
import {
  getStoreGeochartSelectedLayerPath,
  isStoreGeochartInitialized,
  getStoreGeochartChartsConfig,
} from '@/core/stores/states/geochart-state';
import { DEFAULT_OL_FITOPTIONS, OL_ZOOM_DURATION, OL_ZOOM_PADDING, TIMEOUT } from '@/core/utils/constant';
import { DateMgt, type TimeDimension } from '@/core/utils/date-mgt';
import { doTimeout, isValidUUID } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import {
  type MapInteractionChangedDelegate,
  type MapInteractionChangedEvent,
  type MapBaseEvent,
  type MapMouseEnterDelegate,
  type MapMouseLeaveDelegate,
  type MapProjectionChangedDelegate,
  type MapProjectionChangedEvent,
  MapViewer,
  type MapReadyDelegate,
  type MapMoveEndDelegate,
  type MapResolutionChangedDelegate,
  type MapResolutionChangedEvent,
  type MapRotationEvent,
  type MapRotationDelegate,
  type MapPointerMoveEvent,
  type MapPointerMoveDelegate,
  type MapSizeChangedDelegate,
  type MapSizeChangedEvent,
  type MarkerIconShowedDelegate,
  type MarkerIconShowedEvent,
  type MapSingleClickDelegate,
  type MapSingleClickEvent,
} from '@/geo/map/map-viewer';
import { Projection } from '@/geo/utils/projection';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { Draw } from '@/geo/interaction/draw';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { FitOptions } from 'ol/View';
import { GeoUtilities } from '@/geo/utils/utilities';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';

/**
 * Controller responsible for Map interactions.
 */
export class MapController extends AbstractMapViewerController {
  /** The bounded reference to the handle map ready method */
  #boundedHandleMapReady: MapReadyDelegate;

  /** The bounded reference to the handle map resolution changed method */
  #boundedHandleMapResolutionChanged: MapResolutionChangedDelegate;

  /** The bounded reference to the handle map rotation method */
  #boundedHandleMapRotation: MapRotationDelegate;

  /** The bounded reference to the handle map move end method */
  #boundedHandleMapMoveEnd: MapMoveEndDelegate;

  /** The bounded reference to the handle map pointer move method */
  #boundedHandleMapPointerMove: MapPointerMoveDelegate;

  /** The bounded reference to the handle map clicked method */
  #boundedHandleMapClicked: MapSingleClickDelegate;

  /** The bounded reference to the handle map mouse enter method */
  #boundedHandleMapMouseEnter: MapMouseEnterDelegate;

  /** The bounded reference to the handle map mouse leave method */
  #boundedHandleMapMouseLeave: MapMouseLeaveDelegate;

  /** The bounded reference to the handle interaction changed method */
  #boundedHandleMapInteractionChanged: MapInteractionChangedDelegate;

  /** The bounded reference to the handle map projection changed method */
  #boundedHandleMapProjectionChangeStarted: MapProjectionChangedDelegate;

  /** The bounded reference to the handle map projection changed method */
  #boundedHandleMapProjectionChanged: MapProjectionChangedDelegate;

  /** The bounded reference to the handle map size changed method */
  #boundedHandleMapSizeChanged: MapSizeChangedDelegate;

  /** The bounded reference to the handle marker icon showed method */
  #boundedHandleMarkerIconShowed: MarkerIconShowedDelegate;

  /** Resolve callback for the pending projection change promise. */
  #projectionChangeResolve: (() => void) | undefined;

  /** Indicates if the overview map visibility state before the map projection happened */
  #projectionChangingOverviewMapVisibility = false;

  /** Callback delegates for the geolocator search event. */
  #onGeolocatorSearchHandlers: GeolocatorSearchDelegate[] = [];

  /** The active measurement Draw interaction, if any. */
  #activeMeasurementDraw?: Draw;

  /**
   * Creates an instance of MapController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);

    // Keep a bounded reference to the handle map ready
    this.#boundedHandleMapReady = this.#handleMapReady.bind(this);

    // Keep a bounded reference to the handle map resolution changed method
    this.#boundedHandleMapResolutionChanged = this.#handleMapResolutionChanged.bind(this);

    // Keep a bounded reference to the handle map rotation method
    this.#boundedHandleMapRotation = this.#handleMapRotation.bind(this);

    // Keep a bounded reference to the handle map move end method
    this.#boundedHandleMapMoveEnd = this.#handleMapMoveEnd.bind(this);

    // Keep a bounded reference to the handle map pointer move method
    this.#boundedHandleMapPointerMove = this.#handleMapPointerMove.bind(this);

    // Keep a bounded reference to the handle map clicked method
    this.#boundedHandleMapClicked = this.#handleMapClicked.bind(this);

    // Keep a bounded reference to the handle map mouse enter method
    this.#boundedHandleMapMouseEnter = this.#handleMapMouseEnter.bind(this);

    // Keep a bounded reference to the handle map mouse leave method
    this.#boundedHandleMapMouseLeave = this.#handleMapMouseLeave.bind(this);

    // Keep a bounded reference to the handle interaction changed method
    this.#boundedHandleMapInteractionChanged = this.#handleMapInteractionChanged.bind(this);

    // Keep a bounded reference to the handle map projection changed started method
    this.#boundedHandleMapProjectionChangeStarted = this.#handleMapProjectionChangeStarted.bind(this);

    // Keep a bounded reference to the handle map projection changed method
    this.#boundedHandleMapProjectionChanged = this.#handleMapProjectionChanged.bind(this);

    // Keep a bounded reference to the handle map size changed method
    this.#boundedHandleMapSizeChanged = this.#handleMapSizeChanged.bind(this);

    // Keep a bounded reference to the handle marker icon showed method
    this.#boundedHandleMarkerIconShowed = this.#handleMarkerIconShowed.bind(this);
  }

  // #region OVERRIDES

  /**
   * Subscribes to MapViewer events for map state synchronization.
   *
   * Registers handlers for ready, resolution, rotation, move, pointer, click,
   * mouse enter/leave, interaction mode, projection change, size change, and marker icon events.
   */
  protected override onHook(): void {
    // Listens on the map ready event
    this.getMapViewer().onMapReady(this.#boundedHandleMapReady);

    // Listens on the map resolution changed event
    this.getMapViewer().onMapResolutionChanged(this.#boundedHandleMapResolutionChanged);

    // Listens on the map rotation event
    this.getMapViewer().onMapRotation(this.#boundedHandleMapRotation);

    // Listens on the map move end event
    this.getMapViewer().onMapMoveEnd(this.#boundedHandleMapMoveEnd);

    // Listens when the mouse moves on the map
    this.getMapViewer().onMapPointerMove(this.#boundedHandleMapPointerMove);

    // Listens when the map is clicked
    this.getMapViewer().onMapSingleClick(this.#boundedHandleMapClicked);

    // Listens when the mouse enters the map area
    this.getMapViewer().onMapMouseEnter(this.#boundedHandleMapMouseEnter);

    // Listens when the mouse leaves the map area
    this.getMapViewer().onMapMouseLeave(this.#boundedHandleMapMouseLeave);

    // Listens when the interaction mode changes
    this.getMapViewer().onMapInteractionChanged(this.#boundedHandleMapInteractionChanged);

    // Listens when a map projection change start occurs
    this.getMapViewer().onMapProjectionChangeStarted(this.#boundedHandleMapProjectionChangeStarted);

    // Listens when a map projection change occurs
    this.getMapViewer().onMapProjectionChanged(this.#boundedHandleMapProjectionChanged);

    // Listens when the map size changes
    this.getMapViewer().onMapSizeChanged(this.#boundedHandleMapSizeChanged);

    // Listens when a marker icon is showed
    this.getMapViewer().onMarkerIconShowed(this.#boundedHandleMarkerIconShowed);
  }

  /**
   * Unsubscribes from all MapViewer events registered in onHook.
   */
  protected override onUnhook(): void {
    // Unhooks when a marker icon is showed
    this.getMapViewer().offMarkerIconShowed(this.#boundedHandleMarkerIconShowed);

    // Unhooks when the map size changes
    this.getMapViewer().offMapSizeChanged(this.#boundedHandleMapSizeChanged);

    // Unhooks when a map projection change occurs
    this.getMapViewer().offMapProjectionChanged(this.#boundedHandleMapProjectionChanged);

    // Unhooks when a map projection change start occurs
    this.getMapViewer().offMapProjectionChangeStarted(this.#boundedHandleMapProjectionChangeStarted);

    // Unhooks when the interaction mode changes
    this.getMapViewer().offMapInteractionChanged(this.#boundedHandleMapInteractionChanged);

    // Unhooks when the mouse leaves the map area
    this.getMapViewer().offMapMouseLeave(this.#boundedHandleMapMouseLeave);

    // Unhooks when the mouse enters the map area
    this.getMapViewer().offMapMouseEnter(this.#boundedHandleMapMouseEnter);

    // Unhooks when the map is clicked
    this.getMapViewer().offMapSingleClick(this.#boundedHandleMapClicked);

    // Listens when the mouse moves on the map
    this.getMapViewer().offMapPointerMove(this.#boundedHandleMapPointerMove);

    // Unhooks when the mouse move ends
    this.getMapViewer().offMapMoveEnd(this.#boundedHandleMapMoveEnd);

    // Unhooks when the map rotation changes
    this.getMapViewer().offMapRotation(this.#boundedHandleMapRotation);

    // Listens on the map resolution changed event
    this.getMapViewer().offMapResolutionChanged(this.#boundedHandleMapResolutionChanged);

    // Unhooks when the map is ready
    this.getMapViewer().offMapReady(this.#boundedHandleMapReady);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS - ZOOM FUNCTIONS

  /**
   * Zooms to the specified extent (in map projection).
   *
   * @param extent - The extent to zoom to
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @param options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 })
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the extent is invalid
   */
  zoomToExtent(extent: Extent, useAnimation = true, options: FitOptions = DEFAULT_OL_FITOPTIONS): Promise<void> {
    // Redirect to the MapViewer
    return this.getMapViewer().zoomToExtent(extent, useAnimation, options);
  }

  /**
   * Converts a zoom level to a map scale denominator.
   *
   * @param zoom - The zoom level
   * @returns The scale denominator (e.g. 50000 for 1:50,000), or undefined if conversion is unavailable
   */
  getScaleFromZoom(zoom: number): number | undefined {
    return this.getMapViewer().getMapScaleFromZoom(zoom);
  }

  /**
   * Converts a map scale denominator to the corresponding zoom level.
   *
   * @param scale - The scale denominator (e.g. 50000 for 1:50,000)
   * @returns The zoom level for the given scale, or undefined if conversion is unavailable
   */
  getZoomFromScale(scale: number): number | undefined {
    return this.getMapViewer().getZoomFromScale(scale);
  }

  /**
   * Converts a map scale denominator into the corresponding OpenLayers resolution.
   *
   * @param scale - The scale denominator (e.g. 50000 for 1:50,000)
   * @returns The map resolution in map units per pixel, or undefined if conversion is unavailable
   */
  getResolutionFromScale(scale: number): number | undefined {
    return this.getMapViewer().getMapResolutionFromScale(scale);
  }

  /**
   * Returns to initial view state of map using config.
   *
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @returns A promise that resolves when the zoom animation is complete
   */
  async zoomToInitialExtent(useAnimation = true): Promise<void> {
    // Get the map id
    const mapId = this.getMapId();

    const currProjection = this.getMapViewer().getProjectionNumber();
    let extent: Extent | undefined = MAP_EXTENTS[currProjection];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };
    const homeView = getStoreMapHomeView(mapId) || getStoreMapInitialView(mapId);

    // Transform center coordinates and update options if zoomAndCenter are in config
    if (homeView.zoomAndCenter) {
      [options.maxZoom] = homeView.zoomAndCenter!;

      const center = homeView.zoomAndCenter[1];
      const projectedCoords = Projection.transformPoints([center], Projection.PROJECTION_NAMES.LONLAT, `EPSG:${currProjection}`);

      extent = [...projectedCoords[0], ...projectedCoords[0]];
    }

    // If extent is in config, use it
    if (homeView.extent) {
      const lonlatExtent = homeView.extent;
      // If extent is not lon/lat, we assume it is in the map projection and use it as is.
      extent = GeoUtilities.isExtentLonLat(lonlatExtent)
        ? Projection.transformExtentFromProj(
            lonlatExtent,
            Projection.getProjectionLonLat(),
            Projection.getProjectionFromStringOrNumber(currProjection)
          )
        : lonlatExtent;

      options.padding = [0, 0, 0, 0];
    }

    // If layer IDs are in the config, use them
    if (homeView.layerIds) extent = await this.getControllersRegistry().layerController.getExtentOfMultipleLayers(homeView.layerIds);

    // If extent is not valid, take the default one for the current projection
    if (!extent || extent.length !== 4 || extent.includes(Infinity))
      extent = Projection.transformExtentFromProj(
        MAP_EXTENTS[currProjection],
        Projection.getProjectionLonLat(),
        Projection.getProjectionFromStringOrNumber(currProjection)
      );

    return this.zoomToExtent(extent, useAnimation, options);
  }

  /**
   * Zooms to geolocation position provided.
   *
   * @param position - lon/lat position to zoom to
   * @returns A promise that resolves when the zoom animation is complete
   */
  zoomToMyLocation(position: GeolocationPosition): Promise<void> {
    const coord: Coordinate = [position.coords.longitude, position.coords.latitude];
    const projectedCoords = Projection.transformPoints(
      [coord],
      Projection.PROJECTION_NAMES.LONLAT,
      this.getMapViewer().getProjectionEPSG()
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];

    return this.zoomToExtent(extent);
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
    // Redirect to the MapViewer
    return this.getMapViewer().zoomMap(zoom, useAnimation, duration);
  }

  /**
   * Animates the map zoom without awaiting the result.
   *
   * Fires and forgets the zoom, logging any errors.
   *
   * @param zoom - The target zoom level
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @param duration - Optional animation duration in ms
   */
  zoomMapAndForget(zoom: number, useAnimation = true, duration: number = OL_ZOOM_DURATION): void {
    // Redirect
    this.zoomMap(zoom, useAnimation, duration).catch((error: unknown) => {
      logger.logError('Map-State Failed to zoom map', error);
    });
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
    // Redirect to the MapViewer
    return this.getMapViewer().zoomToLonLatExtentOrCoordinate(extent, useAnimation, options);
  }

  /**
   * Zooms to a geolocator search result location.
   *
   * Highlights the bounding box if available, zooms to the extent, and shows the click marker.
   *
   * @param searchItem - The search item description
   * @param coords - The lon/lat coordinates to zoom to
   * @param useAnimation - Indicates if a zoom animation should be used, default: true
   * @param bbox - Optional bounding box extent for the search result
   * @returns A promise that resolves when the zoom is complete
   */
  async zoomToGeoLocatorLocation(searchItem: string, coords: Coordinate, useAnimation = true, bbox?: Extent): Promise<void> {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreMapGeolocatorSearchArea(mapId, searchItem, coords, bbox);

    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box');
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }

    if (bbox) {
      // GV There were issues with fromLonLat in rare cases in LCC projections, transformExtentFromProj seems to solve them.
      // GV fromLonLat and transformExtentFromProj give differing results in many cases, fromLonLat had issues with the first
      // GV three results from a geolocator search for "vancouver river"
      const convertedExtent = Projection.transformExtentFromProj(
        bbox,
        Projection.getProjectionLonLat(),
        this.getMapViewer().getProjection()
      );

      // Highlight
      this.getMapViewer().featureHighlight.highlightGeolocatorBBox(convertedExtent);

      // Zoom to extent and await
      await this.zoomToExtent(convertedExtent, useAnimation, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
        duration: OL_ZOOM_DURATION,
      });

      // Now show the click marker icon
      this.clickMarkerIconShow({ lonlat: coords });
      for (let i = 0; i < indicatorBox.length; i++) {
        (indicatorBox[i] as HTMLElement).style.display = '';
      }
    } else {
      const projectedCoords = Projection.transformPoints(
        [coords],
        Projection.PROJECTION_NAMES.LONLAT,
        this.getMapViewer().getProjectionEPSG()
      );

      const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];

      // Zoom to extent and await
      await this.zoomToExtent(extent);

      // Now show the click marker icon
      this.clickMarkerIconShow({ lonlat: coords });
      for (let i = 0; i < indicatorBox.length; i++) {
        (indicatorBox[i] as HTMLElement).style.display = '';
      }
    }

    // Emit the geolocator search event
    this.#emitGeolocatorSearch({ searchItem, coords, bbox });
  }

  /**
   * Sets the home button view settings in the store for the map.
   *
   * @param view - The view settings to set for the home button
   */
  setHomeButtonView(view: TypeMapViewSettings): void {
    // Save to the store
    setStoreMapHomeButtonView(this.getMapId(), view);
  }

  // #endregion PUBLIC METHODS - ZOOM FUNCTIONS

  // #region PUBLIC METHODS - HIGHLIGHT FEATURES

  /**
   * Adds a feature to the highlighted features list and visually highlights it on the map.
   *
   * WMS features are excluded since they cannot be individually highlighted.
   *
   * @param feature - The feature to highlight
   */
  addHighlightedFeature(feature: TypeFeatureInfoEntry): void {
    if (feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
      this.getMapViewer().featureHighlight.highlightFeature(feature);

      // Save in store
      // TODO: CHECK - What is this doing? Just refreshing the highlighted features with the same list?
      setStoreMapHighlightedFeatures(this.getMapId(), [...getStoreMapHighlightedFeatures(this.getMapId()), feature]);
    }
  }

  /**
   * Highlights a bounding box on the map.
   *
   * @param extent - The extent to highlight
   * @param isLayerHighlight - Optional flag indicating if this is a layer-level highlight
   */
  highlightBBox(extent: Extent, isLayerHighlight?: boolean): void {
    // Perform a highlight bbox
    this.getMapViewer().featureHighlight.highlightGeolocatorBBox(extent, isLayerHighlight);
  }

  /**
   * Removes the highlighted bounding box from the map.
   */
  removeBBoxHighlight(): void {
    // Remove the highlight bbox
    this.getMapViewer().featureHighlight.removeBBoxHighlight();
  }

  /**
   * Removes a highlighted feature, or all highlighted features, from the map.
   *
   * WMS features are excluded since they cannot be individually highlighted.
   *
   * @param feature - The feature to remove, or 'all' to remove all highlights
   */
  removeHighlightedFeature(feature: TypeFeatureInfoEntry | 'all'): void {
    if (feature === 'all' || feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
      // Filter what we want to keep as highlighted features
      let highlightedFeatures: TypeFeatureInfoEntry[] = [];
      if (feature === 'all') {
        this.getMapViewer().featureHighlight.removeHighlight(feature);
      } else {
        this.getMapViewer().featureHighlight.removeHighlight(feature.uid!);

        // Get highlighted features from the store
        // TODO: CHECK - Why are we getting the features to resave them right after? Just to trigger a store update?
        highlightedFeatures = getStoreMapHighlightedFeaturesByUid(this.getMapId(), feature.uid);
      }

      // Save in store
      setStoreMapHighlightedFeatures(this.getMapId(), highlightedFeatures);
    }
  }

  /**
   * Adds point markers to a group, replacing existing markers with matching IDs or coordinates.
   *
   * @param group - The group to add the markers to
   * @param pointMarkers - The point markers to add
   */
  addPointMarkers(group: string, pointMarkers: TypePointMarker[]): void {
    const curMarkers = getStoreMapPointMarkers(this.getMapId());

    // Check for existing group, and existing markers that match input IDs or coordinates
    let groupMarkers = curMarkers[group];
    if (groupMarkers) {
      pointMarkers.forEach((pointMarker) => {
        // Replace any existing ids or markers at the same coordinates with new marker
        groupMarkers = groupMarkers.filter((marker) => marker.coordinate.join() !== pointMarker.coordinate.join());
        groupMarkers = groupMarkers.filter((marker) => marker.id !== pointMarker.id);
        groupMarkers.push(pointMarker);
      });
    } else {
      groupMarkers = pointMarkers;
    }

    // Set the group markers, and update on the map
    curMarkers[group] = groupMarkers;
    setStoreMapPointMarkers(this.getMapId(), curMarkers);
    this.getMapViewer().featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  /**
   * Removes point markers from a group, or removes the entire group.
   *
   * @param group - The group to remove the markers from
   * @param idsOrCoordinates - Optional IDs or coordinates of the markers to remove; if omitted, the entire group is removed
   */
  removePointMarkersOrGroup(group: string, idsOrCoordinates?: string[] | Coordinate[]): void {
    const curMarkers = getStoreMapPointMarkers(this.getMapId());

    // If no IDs or coordinates are provided, remove group
    if (!idsOrCoordinates) {
      delete curMarkers[group];
    } else {
      // Set property to check
      const property = typeof idsOrCoordinates[0] === 'string' ? 'id' : 'coordinate';

      // Filter out markers that match given ones
      let groupMarkers = curMarkers[group];
      idsOrCoordinates.forEach((idOrCoordinate) => {
        groupMarkers = groupMarkers.filter((marker) => marker[property] !== idOrCoordinate);
      });

      curMarkers[group] = groupMarkers;
    }

    // Set the pointMarkers and update on map
    setStoreMapPointMarkers(this.getMapId(), curMarkers);
    this.getMapViewer().featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  // #endregion PUBLIC METHODS - HIGHLIGHT FEATURES

  // #region PUBLIC METHODS - PROJECTION SWITCH

  /**
   * Changes the map projection.
   *
   * Reprojects the view, reloads basemaps, refreshes layers, removes incompatible vector tile layers,
   * and repeats the last feature query. Shows a circular progress indicator during the transition.
   *
   * @param projectionNumber - The target projection code
   * @returns A promise that resolves when the projection change is complete
   */
  setProjection(projectionNumber: TypeValidMapProjectionCodes): Promise<void> {
    // If invalid, return
    if (!VALID_PROJECTION_CODES.includes(Number(projectionNumber))) return Promise.resolve();

    // Create a promise that will be resolved by the projection changed event handler
    const promise = new Promise<void>((resolve) => {
      this.#projectionChangeResolve = resolve;
    });

    // Set the projection on the MapViewer (fires the MapProjectionChangedEvent)
    const changed = this.getMapViewer().setProjection(projectionNumber);

    // If the projection was not changed (unsupported), resolve immediately
    if (!changed) {
      this.#projectionChangeResolve = undefined;
      return Promise.resolve();
    }

    // Return the promise that the projection will happen
    return promise;
  }

  /**
   * Changes the map projection without awaiting the result.
   *
   * Fires and forgets the projection change, logging any errors.
   *
   * @param projectionCode - The target projection code
   */
  setProjectionAndForget(projectionCode: TypeValidMapProjectionCodes): void {
    // Redirect
    this.setProjection(projectionCode).catch((error: unknown) => {
      logger.logError('Map-State Failed to set projection', error);
    });
  }

  // #endregion PUBLIC METHODS - PROJECTION SWITCH

  // #region PUBLIC METHODS - OTHERS

  /**
   * Converts a map coordinate to a pixel position.
   *
   * @param coord - The map coordinate
   * @returns The pixel position on the map viewport, or undefined if the map is not yet initialized
   */
  getPixelFromCoordinate(coord: Coordinate): Pixel | undefined {
    return this.getMapViewer().map?.getPixelFromCoordinate(coord) ?? undefined;
  }

  /**
   * Gets the current map center as a TypeMapMouseInfo object.
   *
   * Useful as a fallback when the pointer position store has not been set yet
   * (e.g., when the crosshair is first activated and the user hasn't panned).
   *
   * @returns The map center position info
   */
  getMapCenterPosition(): TypeMapMouseInfo {
    const mapViewer = this.getMapViewer();
    const view = mapViewer.getView();
    const projected = view.getCenter()!;
    const lonlat = Projection.transformToLonLat(projected, mapViewer.getProjection());
    const pixel = mapViewer.map.getPixelFromCoordinate(projected);
    return { lonlat, pixel, projected, dragging: false };
  }

  /**
   * Sets the click coordinates in the store, updates coordinate info if enabled, and triggers a feature query at the clicked location.
   *
   * @param clickCoordinates - The click coordinate information
   * @param abortSignal - Optional abort signal to cancel the coordinate info fetch requests
   */
  setClickCoordinates(clickCoordinates: TypeMapMouseInfo, abortSignal?: AbortSignal): void {
    // Save in store
    setStoreMapClickCoordinates(this.getMapId(), clickCoordinates);

    // If the coordinate info is enabled
    if (getStoreDetailsCoordinateInfoEnabled(this.getMapId())) {
      // Update the coordinate info with the new click coordinates
      this.updateStoreCoordinateInfo(clickCoordinates, getStoreMapConfigServiceUrls(this.getMapId()), abortSignal).catch(
        (error: unknown) => {
          // Log
          logger.logPromiseFailed('updateStoreCoordinateInfo in mapController.setClickCoordinatesAndQuery', error);
        }
      );
    }
  }

  /**
   * Sets the reference to the click marker overlay element in the MapViewer.
   *
   * This allows the MapViewer to control the display and positioning of the click marker on the map.
   *
   * @param clickMarkerRef - The HTMLDivElement reference for the click marker overlay
   */
  setClickMarkerOverlayRef(clickMarkerRef: HTMLDivElement): void {
    this.getMapViewer().getClickMarkerOverlay().setElement(clickMarkerRef);
  }

  /**
   * Sets the reference to the north pole marker overlay element in the MapViewer.
   *
   * @param northPoleMarkerRef - The HTMLDivElement reference for the north pole marker overlay
   */
  setNorthPoleMarkerOverlayRef(northPoleMarkerRef: HTMLDivElement): void {
    this.getMapViewer().getNorthPoleMarkerOverlay().setElement(northPoleMarkerRef);
  }

  /**
   * Shows the click marker icon at the given marker position.
   *
   * @param marker - The click marker containing lon/lat coordinates
   */
  clickMarkerIconShow(marker: TypeClickMarker): void {
    // Redirect to the MapViewer
    this.getMapViewer().clickMarkerIconShow(marker);
  }

  /**
   * Hides the click marker icon and clears the click marker from the store.
   */
  clickMarkerIconHide(): void {
    // Save to the store
    setStoreMapClickMarkerIconHide(this.getMapId());
  }

  /**
   * Sets the fix north state.
   *
   * @param fixNorth - The new fix north state
   */
  setFixNorth(fixNorth: boolean): void {
    // Save to the store
    setStoreMapFixNorth(this.getMapId(), fixNorth);
  }

  /**
   * Forces the map to re-render all layers and features.
   * Useful when layer styles or features have been updated programmatically and need to be reflected visually.
   */
  forceMapToRender(): void {
    this.getMapViewer().map.render();
  }

  /**
   * Sets the React root for the overview map so it can be destroyed with the map element.
   *
   * @param overviewRoot - The React root element for the overview map
   */
  setMapOverviewMapRoot(overviewRoot: Root): void {
    this.getMapViewer().overviewRoot = overviewRoot;
  }

  /**
   * Nudges the map center by an imperceptible amount to trigger extent change events.
   *
   * Useful for triggering extent-based listeners without visible map movement.
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param offsetX - The horizontal offset in map units (default: 0.00001)
   * @param offsetY - The vertical offset in map units (default: 0)
   */
  nudgeMapCenter(offsetX = 0.00001, offsetY = 0): void {
    const view = this.getMapViewer().getView();
    const currentCenter = view.getCenter()!;

    // Shift center by imperceptible amount
    const newCenter: Coordinate = [currentCenter[0] + offsetX, currentCenter[1] + offsetY];

    // Set center without animation
    view.setCenter(newCenter);
    // GV No need to save to the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  /**
   * Rotates the map to the specified angle.
   *
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param rotation - The target rotation angle in radians
   * @param animate - Whether to animate the rotation change, defaults to true
   */
  rotate(rotation: number, animate = true): void {
    // Do the actual view map rotation
    const view = this.getMapViewer().getView();

    if (animate) {
      view.animate({ rotation });
      return;
    }

    // Cancel any in-flight animations so slider drags stay in sync with the displayed value.
    view.cancelAnimations();
    view.setRotation(rotation);
    // GV No need to save to the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  /**
   * Toggles the coordinate info display on or off.
   *
   * When toggled on, clicking the map will display coordinate information such as UTM zone, NTS sheet, and altitude.
   * When toggled off, any existing details coordinate info is removed from the details store.
   * The clicked coordinates themselves remain in the map store.
   *
   * @param abortSignal - Optional AbortSignal to cancel the fetch requests if needed
   */
  toggleCoordinateInfoEnabled(abortSignal: AbortSignal): void {
    // Get the state value
    const oldCoordinateInfoEnabledState = getStoreDetailsCoordinateInfoEnabled(this.getMapId());
    const newCoordinateInfoEnabledState = !oldCoordinateInfoEnabledState;
    setStoreDetailsCoordinateInfoEnabled(this.getMapId(), newCoordinateInfoEnabledState);

    // If activating and there's coordinates stored already in the map store
    const clickCoordinates = getStoreMapClickCoordinates(this.getMapId());
    if (newCoordinateInfoEnabledState && clickCoordinates) {
      // Refresh the coordinate info
      this.updateStoreCoordinateInfo(clickCoordinates, getStoreMapConfigServiceUrls(this.getMapId()), abortSignal).catch(
        (error: unknown) => {
          // Log
          logger.logPromiseFailed('in updateStoreCoordinateInfo in mapController.toggleCoordinateInfoEnabled', error);
        }
      );
      return;
    }

    // If toggling it off
    if (!newCoordinateInfoEnabledState) {
      // Remove coordinate info layer when disabled
      this.getControllersRegistry().detailsController.deleteFeatureInfo(LAYER_PATH_COORDINATE_INFO);
    }
  }

  /**
   * Creates or deletes coordinate info based on the current enabled state.
   *
   * When coordinate info is enabled, fetches UTM zone, NTS sheet, and altitude
   * data from the configured service URLs and creates a coordinate info layer
   * entry in the store. When disabled, removes any existing coordinate info.
   *
   * @param coordinates - The map mouse info containing click coordinates
   * @param serviceUrls - Service URLs for UTM, NTS, and altitude lookups
   * @param abortSignal - Optional AbortSignal to cancel the fetch requests if needed
   */
  async updateStoreCoordinateInfo(coordinates: TypeMapMouseInfo, serviceUrls: TypeServiceUrls, abortSignal?: AbortSignal): Promise<void> {
    const [lng, lat] = coordinates.lonlat;
    const { utmZoneUrl, ntsSheetUrl, altitudeUrl } = serviceUrls;

    try {
      // Reset it in the store
      updateStoreCoordinateInfoLayer(this.getMapId(), [], 'processing');

      // Query utm zone information
      const promiseUtmZoneResponse = Fetch.fetchJson<TypeUtmZoneResponse>(`${utmZoneUrl}?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`, {
        signal: abortSignal,
      });

      // Query Nts information
      const promiseNtsResponse = Fetch.fetchJson<TypeNtsResponse>(`${ntsSheetUrl}?bbox=${lng}%2C${lat}%2C${lng}%2C${lat}`, {
        signal: abortSignal,
      });

      // Query altitude information
      const promiseAltitudeResponse = Fetch.fetchJson<TypeAltitudeResponse>(`${altitudeUrl}?lat=${lat}&lon=${lng}`, {
        signal: abortSignal,
      });

      // Start a timer to warn the user if fetches take too long
      const slowWarningTimer = doTimeout(TIMEOUT.delayBeforeShowingSlowCoordinateInfoWarning);
      slowWarningTimer.promise
        .then((timeoutResult) => {
          // If the signal has been aborted, it means we don't care about the fetch result anymore, so ignore
          if (abortSignal?.aborted) return;

          // If the slow warning timer was cancelled, it means the fetches completed in time, so ignore
          if (timeoutResult === 'cancelled') return;

          // It took too long
          this.getMapViewer().notifications.showWarning('warning.layer.slowCoordinateInfo');
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('in slowWarningTimer in mapController.updateStoreCoordinateInfo', error);
        });

      // Await all promises are settled
      const [utmResult, ntsResult, elevationResult] = await Promise.allSettled([
        promiseUtmZoneResponse,
        promiseNtsResponse,
        promiseAltitudeResponse,
      ]);

      // Cancel the warning timer, because we got a response
      slowWarningTimer.cancel();

      const utmData = utmResult.status === 'fulfilled' ? utmResult.value : undefined;
      const ntsData = ntsResult.status === 'fulfilled' ? ntsResult.value : undefined;
      const elevationData = elevationResult.status === 'fulfilled' ? elevationResult.value : undefined;

      const utmIdentifier = utmData?.features[0].properties.identifier;
      const [easting, northing] = utmIdentifier
        ? Projection.transformToUTMNorthingEasting(coordinates.lonlat, utmIdentifier)
        : [undefined, undefined];

      // Create coordinate info layer entry
      const coordinateFeature: TypeFeatureInfoEntry[] = [
        {
          uid: 'coordinate-info-feature',
          fieldInfo: {
            latitude: { value: lat.toFixed(6), fieldKey: 0, dataType: 'number', alias: 'Latitude' },
            longitude: { value: lng.toFixed(6), fieldKey: 1, dataType: 'number', alias: 'Longitude' },
            utmZone: { value: utmIdentifier, fieldKey: 2, dataType: 'string', alias: 'UTM Identifier' },
            easting: { value: easting?.toFixed(2), fieldKey: 3, dataType: 'number', alias: 'Easting' },
            northing: { value: northing?.toFixed(2), fieldKey: 4, dataType: 'number', alias: 'Northing' },
            ntsMapsheet: {
              value: ntsData?.features
                .filter((f) => f.properties.name !== '')
                .sort((f) => f.properties.scale)
                .map((f) => {
                  const scale = `${f.properties.scale / 1000}K`;
                  return `${f.properties.identifier} - ${f.properties.name} - ${scale}`;
                })
                .join('\n'),
              fieldKey: 5,
              dataType: 'string',
              alias: 'NTS Mapsheets',
            },
            elevation: {
              value: elevationData?.altitude ? `${elevationData.altitude} m` : undefined,
              fieldKey: 6,
              dataType: 'string',
              alias: 'Elevation',
            },
          },
          featureKey: 0,
          geoviewLayerType: 'CSV',
          supportZoomTo: true,
          layerPath: LAYER_PATH_COORDINATE_INFO,
        },
      ];

      // Update it in the store
      updateStoreCoordinateInfoLayer(this.getMapId(), coordinateFeature, 'processed');
    } catch (error: unknown) {
      // Update it in the store
      updateStoreCoordinateInfoLayer(this.getMapId(), [], 'error');

      // Keep throwing
      throw error;
    }
  }

  // #endregion PUBLIC METHODS - OTHERS

  // #region PUBLIC METHODS - BASEMAP API

  /**
   * Sets the attribution text for the map.
   *
   * @param attribution - An array of attribution strings to display on the map
   */
  setAttribution(attribution: string[]): void {
    // Save in the store
    setStoreMapAttribution(this.getMapId(), attribution);
  }

  /**
   * Gets the OpenLayers overview map control for the given map.
   *
   * @param div - The HTML div element to host the overview map
   * @returns The OpenLayers OverviewMap control
   */
  initOverviewMapControl(div: HTMLDivElement): OLOverviewMap {
    const olMap = this.getMapViewer().map;
    return this.getMapViewer().basemap.initOverviewMapControl(olMap, div);
  }

  /**
   * Gets the visibility state of the overview map control.
   *
   * @returns True if the overview map control is visible, false otherwise
   */
  getOverviewMapVisibility(): boolean {
    return this.getMapViewer().basemap.getOverviewMapControlVisibility();
  }

  /**
   * Sets the visibility of the overview map control.
   *
   * @param visible - Whether the overview map should be visible
   */
  setOverviewMapVisibility(visible: boolean): void {
    const olMap = this.getMapViewer().map;
    this.getMapViewer().basemap.setOverviewMapControlVisibility(olMap, visible);
  }

  /**
   * Waits until the overview map visibility matches the expected state.
   *
   * @param expectedVisible - The expected visibility state to wait for
   * @returns A promise that resolves when the visibility matches the expected state
   */
  waitForOverviewMapVisibility(expectedVisible: boolean): Promise<void> {
    return this.getMapViewer().basemap.waitForOverviewMapVisibility(expectedVisible);
  }

  /**
   * Resets the basemap using the current display language and projection.
   *
   * @returns A promise that resolves when the basemap has been reloaded
   */
  resetBasemap(): Promise<void> {
    // reset basemap will use the current display language and projection and recreate the basemap
    const language = this.getMapViewer().getDisplayLanguage();
    const projection = this.getMapViewer().getProjectionNumber();
    return this.getMapViewer().basemap.loadDefaultBasemaps(projection, language);
  }

  /**
   * Creates and sets a new basemap with the given options.
   *
   * @param basemapOptions - The basemap options to apply
   * @returns A promise that resolves when the basemap has been set
   */
  async setBasemap(basemapOptions: TypeBasemapOptions): Promise<void> {
    // Set basemap will use the current display language and projection and recreate the basemap
    const language = this.getMapViewer().getDisplayLanguage();
    const projection = this.getMapViewer().getProjectionNumber();

    // Create the core basemap
    const basemap = await this.getMapViewer().basemap.createCoreBasemap(basemapOptions, projection, language);

    // Set the basemap and basemap options
    this.getMapViewer().basemap.setBasemap(basemap);

    // Save to the store
    setStoreMapCurrentBasemapOptions(this.getMapId(), basemapOptions);
  }

  // #endregion PUBLIC METHODS - BASEMAP API

  // #region PUBLIC METHODS - CONFIG CREATION

  /**
   * Creates a map config based on current map state.
   *
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults
   * @param includeFeatureInfo - Indicates if feature info should be included in the config for each layer
   * @returns The type map features instance
   */
  createMapConfigFromMapState(
    overrideGeocoreServiceNames: boolean | 'hybrid' = true,
    includeFeatureInfo = false
  ): TypeMapFeaturesInstance | undefined {
    // Get the map id
    const mapId = this.getMapId();

    // Get the map viewer
    const mapViewer = this.getMapViewer();

    if (isStoreMapConfigInitialized(mapId)) {
      // Get paths of top level layers
      const layerOrder = getStoreLayerOrderedLayerPaths(mapId).filter(
        (layerPath) => !this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(layerPath)?.getParentLayerConfig()
      );

      // Build list of geoview layer configs
      const listOfGeoviewLayerConfig = layerOrder
        .map((layerPath) => this.#createGeoviewLayerConfig(layerPath, overrideGeocoreServiceNames, includeFeatureInfo))
        .filter((mapLayerEntry) => !!mapLayerEntry);

      // Get info for view
      const projection = mapViewer.getProjectionNumber();
      const currentView = mapViewer.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjection, Projection.PROJECTION_NAMES.LONLAT)[0] as [
        number,
        number,
      ];

      // Get store map config view settings
      const storeViewSettings = getStoreMapConfigViewSettings(mapId);

      // Set view settings
      const viewSettings: TypeViewSettings = {
        initialView: { zoomAndCenter: [currentView.getZoom() as number, centerLatLng] },
        homeView: getStoreMapHomeView(mapId),
        enableRotation: storeViewSettings?.enableRotation !== undefined ? storeViewSettings.enableRotation : undefined,
        initialClickCoordinate: this.getControllersRegistry().layerSetController.getLastQueryLonLat(),
        rotation: getStoreMapRotation(mapId),
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: storeViewSettings?.maxExtent,
        projection,
      };

      // Set map config settings
      const map: TypeMapConfig = {
        interaction: getStoreMapInteraction(mapId),
        viewSettings,
        basemapOptions: getStoreMapCurrentBasemapOptions(mapId),
        highlightColor: getStoreMapConfigHighlightColor(mapId),
        overlayObjects: { pointMarkers: getStoreMapPointMarkers(mapId) },
        listOfGeoviewLayerConfig,
      };

      let corePackagesConfig = getStoreMapConfigCorePackagesConfig(mapId);

      // Create time slider config and add to core package configs
      if (isStoreTimeSliderInitialized(mapId)) {
        const sliders = MapController.#createTimeSliderConfigs(mapId);
        if (corePackagesConfig && sliders) {
          const configObj = corePackagesConfig?.find((packageConfig) => Object.keys(packageConfig).includes('time-slider'));
          if (configObj) configObj['time-slider'] = { sliders };
          else corePackagesConfig.push({ 'time-slider': { sliders } });
        } else if (sliders) corePackagesConfig = [{ 'time-slider': { sliders } }];
      }

      // Create geochart config and add to core package configs
      if (isStoreGeochartInitialized(mapId)) {
        const charts = MapController.#createGeochartConfigs(mapId);
        if (corePackagesConfig && charts) {
          const configObj = corePackagesConfig?.find((packageConfig) => Object.keys(packageConfig).includes('geochart'));
          if (configObj) configObj['geochart'] = { charts };
          else corePackagesConfig.push({ geochart: { charts } });
        } else if (charts) corePackagesConfig = [{ geochart: { charts } }];
      }

      // Construct map config
      const newMapConfig: TypeMapFeaturesInstance = {
        configMeta: getStoreMapConfigMeta(mapId),
        map,
        components: getStoreMapConfigComponents(mapId),
        overviewMap: getStoreMapConfigOverviewMap(mapId),
        navBar: getStoreMapConfigNavBar(mapId),
        appBar: getStoreMapConfigAppBar(mapId),
        footerBar: getStoreMapConfigFooterBar(mapId),
        corePackages: getStoreMapConfigCorePackages(mapId),
        globalSettings: getStoreMapConfigGlobalSettings(mapId),
        serviceUrls: getStoreMapConfigServiceUrls(mapId),
        theme: getStoreAppDisplayTheme(mapId),
        corePackagesConfig,
        externalPackages: getStoreMapConfigExternalPackages(mapId),
      };

      // Set app bar tab settings
      if (newMapConfig.appBar) {
        newMapConfig.appBar.selectedTab = getStoreUIActiveAppBarTab(mapId).tabId as TypeValidAppBarCoreProps;

        const selectedDataTableLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        if (selectedDataTableLayerPath) newMapConfig.appBar.selectedDataTableLayerPath = selectedDataTableLayerPath;
        const selectedLayerPath = getStoreLayerSelectedLayerPath(mapId);
        if (selectedLayerPath) newMapConfig.appBar.selectedLayersLayerPath = selectedLayerPath;
        const selectedDetailsLayerPath = getStoreDetailsSelectedLayerPath(mapId);
        if (selectedDetailsLayerPath) newMapConfig.appBar.selectedDetailsLayerPath = selectedDetailsLayerPath;
      }

      // Set footer bar tab settings
      if (newMapConfig.footerBar) {
        newMapConfig.footerBar.selectedTab = getStoreUIActiveFooterBarTab(mapId).tabId as TypeValidFooterBarTabsCoreProps;

        const selectedDataTableLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        if (selectedDataTableLayerPath) newMapConfig.footerBar.selectedDataTableLayerPath = selectedDataTableLayerPath;
        const selectedLayerLayerPath = getStoreLayerSelectedLayerPath(mapId);
        if (selectedLayerLayerPath) newMapConfig.footerBar.selectedLayersLayerPath = selectedLayerLayerPath;
        const selectedDetailsLayerPath = getStoreDetailsSelectedLayerPath(mapId);
        if (selectedDetailsLayerPath) newMapConfig.footerBar.selectedDetailsLayerPath = selectedDetailsLayerPath;
        if (isStoreGeochartInitialized(mapId)) {
          const selectedGeochartLayerPath = getStoreGeochartSelectedLayerPath(mapId);
          if (selectedGeochartLayerPath) newMapConfig.footerBar.selectedGeochartLayerPath = selectedGeochartLayerPath;
        }

        // If the TimeSlider plugin is initialized
        if (isStoreTimeSliderInitialized(mapId)) {
          // Store it
          newMapConfig.footerBar.selectedTimeSliderLayerPath = getStoreTimeSliderSelectedLayerPath(mapId);
        }
      }

      // Update global settings with current coordinate info enabled state
      const coordinateInfoEnabled = getStoreDetailsCoordinateInfoEnabled(mapId);
      if (coordinateInfoEnabled !== undefined && newMapConfig.globalSettings)
        newMapConfig.globalSettings.coordinateInfoEnabled = coordinateInfoEnabled;
      else if (coordinateInfoEnabled) newMapConfig.globalSettings = { coordinateInfoEnabled };

      return newMapConfig;
    }

    return undefined;
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
    removeUnlisted = false
  ): TypeMapFeaturesInstance | undefined {
    const mapConfigToUse = mapConfig || this.createMapConfigFromMapState();
    if (mapConfigToUse) return MapController.utilReplaceMapConfigLayerNames(namePairs, mapConfigToUse, removeUnlisted);
    return undefined;
  }

  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   *
   * @param namePairs - The array of name pairs. Presumably one english and one french name in each pair
   * @param mapConfig - The config to modify
   * @param removeUnlisted - Remove any layer name that doesn't appear in namePairs
   * @returns Map config with updated names
   */
  static utilReplaceMapConfigLayerNames(
    namePairs: string[][],
    mapConfig: TypeMapFeaturesInstance,
    removeUnlisted = false
  ): TypeMapFeaturesInstance {
    const pairsDict: Record<string, string> = {};
    namePairs.forEach((pair) => {
      [pairsDict[pair[1]], pairsDict[pair[0]]] = pair;
    });

    mapConfig.map.listOfGeoviewLayerConfig?.forEach((geoviewLayerConfig) => {
      if (geoviewLayerConfig.geoviewLayerName && pairsDict[geoviewLayerConfig.geoviewLayerName])
        // eslint-disable-next-line no-param-reassign
        geoviewLayerConfig.geoviewLayerName = pairsDict[geoviewLayerConfig.geoviewLayerName];
      // eslint-disable-next-line no-param-reassign
      else if (removeUnlisted) geoviewLayerConfig.geoviewLayerName = '';
      if (geoviewLayerConfig.listOfLayerEntryConfig?.length)
        this.#replaceLayerEntryConfigNames(pairsDict, geoviewLayerConfig.listOfLayerEntryConfig, removeUnlisted);
    });

    return mapConfig;
  }

  // #endregion PUBLIC METHODS - CONFIG CREATION

  // #region PUBLIC METHODS - GEOMETRY API FOR DRAWING TOOLS

  /**
   * Creates a new geometry group on the map if it doesn't already exist.
   * Geometry groups are used to organize and manage collections of vector features (lines, polygons, points).
   *
   * @param groupName - The unique name for the geometry group to create
   */
  createGeometryGroup(groupName: string): void {
    const geometryApi = this.getGeometryApi();
    if (!geometryApi.hasGeometryGroup(groupName)) {
      geometryApi.createGeometryGroup(groupName);
    }
  }

  /**
   * Deletes all geometries from a geometry group.
   * Removes all vector features (lines, polygons, points) that belong to the specified group.
   * The group itself remains and can be reused.
   *
   * @param groupName - The name of the geometry group to clear
   */
  deleteGeometriesFromGroup(groupName: string): void {
    const geometryApi = this.getGeometryApi();
    if (geometryApi.hasGeometryGroup(groupName)) {
      geometryApi.deleteGeometriesFromGroup(groupName);
    }
  }

  /**
   * Initializes drawing interactions on the given vector source.
   *
   * @param geomGroupKey - The geometry group key in which to hold the geometries
   * @param type - The type of geometry to draw (Polygon, LineString, Circle, etc)
   * @param style - The styles for the drawing
   * @returns The init draw interactions object
   */
  initDrawInteractions(geomGroupKey: string, type: OLGeomType, style: TypeFeatureStyle): Draw {
    return this.getMapViewer().initDrawInteractions(geomGroupKey, type, style);
  }

  /**
   * Sets the active measurement Draw interaction for keyboard accessibility.
   *
   * When activating, suppresses hover and click-marker handlers (like drawer does).
   * When deactivating, restores them.
   *
   * @param draw - The Draw interaction to register, or undefined to unregister
   */
  setActiveMeasurementDraw(draw: Draw | undefined): void {
    const viewer = this.getMapViewer();

    if (draw) {
      // Suppress hover and details while measuring
      viewer.unregisterMapPointerHandlers(viewer.map);
      this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.clearResults();
      setStoreMapClickMarker(this.getMapId(), undefined);
    } else if (this.#activeMeasurementDraw) {
      // Restore hover and details when stopping measurement
      viewer.registerMapPointerHandlers(viewer.map);
    }

    this.#activeMeasurementDraw = draw;
  }

  /**
   * Gets the active measurement Draw interaction.
   *
   * @returns The active measurement Draw interaction, or undefined if none
   */
  getActiveMeasurementDraw(): Draw | undefined {
    return this.#activeMeasurementDraw;
  }

  // #endregion PUBLIC METHODS - GEOMETRY API FOR DRAWING TOOLS

  // #region DOMAIN HANDLERS

  /**
   * Handles the map ready event by updating the store to reflect that the map is loaded and displayed.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map ready event
   */
  #handleMapReady(sender: MapViewer, event: MapBaseEvent): void {
    // Save to the store that the map is loaded
    // GV This removes the spinning circle overlay and starts showing the map correctly in the html dom
    setStoreMapLoaded(sender.mapId, true);

    // Save to the store that the map is properly being displayed now
    setStoreMapDisplayed(sender.mapId);

    // Update the map controls based on the original map state
    this.#updateMapControls();
  }

  /**
   * Handles the map resolution change event by updating the store with the new zoom level.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map resolution changed event containing the new zoom level
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapResolutionChanged(sender: MapViewer, event: MapResolutionChangedEvent): void {
    // Save to the store
    setStoreMapZoom(sender.mapId, event.zoom);
  }

  /**
   * Handles the map move end event by updating the store with the new map center, zoom, rotation, and extent.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map move end event containing the new view information
   */
  #handleMapMoveEnd(sender: MapViewer, event: MapBaseEvent): void {
    // Update the map controls based on the original map state
    this.#updateMapControls();
  }

  /**
   * Handles the map rotation event by updating the store with the new rotation value.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map rotation event containing the new rotation value
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapRotation(sender: MapViewer, event: MapRotationEvent): void {
    // Save to the store
    setStoreMapRotation(sender.mapId, event.rotation);
  }

  /**
   * Handles the map pointer move event by updating the store with the new pointer position.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map pointer move event containing the new pointer position
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapPointerMove(sender: MapViewer, event: MapPointerMoveEvent): void {
    // Save to the store
    setStoreMapPointerPosition(sender.mapId, event);
  }

  /**
   * Handles the map single click event by updating the store with the clicked coordinates.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map single click event containing the clicked coordinates
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapClicked(sender: MapViewer, event: MapSingleClickEvent): void {
    // Nothing?
  }

  /**
   * Handles the map mouse enter event by updating the store to indicate that the mouse is inside the map viewport.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map mouse enter event
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapMouseEnter(sender: MapViewer, event: MapBaseEvent): void {
    // Save to the store
    setStoreMapIsMouseInsideMap(sender.mapId, true);
  }

  /**
   * Handles the map mouse leave event by updating the store to indicate that the mouse is outside the map viewport.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map mouse leave event
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapMouseLeave(sender: MapViewer, event: MapBaseEvent): void {
    // Save to the store
    setStoreMapIsMouseInsideMap(sender.mapId, false);
  }

  /**
   * Handles when the map interaction mode changes by updating the store.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The interaction changed event containing the new interaction mode
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapInteractionChanged(sender: MapViewer, event: MapInteractionChangedEvent): void {
    // Save to the store
    setStoreMapInteraction(sender.mapId, event.interaction);
  }

  /**
   * Handles the pre-projection-change cleanup before the map view applies the new projection.
   *
   * Shows a loading indicator, clears stale WMS override CRS layers and vector feature data,
   * hides the overview map, removes layer highlights, and warns the user about vector tile
   * layers whose source projection cannot be reprojected on-the-fly to the new map projection.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The projection changed event containing the new and previous projections
   */
  #handleMapProjectionChangeStarted(sender: MapViewer, event: MapProjectionChangedEvent): void {
    // Show loading indicator while the projection change is being processed
    this.getControllersRegistry().uiController.setCircularProgress(true);

    // Clear the WMS layers that had an override CRS
    this.getControllersRegistry().layerController.clearWMSLayersWithOverrideCRS();

    // Clear any loaded vector features in the data table, we'll need to refetch those on the new projection
    this.getControllersRegistry().layerSetController.clearVectorFeaturesFromAllFeatureInfoLayerSet();

    // Set overview map visibility to false when reproject to remove it from the map as it is vector tile
    this.#projectionChangingOverviewMapVisibility = this.getOverviewMapVisibility();
    this.setOverviewMapVisibility(false);

    // Remove layer highlight if present to avoid bad reprojection
    const highlightName = getStoreLayerHighlightedLayer(this.getMapId());
    if (highlightName !== '') {
      this.getControllersRegistry().layerController.changeOrRemoveLayerHighlight(highlightName, highlightName);
    }

    // Show a warning about the existing vector tiles on the map
    this.getControllersRegistry()
      .layerController.getGeoviewLayers()
      .filter((layer) => layer instanceof AbstractGVVectorTile)
      .forEach((layer) => {
        // Get the data projection
        const dataProjection = layer.getDataProjection();

        // If the projection of the layer isn't the same of the map projection, it means the vector tile layer won't be reprojected, show a warning
        if (dataProjection && dataProjection.getCode() !== event.projection.getCode()) {
          // Log
          this.getMapViewer().notifications.showWarning('warning.layer.vectorTileUnsupportedProjection', {
            layerName: layer.getLayerName(),
          });
        }
      });
  }

  /**
   * Handles the post-projection-change work after the map view has applied the new projection.
   *
   * Updates the store projection, reloads the basemap, refreshes remaining layers,
   * restores the overview map, repeats the last feature query, and resolves the
   * pending projection change promise.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The projection changed event containing the new and previous projections
   */
  #handleMapProjectionChanged(sender: MapViewer, event: MapProjectionChangedEvent): void {
    // Save in the store
    setStoreMapProjection(this.getMapId(), Projection.readEPSGNumber(event.projection) as TypeValidMapProjectionCodes);

    // Reload the basemap from new projection
    this.resetBasemap()
      .then(() => {
        // Remove circular progress as basemap is reset, rest is interesting to see
        this.getControllersRegistry().uiController.setCircularProgress(false);

        // Refresh layers so new projection is render properly
        this.getControllersRegistry().layerController.refreshLayers();

        // Reset the overview map visiblity to what it was before changing the map projection
        this.setOverviewMapVisibility(this.#projectionChangingOverviewMapVisibility);

        // Repeat last query for layer features
        this.getControllersRegistry()
          .layerSetController.repeatLastQueryIfAny()
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('in repeatLastQueryIfAny in mapController.setProjection', error);
          });
      })
      .catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('in resetBasemap in mapController.handleMapProjectionChanged', error);
      })
      .finally(() => {
        // Resolve the pending projection change promise
        if (this.#projectionChangeResolve) {
          this.#projectionChangeResolve();
          this.#projectionChangeResolve = undefined;
        }
      });
  }

  /**
   * Handles the map size change event by updating the store with the new map size and scale.
   *
   * @param sender - The MapViewer instance that emitted the event
   * @param event - The map size changed event containing the new size and scale
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMapSizeChanged(sender: MapViewer, event: MapSizeChangedEvent): void {
    // Save to the store
    setStoreMapSize(sender.mapId, event.size);
    setStoreMapScale(sender.mapId, event.scale);
  }

  /**
   * Handles when a marker icon is showed on the map.
   *
   * @param sender - The map viewer that emitted the event
   * @param event - The marker icon showed event containing the projected coordinates
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  #handleMarkerIconShowed(sender: MapViewer, event: MarkerIconShowedEvent): void {
    // Save to the store
    setStoreMapClickMarker(sender.mapId, event.projectedCoords);
  }

  // #endregion DOMAIN HANDLERS

  // #region PRIVATE METHODS - CONFIG CREATION

  /**
   * Creates a geoview layer config based on current layer state.
   *
   * @param layerPath - Path of the layer to create config for
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults
   * @param includeFeatureInfo - Whether to include feature info in the config
   * @returns Geoview layer config object
   */
  #createGeoviewLayerConfig(
    layerPath: string,
    overrideGeocoreServiceNames: boolean | 'hybrid',
    includeFeatureInfo: boolean
  ): MapConfigLayerEntry | undefined {
    // Get the map id
    const mapId = this.getMapId();

    // Get needed info
    const layerEntryConfig = this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(layerPath);
    const geoviewLayerConfig = layerEntryConfig?.getGeoviewLayerConfig();

    // If not found, log warning and skip
    if (!layerEntryConfig || !geoviewLayerConfig) {
      // TODO: Check if better to use getLayerEntryConfig instead of getLayerEntryConfigIfExists above and have an error be thrown?
      // Log
      logger.logWarning(`Couldn't find the layer entry config for layer path '${layerPath}'`);
      return undefined;
    }

    // Get info
    const legendLayerInfo = getStoreLayerLegendLayerByPath(mapId, layerPath);

    // Check if the layer is a geocore layers
    const isGeocore = isValidUUID(layerPath.split('/')[0]);

    // If is a group
    let layerEntryLayerPaths: string[] = [];
    if (layerEntryConfig instanceof GroupLayerEntryConfig) {
      layerEntryLayerPaths = layerEntryConfig.getLayerPaths();
    }

    // Check for sublayers
    const sublayerPaths = getStoreLayerOrderedLayerPaths(mapId).filter(
      // We only want the immediate child layers, group sublayers will handle their own sublayers
      (entryLayerPath) => layerEntryLayerPaths.includes(entryLayerPath)
    );

    // Build list of sublayer entry configs
    const listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
    if (sublayerPaths.length && layerEntryConfig.layerId === 'base-group')
      sublayerPaths.forEach((sublayerPath) =>
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(sublayerPath, isGeocore, overrideGeocoreServiceNames, includeFeatureInfo))
      );
    else listOfLayerEntryConfig.push(this.#createLayerEntryConfig(layerPath, isGeocore, overrideGeocoreServiceNames, includeFeatureInfo));

    // Get initial settings
    const initialSettings = MapController.#getInitialSettings(mapId, layerEntryConfig, legendLayerInfo!);

    // Construct geoview layer config
    const newGeoviewLayerConfig: MapConfigLayerEntry =
      isGeocore && overrideGeocoreServiceNames !== true
        ? {
            geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
            geoviewLayerName: overrideGeocoreServiceNames === false ? undefined : layerEntryConfig.getGeoviewLayerName(),
            geoviewLayerType: 'geoCore',
            initialSettings,
            useAsBasemap: geoviewLayerConfig.useAsBasemap,
            listOfLayerEntryConfig,
          }
        : {
            geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
            geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
            geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
            initialSettings,
            isTimeAware: geoviewLayerConfig.isTimeAware,
            listOfLayerEntryConfig,
            metadataAccessPath: geoviewLayerConfig.metadataAccessPath,
            serviceDateFormat: geoviewLayerConfig.serviceDateFormat,
            serviceDateFormatIdentify: geoviewLayerConfig.serviceDateFormatIdentify,
            serviceDateTimezone: geoviewLayerConfig.serviceDateTimezone,
            serviceDateTemporalMode: geoviewLayerConfig.serviceDateTemporalMode,
            displayDateFormat: geoviewLayerConfig.displayDateFormat,
            displayDateTimezone: geoviewLayerConfig.displayDateTimezone,
            useAsBasemap: geoviewLayerConfig.useAsBasemap,
          };

    return newGeoviewLayerConfig;
  }

  /**
   * Creates a layer entry config based on current layer state.
   *
   * @param layerPath - Path of the layer to create config for
   * @param isGeocore - Indicates if it is a geocore layer
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults
   * @param includeFeatureInfo - Whether to include feature info in the config
   * @returns Entry config object
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   */
  #createLayerEntryConfig(
    layerPath: string,
    isGeocore: boolean,
    overrideGeocoreServiceNames: boolean | 'hybrid',
    includeFeatureInfo: boolean
  ): TypeLayerEntryConfig {
    // Get needed info
    const mapId = this.getMapId();

    const layerEntryConfig = this.getControllersRegistry().layerController.getLayerEntryConfig(layerPath);
    const legendLayerInfo = getStoreLayerLegendLayerByPath(mapId, layerPath);

    // Get original layerEntryConfig from map config
    const pathArray = layerPath.split('/');
    if (pathArray[0] === pathArray[1]) pathArray.splice(0, 1);
    const geoviewLayerConfig = getStoreMapConfigListOfGeoviewLayerConfig(mapId)?.find(
      (layerConfig) => layerConfig.geoviewLayerId === pathArray[0]
    );

    let configLayerEntryConfig;
    if (geoviewLayerConfig) {
      configLayerEntryConfig = (geoviewLayerConfig as TypeGeoviewLayerConfig).listOfLayerEntryConfig?.find(
        (nextEntryConfig) => nextEntryConfig.layerId === pathArray[1]
      );
      for (let i = 2; i < pathArray.length; i++) {
        if (configLayerEntryConfig?.listOfLayerEntryConfig)
          configLayerEntryConfig = configLayerEntryConfig.listOfLayerEntryConfig.find(
            (nextEntryConfig: TypeLayerEntryConfig) => nextEntryConfig.layerId === pathArray[i]
          );
        else configLayerEntryConfig = undefined;
      }
    }

    // Create list of sublayer entry configs if it is a group layer
    const listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
    if (layerEntryConfig.getEntryTypeIsGroup()) {
      const sublayerPaths = getStoreLayerOrderedLayerPaths(mapId).filter(
        (entryLayerPath) =>
          entryLayerPath.startsWith(`${layerPath}/`) && entryLayerPath.split('/').length === layerPath.split('/').length + 1
      );
      sublayerPaths.forEach((sublayerPath) =>
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(sublayerPath, isGeocore, overrideGeocoreServiceNames, includeFeatureInfo))
      );
    }

    // Get initial settings
    const initialSettings = MapController.#getInitialSettings(mapId, layerEntryConfig, legendLayerInfo!);

    // Clone the source object
    let source;
    if (layerEntryConfig instanceof AbstractBaseLayerEntryConfig) {
      source = layerEntryConfig.cloneSource();
    }

    // Remove full feature info unless requested to reduce the size of the config file
    if (!includeFeatureInfo) {
      // We want to remove everything that was not specified in the original config and replace with metadata from layers on load
      if (source?.featureInfo) delete source?.featureInfo;
      const configLayerEntryConfigFeatureInfo = AbstractBaseLayerEntryConfig.getClassOrTypeFeatureInfo(configLayerEntryConfig);
      if (source && configLayerEntryConfigFeatureInfo) source.featureInfo = configLayerEntryConfigFeatureInfo;
    }

    if (source?.dataAccessPath && isGeocore && overrideGeocoreServiceNames !== true) source.dataAccessPath = undefined;

    const layerStyle =
      legendLayerInfo!.styleConfig && (!isGeocore || overrideGeocoreServiceNames === true) ? legendLayerInfo!.styleConfig : undefined;

    const layerText = layerEntryConfig instanceof VectorLayerEntryConfig ? layerEntryConfig.getLayerText() : undefined;

    // Construct layer entry config
    const newLayerEntryConfig = {
      layerId: layerEntryConfig.layerId,
      layerName: isGeocore && overrideGeocoreServiceNames === false ? undefined : layerEntryConfig.getLayerName(),
      layerFilter: AbstractBaseLayerEntryConfig.getClassOrTypeLayerFilter(configLayerEntryConfig),
      initialSettings,
      layerStyle,
      layerText,
      entryType: listOfLayerEntryConfig.length ? 'group' : undefined,
      source: listOfLayerEntryConfig.length ? undefined : source,
      listOfLayerEntryConfig: listOfLayerEntryConfig.length ? listOfLayerEntryConfig : undefined,
    };

    return newLayerEntryConfig as unknown as TypeLayerEntryConfig;
  }

  // #endregion PRIVATE METHODS - CONFIG CREATION

  // #region PRIVATE METHODS - MAP

  /**
   * Updates the map controls (the store) based on the current map view state.
   *
   * @returns A promise that resolves when the map controls are updated
   */
  #updateMapControls(): void {
    // Get the mapViewer
    const mapViewer = this.getMapViewer();

    // Get the center coordinates
    const centerCoordinates = mapViewer.getView().getCenter();
    if (!centerCoordinates) return;

    // Get the size
    const size = mapViewer.map.getSize();
    if (!size) return;

    // Get the projection code
    const projCode = mapViewer.getProjection().getCode();

    // Get the pointer position
    const pointerPosition = {
      projected: centerCoordinates,
      pixel: mapViewer.map.getPixelFromCoordinate(centerCoordinates),
      lonlat: Projection.transformPoints([centerCoordinates], projCode, Projection.PROJECTION_NAMES.LONLAT)[0],
      dragging: false,
    };

    // Get the degree rotation
    const degreeRotation = mapViewer.getNorthArrowAngle();

    // Get the north pole visibility
    const isNorthVisible = mapViewer.getNorthPoleVisibility();

    // Get the zoom
    const zoom = mapViewer.getView().getZoom() ?? 0;

    // Get the map Extent
    const extent = mapViewer.getView().calculateExtent();

    // Get the scale information
    const scale = MapViewer.getScaleInfoFromDomElement(mapViewer.mapId);

    // Set interaction (enable/disables map controls)
    // TODO: CHECK - This line should likely happen elsewhere in the initialization of the map, not really updating a map control per-se
    mapViewer.setInteraction(getStoreMapInteraction(mapViewer.mapId));

    // Save in store
    setStoreMapSize(mapViewer.mapId, size);

    // Save to the store
    setStoreMapScale(mapViewer.mapId, scale);

    // Save to the store
    setStoreMapMoveEnd(mapViewer.mapId, centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, zoom, extent, scale);
  }

  // #endregion PRIVATE METHODS - MAP

  // #region STATIC METHODS - CONFIG CREATION

  /**
   * Creates time slider configurations based on the current time slider state.
   *
   * @param mapId - The map identifier
   * @returns An array of time slider props, or undefined if no time slider layers exist
   */
  static #createTimeSliderConfigs(mapId: string): TypeTimeSliderProps[] | undefined {
    // Get time slider info
    const timeSliderLayers = getStoreTimeSliderLayers(mapId);

    if (timeSliderLayers) {
      const timeSliderProps: TypeTimeSliderProps[] = [];
      Object.keys(timeSliderLayers).forEach((layerPath) => {
        // Get values from time slider layers
        const {
          additionalLayerpaths,
          isMainLayerPath,
          title,
          description,
          locked,
          reversed,
          values,
          delay: delayTimeSlider,
          filtering,
          range,
          discreteValues,
          displayDateFormat,
          displayDateFormatShort,
          serviceDateTemporalMode,
          displayDateTimezone,
          field,
        } = timeSliderLayers[layerPath];

        if (isMainLayerPath) {
          // Build time dimension
          const timeDimension: TimeDimension = {
            field,
            default: values.map((value) => DateMgt.formatDateISOShort(value)),
            nearestValues: discreteValues ? 'discrete' : 'continuous',
            displayDateFormat,
            displayDateFormatShort,
            serviceDateTemporalMode,
            displayDateTimezone,
            rangeItems: {
              type: '',
              range,
            },
            singleHandle: values.length === 1,
            isValid: true,
          };

          const fields = [field];
          if (additionalLayerpaths) {
            additionalLayerpaths.forEach((additionalLayerPath) => fields.push(timeSliderLayers[additionalLayerPath].field));
          }

          // Add info to prop list
          timeSliderProps.push({
            layerPaths: additionalLayerpaths ? [layerPath, ...additionalLayerpaths] : [layerPath],
            title,
            description,
            delay: delayTimeSlider,
            fields,
            filtering,
            locked,
            reversed,
            timeDimension,
          });
        }
      });

      return timeSliderProps;
    }

    return undefined;
  }

  /**
   * Creates geochart configurations based on the current geochart state.
   *
   * Note: The last click coordinate query will be rerun to populate the geochart features, but this will not work
   * for raster layers that have been zoomed/scrolled out of view, as they will be outside of the query area.
   *
   * @param mapId - The map identifier
   * @returns An array of geochart configs, or undefined if no geochart layers exist
   */
  static #createGeochartConfigs(mapId: string): GeoViewGeoChartConfig[] | undefined {
    // Get geochart info
    const geochartsConfig = getStoreGeochartChartsConfig(mapId);

    if (geochartsConfig) {
      const geochartConfigs: GeoViewGeoChartConfig[] = [];
      Object.keys(geochartsConfig).forEach((layerPath) => {
        geochartConfigs.push(geochartsConfig[layerPath]);
      });

      return geochartConfigs;
    }

    return undefined;
  }

  /**
   * Creates layer initial settings according to provided configs.
   *
   * @param mapId - The map identifier
   * @param layerEntryConfig - Layer entry config for the layer
   * @param legendLayerInfo - Legend layer info for the layer
   * @returns Initial settings object
   */
  static #getInitialSettings(mapId: string, layerEntryConfig: ConfigBaseClass, legendLayerInfo: TypeLegendLayer): TypeLayerInitialSettings {
    return {
      states: {
        visible: legendLayerInfo.visible,
        opacity: legendLayerInfo?.opacity ?? 1,
        legendCollapsed: legendLayerInfo.legendCollapsed,
        queryable: getStoreLayerQueryable(mapId, layerEntryConfig.layerPath),
        hoverable: getStoreLayerHoverable(mapId, layerEntryConfig.layerPath),
      },
      controls: layerEntryConfig.getInitialSettings()?.controls,
      bounds: layerEntryConfig.getInitialSettingsBounds(),
      extent: layerEntryConfig.getInitialSettingsExtent(),
      className: layerEntryConfig.getInitialSettingsClassName(),
      minZoom: layerEntryConfig.getInitialSettings()?.minZoom,
      maxZoom: layerEntryConfig.getInitialSettings()?.maxZoom,
    };
  }

  /**
   * Searches through a list of layer entry configs and replaces any matching layer names with their provided partner.
   *
   * @param pairsDict - The dict of name pairs. Presumably one english and one french name in each pair
   * @param listOfLayerEntryConfigs - The layer entry configs to modify
   * @param removeUnlisted - Remove any layer name that doesn't appear in namePairs
   */
  static #replaceLayerEntryConfigNames(
    pairsDict: Record<string, string>,
    listOfLayerEntryConfigs: TypeLayerEntryConfig[],
    removeUnlisted: boolean
  ): void {
    listOfLayerEntryConfigs?.forEach((layerEntryConfig) => {
      const layerName = ConfigBaseClass.getClassOrTypeLayerName(layerEntryConfig);
      // If there's a name in pairsDict that matches
      if (layerName && pairsDict[layerName]) ConfigBaseClass.setClassOrTypeLayerName(layerEntryConfig, pairsDict[layerName]);
      else if (removeUnlisted) ConfigBaseClass.setClassOrTypeLayerName(layerEntryConfig, '');
      if (layerEntryConfig.listOfLayerEntryConfig?.length)
        this.#replaceLayerEntryConfigNames(pairsDict, layerEntryConfig.listOfLayerEntryConfig, removeUnlisted);
    });
  }

  // #endregion STATIC PRIVATE METHODS - CONFIG CREATION

  // #region EVENTS

  /**
   * Emits a geolocator search event to all handlers.
   *
   * @param event - The geolocator search event payload
   */
  #emitGeolocatorSearch(event: GeolocatorSearchEvent): void {
    // Emit the geolocator search event for all handlers
    EventHelper.emitEvent(this, this.#onGeolocatorSearchHandlers, event);
  }

  /**
   * Registers a geolocator search event callback.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   * @returns The callback delegate that was registered
   */
  onGeolocatorSearch(callback: GeolocatorSearchDelegate): GeolocatorSearchDelegate {
    // Register the geolocator search event handler
    return EventHelper.onEvent(this.#onGeolocatorSearchHandlers, callback);
  }

  /**
   * Unregisters a geolocator search event callback.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offGeolocatorSearch(callback: GeolocatorSearchDelegate): void {
    // Unregister the geolocator search event handler
    EventHelper.offEvent(this.#onGeolocatorSearchHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Event for the geolocator search delegate.
 */
export interface GeolocatorSearchEvent {
  /** The search description string. */
  searchItem: string;
  /** The lon/lat coordinates of the selected result. */
  coords: Coordinate;
  /** Optional bounding box extent of the selected result. */
  bbox?: Extent;
}

/**
 * Delegate for the geolocator search event handler function signature.
 */
export type GeolocatorSearchDelegate = EventDelegateBase<MapController, GeolocatorSearchEvent, void>;
