import type { Root } from 'react-dom/client';
import type { Pixel } from 'ol/pixel';
import type { Size } from 'ol/size';
import type { Coordinate } from 'ol/coordinate';
import type { OverviewMap as OLOverviewMap } from 'ol/control';

import {
  MAP_EXTENTS,
  MAX_EXTENTS_RESTRICTION,
  type Extent,
  type TypeAltitudeResponse,
  type TypeBasemapOptions,
  type TypeFeatureInfoEntry,
  type TypeMapConfig,
  type TypeMapFeaturesInstance,
  type TypeMapMouseInfo,
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
  getStoreMapConfigSchemaVersionUsed,
  getStoreMapConfigServiceUrls,
  getStoreMapConfigViewSettings,
  getStoreMapCurrentBasemapOptions,
  getStoreMapCurrentProjection,
  getStoreMapCurrentProjectionEPSG,
  getStoreMapHighlightedFeatures,
  getStoreMapHighlightedFeaturesByUid,
  getStoreMapHomeView,
  getStoreMapInitialView,
  getStoreMapInteraction,
  getStoreMapLayerPaths,
  getStoreMapOrderedLayerInfoByPath,
  getStoreMapPointMarkers,
  getStoreMapRotation,
  isStoreMapConfigInitialized,
  setStoreMapClickCoordinates,
  setStoreMapClickMarker,
  setStoreMapCurrentBasemapOptions,
  setStoreMapGeolocatorSearchArea,
  setStoreMapHighlightedFeatures,
  setStoreMapPointMarkers,
  setStoreMapProjection,
  setStoreMapSize,
  type TypeOrderedLayerInfo,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { getStoreDataTableSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { getStoreUIActiveAppBarTab, getStoreUIActiveFooterBarTab } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { getStoreAppDisplayTheme, getStoreAppIsCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  getStoreLayerHighlightedLayer,
  getStoreLayerLegendLayerByPath,
  getStoreLayerSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  getStoreTimeSliderLayers,
  getStoreTimeSliderSelectedLayerPath,
  isStoreTimeSliderInitialized,
  type TypeTimeSliderProps,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import {
  updateStoreCoordinateInfoLayer,
  getStoreDetailsCoordinateInfoEnabled,
  setStoreDetailsCoordinateInfoEnabled,
  deleteStoreDetailsFeatureInfo,
  LAYER_PATH_COORDINATE_INFO,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { DEFAULT_OL_FITOPTIONS, OL_ZOOM_DURATION, OL_ZOOM_PADDING, TIMEOUT } from '@/core/utils/constant';
import { DateMgt, type TimeDimension } from '@/core/utils/date-mgt';
import { delay, doTimeout, isValidUUID } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core/utils/logger';
import type { MapViewer } from '@/geo/map/map-viewer';
import { Projection } from '@/geo/utils/projection';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { Draw } from '@/geo/interaction/draw';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { FitOptions } from 'ol/View';
import { GeoUtilities } from '@/geo/utils/utilities';
import { InvalidExtentError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';

/**
 * Controller responsible for Map interactions.
 */
export class MapController extends AbstractMapViewerController {
  /** The minimal delay in ms to wait after a zoom animation to ensure it has completed. */
  static readonly ZOOM_MIN_DELAY = 500;

  /** The feature highlight instance associated with this controller */
  #featureHighlight: FeatureHighlight;

  /**
   * Creates an instance of MapController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param featureHighlight - The feature highlight instance to associate with this controller
   */
  constructor(mapViewer: MapViewer, featureHighlight: FeatureHighlight) {
    super(mapViewer);
    this.#featureHighlight = featureHighlight;
  }

  // #region OVERRIDES

  // #endregion OVERRIDES

  // #region PUBLIC METHODS - ZOOM FUNCTIONS

  /**
   * Zooms to the specified extent.
   *
   * @param extent - The extent to zoom to
   * @param options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 })
   * @returns A promise that resolves when the zoom animation is complete
   * @throws {InvalidExtentError} When the extent is invalid
   */
  zoomToExtent(extent: Extent, options: FitOptions = DEFAULT_OL_FITOPTIONS): Promise<void> {
    // Merge user options with defaults
    const mergedOptions: FitOptions = { ...DEFAULT_OL_FITOPTIONS, ...options };

    // Validate the extent coordinates - need to make sure we aren't excluding zero with !number or using invalid extents
    const validatedExtent = GeoUtilities.validateExtent(extent, getStoreMapCurrentProjectionEPSG(this.getMapId()));
    if (
      !extent.some((number) => {
        return (!number && number !== 0) || Number.isNaN(number);
      }) &&
      JSON.stringify(extent) === JSON.stringify(validatedExtent)
    ) {
      // Store state will be updated by map event
      this.getMapViewer().getView().fit(extent, mergedOptions);

      // Wait a bit and return.
      return delay(mergedOptions.duration! + MapController.ZOOM_MIN_DELAY);
    }

    // Invalid extent
    this.getMapViewer().notifications.showError('error.map.invalidZoomExtent', [], true);
    throw new InvalidExtentError(extent);
  }

  /**
   * Returns to initial view state of map using config.
   *
   * @returns A promise that resolves when the zoom animation is complete
   */
  async zoomToInitialExtent(): Promise<void> {
    // Get the map id
    const mapId = this.getMapId();

    const currProjection = getStoreMapCurrentProjection(mapId);
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
            Projection.getProjectionFromString(`EPSG:${currProjection}`)
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
        Projection.getProjectionFromString(`EPSG:${currProjection}`)
      );

    return this.zoomToExtent(extent, options);
  }

  /**
   * Zooms to geolocation position provided.
   *
   * @param position - Info on position to zoom to
   * @returns A promise that resolves when the zoom animation is complete
   */
  zoomToMyLocation(position: GeolocationPosition): Promise<void> {
    const coord: Coordinate = [position.coords.longitude, position.coords.latitude];
    const projectedCoords = Projection.transformPoints(
      [coord],
      Projection.PROJECTION_NAMES.LONLAT,
      getStoreMapCurrentProjectionEPSG(this.getMapId())
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
   * @param duration - Optional animation duration in ms
   * @returns A promise that resolves when the zoom animation is complete
   */
  zoomMap(zoom: number, duration: number = OL_ZOOM_DURATION): Promise<void> {
    // Do the actual zoom
    this.getMapViewer().map.getView().animate({ zoom, duration });

    // Use a Promise and resolve it when the duration expired
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration + MapController.ZOOM_MIN_DELAY);
    });
    // GV No need to Save to the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  /**
   * Animates the map zoom without awaiting the result.
   *
   * Fires and forgets the zoom, logging any errors.
   *
   * @param zoom - The target zoom level
   * @param duration - Optional animation duration in ms
   */
  zoomMapAndForget(zoom: number, duration: number = OL_ZOOM_DURATION): void {
    // Redirect
    this.zoomMap(zoom, duration).catch((error: unknown) => {
      logger.logError('Map-State Failed to zoom map', error);
    });
  }

  /**
   * Zooms to a geolocator search result location.
   *
   * Highlights the bounding box if available, zooms to the extent, and shows the click marker.
   *
   * @param searchItem - The search item description
   * @param coords - The lon/lat coordinates to zoom to
   * @param bbox - Optional bounding box extent for the search result
   * @returns A promise that resolves when the zoom is complete
   */
  async zoomToGeoLocatorLocation(searchItem: string, coords: Coordinate, bbox?: Extent): Promise<void> {
    // Get the map id
    const mapId = this.getMapId();

    // Save to the store
    setStoreMapGeolocatorSearchArea(mapId, searchItem, coords, bbox);

    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box');
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }

    const projectionConfig = Projection.PROJECTIONS[getStoreMapCurrentProjection(mapId)];
    if (bbox) {
      // GV There were issues with fromLonLat in rare cases in LCC projections, transformExtentFromProj seems to solve them.
      // GV fromLonLat and transformExtentFromProj give differing results in many cases, fromLonLat had issues with the first
      // GV three results from a geolocator search for "vancouver river"
      const convertedExtent = Projection.transformExtentFromProj(bbox, Projection.getProjectionLonLat(), projectionConfig);

      // Highlight
      this.#featureHighlight.highlightGeolocatorBBox(convertedExtent);

      // Zoom to extent and await
      await this.zoomToExtent(convertedExtent, {
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
        getStoreMapCurrentProjectionEPSG(mapId)
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
      this.#featureHighlight.highlightFeature(feature);

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
    this.#featureHighlight.highlightGeolocatorBBox(extent, isLayerHighlight);
  }

  /**
   * Removes the highlighted bounding box from the map.
   */
  removeBBoxHighlight(): void {
    // Remove the highlight bbox
    this.#featureHighlight.removeBBoxHighlight();
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
        this.#featureHighlight.removeHighlight(feature);
      } else {
        this.#featureHighlight.removeHighlight(feature.uid!);

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
    this.#featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
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
    this.#featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  // #endregion PUBLIC METHODS - HIGHLIGHT FEATURES

  // #region PUBLIC METHODS - PROJECTION SWITCH

  /**
   * Changes the map projection.
   *
   * Reprojects the view, reloads basemaps, refreshes layers, removes incompatible vector tile layers,
   * and repeats the last feature query. Shows a circular progress indicator during the transition.
   *
   * @param projectionCode - The target projection code
   * @returns A promise that resolves when the projection change is complete
   */
  async setProjection(projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    try {
      // Set circular progress to hide basemap switching
      this.getControllersRegistry().uiController.setCircularProgress(true);

      // get view status (center and projection) to calculate new center
      const currentView = this.getMapViewer().map.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjection, Projection.PROJECTION_NAMES.LONLAT)[0] as [
        number,
        number,
      ];
      const newProjection = projectionCode;

      // If maxExtent was provided and in the native projection, apply
      // GV The extent is different between LCC and WM and switching from one to the other may introduce weird constraint.
      // GV We may have to keep extent as array for configuration file but, technically, user does not change projection often.
      // GV A wider LCC extent like [-125, 30, -60, 89] (minus -125) will introduce distortion on larger screen...
      // GV It is why we apply the max extent only on native projection, otherwise we apply default
      const viewSettings = getStoreMapConfigViewSettings(this.getMapId());
      const mapMaxExtent =
        viewSettings && viewSettings.maxExtent && Number(newProjection) === Number(viewSettings.projection)
          ? viewSettings?.maxExtent
          : MAX_EXTENTS_RESTRICTION[newProjection];

      // create new view settings
      const newView: TypeViewSettings = {
        initialView: { zoomAndCenter: [currentView.getZoom() as number, centerLatLng] },
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: mapMaxExtent,
        projection: newProjection,
      };

      // use store action to set projection value in store and apply new view to the map
      setStoreMapProjection(this.getMapId(), projectionCode);

      // Clear the WMS layers that had an override CRS
      this.getControllersRegistry().layerController.clearWMSLayersWithOverrideCRS();

      // Clear any loaded vector features in the data table
      this.getControllersRegistry().layerSetController.clearVectorFeaturesFromAllFeatureInfoLayerSet();

      // Before changing the view, clear the basemaps right away to prevent a moment where a
      // vector tile basemap might, momentarily, be in different projection than the view.
      // Note: It seems that since OpenLayers 10.5 OpenLayers throws an exception about this. So this line was added.
      this.getMapViewer().basemap.clearBasemaps();

      // Set overview map visibility to false when reproject to remove it from the map as it is vector tile
      this.setOverviewMapVisibility(false);

      // Remove all vector tiles from the map, because they don't allow on-the-fly reprojection (OpenLayers 10.5 exception issue)
      // GV Experimental code, to test further... not problematic to keep it for now
      this.getControllersRegistry()
        .layerController.getGeoviewLayers()
        .filter((layer) => layer instanceof AbstractGVVectorTile)
        .forEach((layer) => {
          // Remove the layer through the controller
          this.getControllersRegistry().layerCreatorController.removeLayerUsingPath(layer.getLayerPath());

          // Log
          this.getMapViewer().notifications.showWarning('warning.layer.vectorTileRemoved', [layer.getLayerName()], true);
        });

      // set new view
      this.getMapViewer().setView(newView);

      // reload the basemap from new projection
      await this.resetBasemap();

      // refresh layers so new projection is render properly
      this.getControllersRegistry().layerController.refreshLayers();

      // Remove layer highlight if present to avoid bad reprojection
      const highlightName = getStoreLayerHighlightedLayer(this.getMapId());
      if (highlightName !== '') {
        this.getControllersRegistry().layerController.changeOrRemoveLayerHighlight(highlightName, highlightName);
      }

      // Reset the map object of overview map control
      this.setOverviewMapVisibility(true);

      // Repeat last query for layer features after a delay to allow projection change to propagate
      this.getMapViewer()
        .controllers.layerSetController.repeatLastQueryIfAny()
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('in repeatLastQueryIfAny in mapController.setProjection', error);
        });
    } finally {
      // Remove circular progress as refresh is done
      this.getControllersRegistry().uiController.setCircularProgress(false);
    }
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
   * @returns The pixel position on the map viewport
   */
  getPixelFromCoordinate(coord: Coordinate): Pixel {
    return this.getMapViewer().map.getPixelFromCoordinate(coord);
  }

  /**
   * Sets the click coordinates in the store and emits a single click event in WCAG mode.
   *
   * @param clickCoordinates - The click coordinate information
   */
  setClickCoordinates(clickCoordinates: TypeMapMouseInfo, abortSignal?: AbortSignal): void {
    // GV: We do not need to perform query, there is a handler on the map click in layer set.
    // Save in store
    setStoreMapClickCoordinates(this.getMapId(), clickCoordinates);

    // If the coordinate info is enabled
    if (getStoreDetailsCoordinateInfoEnabled(this.getMapId())) {
      // Update the coordinate info with the new click coordinates
      this.updateStoreCoordinateInfo(clickCoordinates, getStoreMapConfigServiceUrls(this.getMapId()), abortSignal).catch(
        (error: unknown) => {
          // Log
          logger.logPromiseFailed('in updateStoreCoordinateInfo in mapController.setClickCoordinates', error);
        }
      );
    }

    // If in WCAG mode, we need to emit the event
    if (getStoreAppIsCrosshairsActive(this.getMapId())) this.getMapViewer().emitMapSingleClick(clickCoordinates);
  }

  /**
   * Shows the click marker icon at the given marker position.
   *
   * Projects the marker's lon/lat coordinates to the current map projection before placing it.
   *
   * @param marker - The click marker containing lon/lat coordinates
   */
  clickMarkerIconShow(marker: TypeClickMarker): void {
    // Project coords
    const projectedCoords = Projection.transformPoints(
      [marker.lonlat],
      Projection.PROJECTION_NAMES.LONLAT,
      getStoreMapCurrentProjectionEPSG(this.getMapId())
    );

    // Set it on the MapViewer
    this.getMapViewer().map.getOverlayById(`${this.getMapId()}-clickmarker`)!.setPosition(projectedCoords[0]);

    // Save in store
    setStoreMapClickMarker(this.getMapId(), projectedCoords[0]);
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
   * Sets the map size in the store and optionally resizes the OpenLayers map.
   *
   * @param size - The new map size
   * @param resizeMap - Optional flag to also resize the OpenLayers map element
   */
  setMapSize(size: Size, resizeMap: boolean = false): void {
    if (resizeMap) this.getMapViewer().map.setSize(size);

    // Save in store
    setStoreMapSize(this.getMapId(), size);
  }

  /**
   * Rotates the map to the specified angle.
   *
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param rotation - The target rotation angle in radians
   * @param animate - Whether to animate the rotation change, defaults to true
   */
  rotate(rotation: number, animate: boolean = true): void {
    // Do the actual view map rotation
    const view = this.getMapViewer().map.getView();

    if (animate) {
      view.animate({ rotation });
      return;
    }

    // Cancel any in-flight animations so slider drags stay in sync with the displayed value.
    view.cancelAnimations();
    view.setRotation(rotation);
    // GV No need to Save to the store, because this will trigger an event on MapViewer which will take care of updating the store
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
      deleteStoreDetailsFeatureInfo(this.getMapId(), LAYER_PATH_COORDINATE_INFO);
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
          extent: undefined,
          geometry: undefined,
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
   * Sets the visibility of the overview map control.
   *
   * @param visible - Whether the overview map should be visible
   */
  setOverviewMapVisibility(visible: boolean): void {
    const olMap = this.getMapViewer().map;
    this.getMapViewer().basemap.setOverviewMapControlVisibility(olMap, visible);
  }

  /**
   * Resets the basemap using the current display language and projection.
   *
   * @returns A promise that resolves when the basemap has been reloaded
   */
  resetBasemap(): Promise<void> {
    // reset basemap will use the current display language and projection and recreate the basemap
    const language = this.getMapViewer().getDisplayLanguage();
    const projection = getStoreMapCurrentProjection(this.getMapId());
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
    const projection = getStoreMapCurrentProjection(this.getMapId());

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
   * @returns The type map features instance
   */
  createMapConfigFromMapState(overrideGeocoreServiceNames: boolean | 'hybrid' = true): TypeMapFeaturesInstance | undefined {
    // Get the map id
    const mapId = this.getMapId();

    // Get the map viewer
    const mapViewer = this.getMapViewer();

    if (isStoreMapConfigInitialized(mapId)) {
      // Get paths of top level layers
      const layerOrder = getStoreMapLayerPaths(mapId).filter(
        (layerPath) => !this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(layerPath)?.getParentLayerConfig()
      );

      // Build list of geoview layer configs
      const listOfGeoviewLayerConfig = layerOrder
        .map((layerPath) => this.#createGeoviewLayerConfig(layerPath, overrideGeocoreServiceNames))
        .filter((mapLayerEntry) => !!mapLayerEntry);

      // Get info for view
      const projection = getStoreMapCurrentProjection(mapId);
      const currentView = mapViewer.map.getView();
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
        rotation: getStoreMapRotation(mapId),
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: storeViewSettings?.maxExtent,
        projection,
      };

      // Set map config settings
      const map: TypeMapConfig = {
        basemapOptions: getStoreMapCurrentBasemapOptions(mapId),
        interaction: getStoreMapInteraction(mapId),
        listOfGeoviewLayerConfig,
        highlightColor: getStoreMapConfigHighlightColor(mapId),
        overlayObjects: { pointMarkers: getStoreMapPointMarkers(mapId) },
        viewSettings,
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

      // Construct map config
      const newMapConfig: TypeMapFeaturesInstance = {
        map,
        theme: getStoreAppDisplayTheme(mapId),
        navBar: getStoreMapConfigNavBar(mapId),
        footerBar: getStoreMapConfigFooterBar(mapId),
        appBar: getStoreMapConfigAppBar(mapId),
        overviewMap: getStoreMapConfigOverviewMap(mapId),
        components: getStoreMapConfigComponents(mapId),
        corePackages: getStoreMapConfigCorePackages(mapId),
        corePackagesConfig,
        externalPackages: getStoreMapConfigExternalPackages(mapId),
        serviceUrls: getStoreMapConfigServiceUrls(mapId),
        schemaVersionUsed: getStoreMapConfigSchemaVersionUsed(mapId),
        globalSettings: getStoreMapConfigGlobalSettings(mapId),
      };

      // Set app bar tab settings
      if (newMapConfig.appBar) {
        newMapConfig.appBar.selectedTab = getStoreUIActiveAppBarTab(mapId).tabId as TypeValidAppBarCoreProps;

        const selectedDataTableLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        if (selectedDataTableLayerPath) newMapConfig.appBar.selectedDataTableLayerPath = selectedDataTableLayerPath;
        const selectedLayerPath = getStoreLayerSelectedLayerPath(mapId);
        if (selectedLayerPath) newMapConfig.appBar.selectedLayersLayerPath = selectedLayerPath;
      }

      // Set footer bar tab settings
      if (newMapConfig.footerBar) {
        newMapConfig.footerBar.selectedTab = getStoreUIActiveFooterBarTab(mapId).tabId as TypeValidFooterBarTabsCoreProps;

        const selectedDataTableLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        if (selectedDataTableLayerPath) newMapConfig.footerBar.selectedDataTableLayerPath = selectedDataTableLayerPath;
        const selectedLayerLayerPath = getStoreLayerSelectedLayerPath(mapId);
        if (selectedLayerLayerPath) newMapConfig.footerBar.selectedLayersLayerPath = selectedLayerLayerPath;

        // If the TimeSlider plugin is initialized
        if (isStoreTimeSliderInitialized(mapId)) {
          // Store it
          newMapConfig.footerBar.selectedTimeSliderLayerPath = getStoreTimeSliderSelectedLayerPath(mapId);
        }
      }

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
    removeUnlisted: boolean = false
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
    removeUnlisted: boolean = false
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
  initDrawInteractions(geomGroupKey: string, type: string, style: TypeFeatureStyle): Draw {
    return this.getMapViewer().initDrawInteractions(geomGroupKey, type, style);
  }

  // #endregion PUBLIC METHODS - GEOMETRY API FOR DRAWING TOOLS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  // #endregion DOMAIN HANDLERS

  // #region PRIVATE METHODS - CONFIG CREATION

  /**
   * Creates a geoview layer config based on current layer state.
   *
   * @param layerPath - Path of the layer to create config for
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults
   * @returns Geoview layer config object
   */
  #createGeoviewLayerConfig(layerPath: string, overrideGeocoreServiceNames: boolean | 'hybrid'): MapConfigLayerEntry | undefined {
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
    const orderedLayerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath)!; // Should always find one, so use a '!', otherwise let it break (was like this before)
    const legendLayerInfo = getStoreLayerLegendLayerByPath(mapId, layerPath);

    // Check if the layer is a geocore layers
    const isGeocore = isValidUUID(layerPath.split('/')[0]);

    // If is a group
    let layerEntryLayerPaths: string[] = [];
    if (layerEntryConfig instanceof GroupLayerEntryConfig) {
      layerEntryLayerPaths = layerEntryConfig.getLayerPaths();
    }

    // Check for sublayers
    const sublayerPaths = getStoreMapLayerPaths(mapId).filter(
      // We only want the immediate child layers, group sublayers will handle their own sublayers
      (entryLayerPath) => layerEntryLayerPaths.includes(entryLayerPath)
    );

    // Build list of sublayer entry configs
    const listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
    if (sublayerPaths.length && layerEntryConfig.layerId === 'base-group')
      sublayerPaths.forEach((sublayerPath) =>
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(sublayerPath, isGeocore, overrideGeocoreServiceNames))
      );
    else listOfLayerEntryConfig.push(this.#createLayerEntryConfig(layerPath, isGeocore, overrideGeocoreServiceNames));

    // Get initial settings
    const initialSettings = MapController.#getInitialSettings(layerEntryConfig, orderedLayerInfo, legendLayerInfo!);

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
   * @returns Entry config object
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path
   */
  #createLayerEntryConfig(layerPath: string, isGeocore: boolean, overrideGeocoreServiceNames: boolean | 'hybrid'): TypeLayerEntryConfig {
    // Get needed info
    const mapId = this.getMapId();

    const layerEntryConfig = this.getControllersRegistry().layerController.getLayerEntryConfig(layerPath);
    const orderedLayerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath)!; // Should always find one, so use a '!', otherwise let it break (was like this before)
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
      const sublayerPaths = getStoreMapLayerPaths(mapId).filter(
        (entryLayerPath) =>
          entryLayerPath.startsWith(`${layerPath}/`) && entryLayerPath.split('/').length === layerPath.split('/').length + 1
      );
      sublayerPaths.forEach((sublayerPath) =>
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(sublayerPath, isGeocore, overrideGeocoreServiceNames))
      );
    }

    // Get initial settings
    const initialSettings = MapController.#getInitialSettings(layerEntryConfig, orderedLayerInfo, legendLayerInfo!);

    // Clone the source object
    let source;
    if (layerEntryConfig instanceof AbstractBaseLayerEntryConfig) {
      source = layerEntryConfig.cloneSource();
    }

    // Only use feature info specified in original config, not drawn from services
    if (source?.featureInfo) delete source?.featureInfo;
    const configLayerEntryConfigFeatureInfo = AbstractBaseLayerEntryConfig.getClassOrTypeFeatureInfo(configLayerEntryConfig);
    if (source && configLayerEntryConfigFeatureInfo) source.featureInfo = configLayerEntryConfigFeatureInfo;

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
   * Creates layer initial settings according to provided configs.
   *
   * @param layerEntryConfig - Layer entry config for the layer
   * @param orderedLayerInfo - Ordered layer info for the layer
   * @param legendLayerInfo - Legend layer info for the layer
   * @returns Initial settings object
   */
  static #getInitialSettings(
    layerEntryConfig: ConfigBaseClass,
    orderedLayerInfo: TypeOrderedLayerInfo,
    legendLayerInfo: TypeLegendLayer
  ): TypeLayerInitialSettings {
    return {
      states: {
        visible: orderedLayerInfo.visible,
        opacity: legendLayerInfo.opacity,
        legendCollapsed: orderedLayerInfo.legendCollapsed,
        queryable: orderedLayerInfo.queryableState,
        hoverable: orderedLayerInfo.hoverable,
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
}
