import type { Root } from 'react-dom/client';
import type { Pixel } from 'ol/pixel';
import type { Size } from 'ol/size';
import type { Coordinate } from 'ol/coordinate';
import type { OverviewMap as OLOverviewMap } from 'ol/control';

import {
  MAP_EXTENTS,
  MAX_EXTENTS_RESTRICTION,
  type Extent,
  type TypeBasemapOptions,
  type TypeFeatureInfoEntry,
  type TypeMapConfig,
  type TypeMapFeaturesInstance,
  type TypeMapMouseInfo,
  type TypePointMarker,
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
import { LayerCreatorController } from '@/core/controllers/layer-creator-controller';
import { useControllers } from '@/core/controllers/base/controller-manager';
import {
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
  getStoreMapOrderedLayerIndexByPath,
  getStoreMapOrderedLayerInfo,
  getStoreMapOrderedLayerInfoByPath,
  getStoreMapPointMarkers,
  getStoreMapRotation,
  getStoreMapVisibilityByPath,
  isStoreMapConfigInitialized,
  setStoreLayerInVisibleRange,
  setStoreMapClickCoordinates,
  setStoreMapClickMarker,
  setStoreMapCurrentBasemapOptions,
  setStoreMapGeolocatorSearchArea,
  setStoreMapHighlightedFeatures,
  setStoreMapLayerVisibility,
  setStoreMapOrderedLayerDirectly,
  setStoreMapPointMarkers,
  setStoreMapProjection,
  setStoreMapSize,
  utilFindMapLayerAndChildrenFromOrderedInfo,
  type TypeOrderedLayerInfo,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { getStoreDataTableSelectedLayerPath, getStoreTableFilter } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { getStoreActiveAppBarTab, getStoreActiveFooterBarTab } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  getStoreDisplayTheme,
  getStoreIsCrosshairsActive,
  getStoreShowLayerHighlightLayerBbox,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  getStoreLayerStateHighlightedLayer,
  getStoreLayerStateLayerBounds,
  getStoreLayerStateLegendLayerByPath,
  getStoreLayerStateSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  getStoreTimeSliderFilter,
  getStoreTimeSliderLayers,
  getStoreTimeSliderSelectedLayer,
  isStoreTimeSliderInitialized,
  type TypeTimeSliderProps,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { DEFAULT_OL_FITOPTIONS, OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { DateMgt, type TimeDimension } from '@/core/utils/date-mgt';
import { delay, isValidUUID } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { MapViewer } from '@/geo/map/map-viewer';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { Projection } from '@/geo/utils/projection';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import type { Draw } from '@/geo/interaction/draw';
import type { TypeClickMarker } from '@/core/components/click-marker/click-marker';
import type { FitOptions } from 'ol/View';
import { GeoUtilities } from '@/geo/utils/utilities';
import { InvalidExtentError, NoBoundsError } from '@/core/exceptions/geoview-exceptions';
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
   * Zoom to the specified extent.
   *
   * @param extent - The extent to zoom to.
   * @param options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 }).
   * @returns A promise that resolves when the zoom animation is complete.
   * @throws {InvalidExtentError} When the extent is invalid.
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
   * Return to initial view state of map using config.
   *
   * @returns A promise that resolves when the zoom animation is complete.
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
   * Zoom to geolocation position provided.
   *
   * @param position - Info on position to zoom to.
   * @returns A promise that resolves when the zoom animation is complete.
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
   * Zoom to layer visible scale.
   *
   * @param layerPath - Path of layer to zoom to.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  zoomToLayerVisibleScale(layerPath: string): void {
    const view = this.getMapViewer().getView();
    const mapZoom = view.getZoom();
    const geoviewLayer = this.getControllersRegistry().layerController.getGeoviewLayer(layerPath);
    const layerMaxZoom = geoviewLayer.getMaxZoom();
    const layerMinZoom = geoviewLayer.getMinZoom();

    // Set the right zoom (Infinity will act as a no change in zoom level)
    let layerZoom = Infinity;
    if (layerMinZoom !== -Infinity && layerMinZoom >= mapZoom!) layerZoom = layerMinZoom + 0.25;
    else if (layerMaxZoom !== Infinity && layerMaxZoom <= mapZoom!) layerZoom = layerMaxZoom - 0.25;

    // Change view to go to proper zoom centered in the middle of layer extent
    // If there is no layerExtent or if the zoom needs to zoom out, the center will be undefined and not use
    // Check if the map center is already in the layer extent and if so, do not center
    geoviewLayer
      .getBounds(this.getMapViewer().getProjection(), MapViewer.DEFAULT_STOPS)
      .then((layerExtent) => {
        const centerExtent =
          layerExtent && layerMinZoom > mapZoom! && !GeoUtilities.isPointInExtent(view.getCenter()!, layerExtent)
            ? [(layerExtent[2] + layerExtent[0]) / 2, (layerExtent[1] + layerExtent[3]) / 2]
            : undefined;

        view.animate({
          center: centerExtent,
          zoom: layerZoom,
          duration: OL_ZOOM_DURATION,
        });
      })
      .catch((error: unknown) => {
        // Log error
        logger.logPromiseFailed('in getBounds in mapController.zoomToLayerVisibleScale', error);
      });
  }

  /**
   * Zoom to extents of a layer.
   *
   * @param layerPath - The path of the layer to zoom to.
   * @throws {NoBoundsError} When the layer doesn't have bounds.
   */
  zoomToLayerExtent(layerPath: string, fitOptions?: FitOptions): Promise<void> {
    // Define some zoom options
    const options: FitOptions = fitOptions ?? { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };

    // Get the layer bounds
    const bounds = getStoreLayerStateLayerBounds(this.getMapId(), layerPath);

    // If found
    if (bounds) {
      return this.zoomToExtent(bounds, options);
    }

    // Failed
    throw new NoBoundsError(layerPath);
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
   * Removes all highlighted features for a specific layer.
   *
   * @param layerPath - The layer path to remove highlights from
   */
  removeLayerHighlights(layerPath: string): void {
    // Redirect to layer api
    this.getControllersRegistry().layerController.removeLayerHighlights(layerPath);
  }

  /**
   * Update or remove the layer highlight.
   *
   * @param layerPath - The layer path to set as the highlighted layer.
   * @param highlightedLayerPath - The layer path of the currently highlighted layer.
   * @returns The layer path of the highlighted layer.
   */
  changeOrRemoveLayerHighlight(layerPath: string, highlightedLayerPath: string): string {
    // If layer is currently highlighted layer, remove highlight
    if (highlightedLayerPath === layerPath) {
      this.getControllersRegistry().layerController.setHighlightLayer('');
      this.getControllersRegistry().layerController.removeHighlightLayer();
      return '';
    }

    // If the layer path is set to nothing, done
    if (!layerPath) return '';

    // Redirect to layer to highlight
    this.getControllersRegistry().layerController.highlightLayer(layerPath);

    // Get bounds and highlight a bounding box for the layer (if true in global settings)
    const bounds = getStoreLayerStateLayerBounds(this.getMapId(), layerPath);
    if (bounds && getStoreShowLayerHighlightLayerBbox(this.getMapId())) this.highlightBBox(bounds, true);

    return layerPath;
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
      const highlightName = getStoreLayerStateHighlightedLayer(this.getMapId());
      if (highlightName !== '') {
        this.changeOrRemoveLayerHighlight(highlightName, highlightName);
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
  setClickCoordinates(clickCoordinates: TypeMapMouseInfo): void {
    // GV: We do not need to perform query, there is a handler on the map click in layer set.
    // Save in store
    setStoreMapClickCoordinates(this.getMapId(), clickCoordinates);

    // If in WCAG mode, we need to emit the event
    if (getStoreIsCrosshairsActive(this.getMapId())) this.getMapViewer().emitMapSingleClick(clickCoordinates);
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
   * Reorders a layer by moving it up or down in the layer stack.
   *
   * @param layerPath - The layer path to reorder
   * @param move - The number of positions to move (positive = up, negative = down)
   */
  reorderLayer(layerPath: string, move: number): void {
    // Redirect to state API
    this.getMapViewer().stateApi.reorderLayers(layerPath, move);
  }

  /**
   * Apply all available filters to layer.
   *
   * @param layerPath - The path of the layer to apply filters to.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  applyLayerFilters(layerPath: string): void {
    // Get the Geoview layer
    const geoviewLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(layerPath);

    // If found it
    if (geoviewLayer) {
      // Read filter information from the UI
      const layerFilters = this.getActiveFilters(layerPath);

      // Apply the view filter on the layer
      geoviewLayer.setLayerFilters(layerFilters, true);
    }
  }

  /**
   * Get all active filters for layer.
   *
   * @param layerPath - The path for the layer to get filters from.
   * @returns The active layer filters
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  // TODO: REFACTOR - This function, if we don't actually delete it, should basically only return the
  // TO.DOCONT: layer.getLayerFilter() from the domain, never go in the store.
  // TO.DOCONT: The store synchronization should happen via a event hook. Event that is raised by the
  // TO.DOCONT: layer when the layer filters attributes themselves are set.
  // TO.DOCONT: This is related to the other TODO to improve the layer filterings. Search id: ce707359
  getActiveFilters(layerPath: string): LayerFilters {
    // Get the layer and layer config
    const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);
    const layerConfig = layer.getLayerConfig();

    // The initial filter
    const initialFilter = layerConfig.getLayerFilter();

    // The class breaks filter if any
    const classFilter = layer.getFilterFromStyle();

    // The data table filter if any
    const dataFilter = getStoreTableFilter(this.getMapId(), layerPath);

    // If the TimeSlider is initialized
    let timeFilter: string | undefined;
    if (isStoreTimeSliderInitialized(this.getMapId())) {
      // Assign it for the return
      timeFilter = getStoreTimeSliderFilter(this.getMapId(), layerPath);
    }

    // Return the current filters in the application
    return new LayerFilters(initialFilter, classFilter, dataFilter, timeFilter);
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
   * Animates the map rotation to the specified angle.
   *
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param rotation - The target rotation angle in radians
   */
  rotate(rotation: number): void {
    // Do the actual view map rotation
    this.getMapViewer().map.getView().animate({ rotation });
    // GV No need to Save to the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  // #endregion PUBLIC METHODS - OTHERS

  // #region PUBLIC METHODS - LAYERS

  /**
   * Sets or toggles the visibility of a specific layer within a map.
   * If the layer exists at the provided layer path for the given map, the method delegates
   * the visibility change to the map viewer's layer API. If `newValue` is provided, the layer
   * visibility is explicitly set to that value; otherwise, the visibility is toggled.
   *
   * @param layerPath - The path of the layer whose visibility is being changed.
   * @param newValue - Optional. The new visibility value. If omitted, the visibility is toggled.
   * @returns The resulting visibility state of the layer after the operation, or `false`
   * if the layer does not exist at the given path.
   */
  setOrToggleMapLayerVisibility(layerPath: string, newValue?: boolean): boolean {
    // If the GV layer exists at the layer path
    if (this.getControllersRegistry().layerController.getGeoviewLayerIfExists(layerPath)) {
      // Redirect to set or toggle the layer visibility and return the resulting visibility
      return this.setOrToggleLayerVisibility(layerPath, newValue);
    }
    return false;
  }

  /**
   * Sets or toggles the visibility of a layer within the current map.
   *
   * Retrieves the current visibility of the layer, determines the resulting visibility
   * based on the optional `newValue`, and applies the change only if the visibility
   * actually differs. If `newValue` is provided, the visibility is set explicitly;
   * if omitted, the method toggles the current visibility.
   *
   * @param layerPath - The path of the layer whose visibility is being updated.
   * @param newValue - Optional. The new visibility value to apply. If omitted, the current visibility is toggled.
   * @returns The resulting visibility state of the layer after the update
   * @throws {LayerNotFoundError} When the layer cannot be found at the given path.
   */
  setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean {
    // Get current visibility based on the store
    // TODO: CHECK - Should likely check the current visibility by using the layer (domain) instead of the store
    const layerVisibility = getStoreMapVisibilityByPath(this.getMapId(), layerPath);

    // Determine the outcome of the new visibility based on parameters
    const newVisibility = newValue !== undefined ? newValue : !layerVisibility;

    if (layerVisibility !== newVisibility) {
      // Redirect to set or toggle the layer visibility and return the resulting visibility
      this.getControllersRegistry().layerController.getGeoviewLayer(layerPath).setVisible(newVisibility);
    }

    return newVisibility;
  }

  /**
   * Sets the visibility of all geoview layers on the map.
   *
   * @param newValue - The new visibility.
   */
  setAllLayersVisibility(newValue: boolean): void {
    this.getControllersRegistry()
      .layerController.getLayerEntryLayerPaths()
      .forEach((layerPath) => {
        // If the layer path has a corresponding Geoview layer (it's possible that there's a layer entry config without necessarily a GV layer)
        if (this.getControllersRegistry().layerController.getGeoviewLayerIfExists(layerPath)) {
          // There is a geoview layer at this layer path
          this.setOrToggleLayerVisibility(layerPath, newValue);
        }
      });
  }

  /**
   * Sets the visibility of the Geoview basemap layer.
   *
   * @param newVisibility - The visibility state to apply to the basemap layer (`true` to show, `false` to hide).
   */
  setVisibilityOfGeoviewBasemapLayers(newVisibility: boolean): void {
    this.getControllersRegistry()
      .layerController.getGeoviewLayers()
      .forEach((layer) => {
        if (layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap === true && layer.getVisible() !== newVisibility) {
          this.setOrToggleLayerVisibility(layer.getLayerPath(), newVisibility);
        }
      });
  }

  /**
   * Sets the visibility of **all layers** in a given map.
   *
   * Iterates through all GeoView layers associated with the specified map ID and
   * applies the provided visibility value. Only layers whose current visibility
   * differs from the desired state will be updated.
   *
   * @param newVisibility - The visibility state to apply to all layers (`true` to show, `false` to hide).
   */
  setAllMapLayerVisibility(newVisibility: boolean): void {
    // Set the visibility for all layers
    this.getControllersRegistry()
      .layerController.getGeoviewLayers()
      .forEach((layer) => {
        if (layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap !== true && layer.getVisible() !== newVisibility) {
          this.setOrToggleLayerVisibility(layer.getLayerPath(), newVisibility);
        }
      });
  }

  /**
   * Sets the visibility of a layer in the store ordered layer info.
   *
   * @param layerPath - The layer path of the layer to change
   * @param visibility - The visibility to set
   */
  setMapLayerVisibility(layerPath: string, visibility: boolean): void {
    // Save to the store
    setStoreMapLayerVisibility(this.getMapId(), layerPath, visibility);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Updates the visible range state for a layer in the ordered layer info.
   *
   * @param layerPath - The layer path to update
   * @param inVisibleRange - Whether the layer is in visible zoom range
   */
  setLayerInVisibleRange(layerPath: string, inVisibleRange: boolean): void {
    // Save to the store
    setStoreLayerInVisibleRange(this.getMapId(), layerPath, inVisibleRange);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Replaces a layer in the orderedLayerInfo array.
   *
   * @param layerConfig - The config of the layer to add.
   * @param layerPathToReplace - The layerPath of the info to replace.
   */
  replaceOrderedLayerInfo(layerConfig: ConfigBaseClass, layerPathToReplace?: string): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(this.getMapId());
    const layerPath = layerConfig.getGeoviewLayerId() ? `${layerConfig.getGeoviewLayerId()}/base-group` : layerConfig.layerPath;
    const pathToSearch = layerPathToReplace || layerPath;
    const index = getStoreMapOrderedLayerIndexByPath(this.getMapId(), pathToSearch);
    const replacedLayers = utilFindMapLayerAndChildrenFromOrderedInfo(pathToSearch, orderedLayerInfo);

    const newOrderedLayerInfo = LayerCreatorController.generateArrayOfLayerOrderInfo(layerConfig);
    orderedLayerInfo.splice(index, replacedLayers.length, ...newOrderedLayerInfo);

    // Save in the store
    setStoreMapOrderedLayerDirectly(this.getMapId(), orderedLayerInfo);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Adds a new layer to the orderedLayerInfo array using a layer config.
   *
   * @param geoviewLayerConfig - The config of the layer to add.
   */
  addOrderedLayerInfoByConfig(geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig, index?: number): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(this.getMapId());

    const newOrderedLayerInfo = LayerCreatorController.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    if (!index) orderedLayerInfo.unshift(...newOrderedLayerInfo);
    else orderedLayerInfo.splice(index, 0, ...newOrderedLayerInfo);

    // Save in the store
    setStoreMapOrderedLayerDirectly(this.getMapId(), orderedLayerInfo);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Adds new layer info to the orderedLayerInfo array.
   *
   * @param layerInfo - The ordered layer info to add.
   */
  addOrderedLayerInfo(layerInfo: TypeOrderedLayerInfo, index?: number): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(this.getMapId());
    if (!index) orderedLayerInfo.unshift(layerInfo);
    else orderedLayerInfo.splice(index, 0, layerInfo);

    // Save in store
    setStoreMapOrderedLayerDirectly(this.getMapId(), orderedLayerInfo);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Removes a layer from the orderedLayerInfo array.
   *
   * @param layerPath - The path of the layer to remove.
   * @param removeSublayers - Should sublayers be removed.
   */
  removeOrderedLayerInfo(layerPath: string, removeSublayers: boolean = true): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(this.getMapId());
    const newOrderedLayerInfo = removeSublayers
      ? orderedLayerInfo.filter((layerInfo) => !layerInfo.layerPath.startsWith(`${layerPath}/`) && !(layerInfo.layerPath === layerPath))
      : orderedLayerInfo.filter((layerInfo) => !(layerInfo.layerPath === layerPath));

    // Save in store
    setStoreMapOrderedLayerDirectly(this.getMapId(), newOrderedLayerInfo);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Updates the ordered layer info in the store and recalculates layer Z indices.
   *
   * @param orderedLayerInfo - The new ordered layer info array
   * @deprecated This function shouldn't exist as it breaks the separation of concern between the controller and the store implementation.
   */
  setMapOrderedLayerInfoDirectly(orderedLayerInfo: TypeOrderedLayerInfo[]): void {
    // Save in store
    setStoreMapOrderedLayerDirectly(this.getMapId(), orderedLayerInfo);

    // Update the z indices
    this.setLayerZIndices();
  }

  /**
   * Set Z index for layers
   */
  setLayerZIndices(): void {
    const reversedLayers = [...getStoreMapOrderedLayerInfo(this.getMapId())].reverse();
    reversedLayers.forEach((orderedLayerInfo, index) => {
      const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerIfExists(orderedLayerInfo.layerPath);
      gvLayer?.setZIndex(index + 10);
    });
  }

  // #endregion PUBLIC METHODS - LAYERS

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
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
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
        theme: getStoreDisplayTheme(mapId),
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
        newMapConfig.appBar.selectedTab = getStoreActiveAppBarTab(mapId).tabId as TypeValidAppBarCoreProps;

        const selectedDataTableLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        if (selectedDataTableLayerPath) newMapConfig.appBar.selectedDataTableLayerPath = selectedDataTableLayerPath;
        const selectedLayerPath = getStoreLayerStateSelectedLayerPath(mapId);
        if (selectedLayerPath) newMapConfig.appBar.selectedLayersLayerPath = selectedLayerPath;
      }

      // Set footer bar tab settings
      if (newMapConfig.footerBar) {
        newMapConfig.footerBar.selectedTab = getStoreActiveFooterBarTab(mapId).tabId as TypeValidFooterBarTabsCoreProps;

        const selectedDataTableLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        if (selectedDataTableLayerPath) newMapConfig.footerBar.selectedDataTableLayerPath = selectedDataTableLayerPath;
        const selectedLayerLayerPath = getStoreLayerStateSelectedLayerPath(mapId);
        if (selectedLayerLayerPath) newMapConfig.footerBar.selectedLayersLayerPath = selectedLayerLayerPath;

        // If the TimeSlider plugin is initialized
        if (isStoreTimeSliderInitialized(mapId)) {
          // Store it
          newMapConfig.footerBar.selectedTimeSliderLayerPath = getStoreTimeSliderSelectedLayer(mapId);
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
   * @param namePairs - The array of name pairs. Presumably one english and one french name in each pair.
   * @param mapConfig - The config to modify.
   * @param removeUnlisted - Remove any layer name that doesn't appear in namePairs.
   * @returns Map config with updated names.
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
   * @param layerPath - Path of the layer to create config for.
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   * @returns Geoview layer config object.
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
    const legendLayerInfo = getStoreLayerStateLegendLayerByPath(mapId, layerPath);

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
   * @param layerPath - Path of the layer to create config for.
   * @param isGeocore - Indicates if it is a geocore layer.
   * @param overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   * @returns Entry config object.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  #createLayerEntryConfig(layerPath: string, isGeocore: boolean, overrideGeocoreServiceNames: boolean | 'hybrid'): TypeLayerEntryConfig {
    // Get needed info
    const mapId = this.getMapId();

    const layerEntryConfig = this.getControllersRegistry().layerController.getLayerEntryConfig(layerPath);
    const orderedLayerInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath)!; // Should always find one, so use a '!', otherwise let it break (was like this before)
    const legendLayerInfo = getStoreLayerStateLegendLayerByPath(mapId, layerPath);

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
   * @param layerEntryConfig - Layer entry config for the layer.
   * @param orderedLayerInfo - Ordered layer info for the layer.
   * @param legendLayerInfo - Legend layer info for the layer.
   * @returns Initial settings object.
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
   * @param pairsDict - The dict of name pairs. Presumably one english and one french name in each pair.
   * @param listOfLayerEntryConfigs - The layer entry configs to modify.
   * @param removeUnlisted - Remove any layer name that doesn't appear in namePairs.
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

/**
 * Hook to access the MapController from the controller context.
 *
 * @returns The map controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useMapController(): MapController {
  return useControllers().mapController;
}
