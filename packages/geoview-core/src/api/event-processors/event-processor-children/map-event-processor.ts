import type { Root } from 'react-dom/client';
import i18next from 'i18next';
import type { AnySchema } from 'ajv';
import Ajv from 'ajv';
import type { OverviewMap as OLOverviewMap } from 'ol/control';
import type { Extent } from 'ol/extent';
import type { FitOptions } from 'ol/View';
import { KeyboardPan, KeyboardZoom } from 'ol/interaction';
import type { Coordinate } from 'ol/coordinate';
import type { Size } from 'ol/size';
import type { Pixel } from 'ol/pixel';

import type {
  TypeBasemapOptions,
  TypeValidAppBarCoreProps,
  TypeValidFooterBarTabsCoreProps,
  TypeValidMapProjectionCodes,
  TypeViewSettings,
  TypePointMarker,
  TypeFeatureInfoEntry,
  TypeMapConfig,
  TypeMapFeaturesInstance,
  TypeMapMouseInfo,
} from '@/api/types/map-schema-types';
import { MAP_EXTENTS, MAX_EXTENTS_RESTRICTION } from '@/api/types/map-schema-types';
import type {
  MapConfigLayerEntry,
  TypeLayerInitialSettings,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { Draw } from '@/geo/interaction/draw';

import { LayerApi, type GeoViewLayerAddedResult } from '@/geo/layer/layer';
import { MapViewer } from '@/geo/map/map-viewer';
import { Plugin } from '@/api/plugin/plugin';
import type { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { Projection } from '@/geo/utils/projection';
import { GeoUtilities } from '@/geo/utils/utilities';
import { DEFAULT_OL_FITOPTIONS, OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { delay, isValidUUID } from '@/core/utils/utilities';
import type { TimeDimension } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';

import type { TypeClickMarker } from '@/core/components';
import type { TypeLegendLayer } from '@/core/components/layers/types';
import type { TypeFeatureStyle } from '@/geo/layer/geometry/geometry-types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import {
  type TypeOrderedLayerInfo,
  getStoreMapCurrentBasemapOptions,
  getStoreMapPointMarkers,
  getStoreMapHomeView,
  getStoreMapRotation,
  getStoreMapInitialView,
  getStoreMapOrderedLayerInfo,
  getStoreMapInteraction,
  getStoreMapCurrentProjectionEPSG,
  getStoreMapCurrentProjection,
  getStoreMapHighlightedFeatures,
  getStoreMapOrderedLayerInfoByPath,
  getStoreMapLayerPaths,
  getStoreMapHighlightedFeaturesByUid,
  getStoreMapConfigViewSettings,
  getStoreMapConfigHighlightColor,
  getStoreMapConfigCorePackagesConfig,
  getStoreMapConfigNavBar,
  getStoreMapConfigFooterBar,
  getStoreMapConfigAppBar,
  getStoreMapConfigOverviewMap,
  getStoreMapConfigComponents,
  getStoreMapConfigCorePackages,
  getStoreMapConfigExternalPackages,
  getStoreMapConfigServiceUrls,
  getStoreMapConfigGlobalSettings,
  getStoreMapConfigSchemaVersionUsed,
  getStoreMapConfigListOfGeoviewLayerConfig,
  setStoreMapClickCoordinates,
  setStoreMapClickMarker,
  setStoreMapPointMarkers,
  setStoreMapGeolocatorSearchArea,
  setStoreMapCurrentBasemapOptions,
  setStoreMapProjection,
  setStoreMapHighlightedFeatures,
  setStoreMapSize,
  utilFindMapLayerAndChildrenFromOrderedInfo,
  isStoreMapConfigInitialized,
  getStoreMapOrderedLayerIndexByPath,
  setStoreMapOrderedLayerInfoDirectly,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  getStoreIsCrosshairsActive,
  getStoreDisplayTheme,
  getStoreShowLayerHighlightLayerBbox,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';

import { InvalidExtentError, NoBoundsError, PluginError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import {
  getStoreTimeSliderFilter,
  getStoreTimeSliderLayers,
  getStoreTimeSliderSelectedLayer,
  isStoreTimeSliderInitialized,
  type TypeTimeSliderProps,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { Fetch } from '@/core/utils/fetch-helper';
import { formatError } from '@/core/exceptions/core-exceptions';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { getStoreActiveAppBarTab, getStoreActiveFooterBarTab } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { getStoreDataTableSelectedLayerPath, getStoreTableFilter } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import {
  getStoreLayerStateHighlightedLayer,
  getStoreLayerStateLayerBounds,
  getStoreLayerStateLegendLayerByPath,
  getStoreLayerStateSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';

export abstract class MapEventProcessor extends AbstractEventProcessor {
  /** The minimal delay in ms to wait after a zoom animation to ensure it has completed. */
  static readonly ZOOM_MIN_DELAY = 500;

  // #region STATIC METHODS

  /**
   * Forces the map to re-render all layers and features.
   * Useful when layer styles or features have been updated programmatically and need to be reflected visually.
   * @param {string} mapId - The map identifier
   */
  static forceMapToRender(mapId: string): void {
    this.getMapViewer(mapId).map.render();
  }

  /**
   * Retrieves a plugin instance registered for a given map viewer, if it exists.
   * @param {string} mapId - The identifier of the map viewer.
   * @param {string} pluginId - The identifier of the plugin to retrieve.
   * @returns {Promise<AbstractPlugin | undefined>} A promise that resolves to the plugin instance if found, or `undefined` otherwise.
   */
  static async getMapViewerPluginIfExists(mapId: string, pluginId: string): Promise<AbstractPlugin | undefined> {
    // Get the plugins
    const plugins = await this.getMapViewerPlugins(mapId);

    // If plugin exists
    if (plugins[pluginId]) {
      // Return it
      return plugins[pluginId];
    }

    // Not found
    return undefined;
  }

  /**
   * Shows the click marker icon at the given marker position.
   *
   * Projects the marker's lon/lat coordinates to the current map projection before placing it.
   *
   * @param mapId - The map identifier
   * @param marker - The click marker containing lon/lat coordinates
   */
  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    // Project coords
    const projectedCoords = Projection.transformPoints(
      [marker.lonlat],
      Projection.PROJECTION_NAMES.LONLAT,
      getStoreMapCurrentProjectionEPSG(mapId)
    );

    // Redirect to processor
    this.setClickMarkerOnPosition(mapId, projectedCoords[0]);

    // Save in store
    setStoreMapClickMarker(mapId, projectedCoords[0]);
  }

  /**
   * Highlights a bounding box on the map.
   *
   * @param mapId - The map identifier
   * @param extent - The extent to highlight
   * @param isLayerHighlight - Optional flag indicating if this is a layer-level highlight
   */
  static highlightBBox(mapId: string, extent: Extent, isLayerHighlight?: boolean): void {
    // Perform a highlight
    this.getMapViewerLayerAPI(mapId).featureHighlight.highlightGeolocatorBBox(extent, isLayerHighlight);
  }

  /**
   * Sets the click coordinates in the store and emits a single click event in WCAG mode.
   *
   * @param mapId - The map identifier
   * @param clickCoordinates - The click coordinate information
   */
  static setClickCoordinates(mapId: string, clickCoordinates: TypeMapMouseInfo): void {
    // GV: We do not need to perform query, there is a handler on the map click in layer set.
    // Save in store
    setStoreMapClickCoordinates(mapId, clickCoordinates);

    // If in WCAG mode, we need to emit the event
    if (getStoreIsCrosshairsActive(mapId)) this.getMapViewer(mapId).emitMapSingleClick(clickCoordinates);
  }

  /**
   * Updates the visible range state for a layer in the ordered layer info.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path to update
   * @param inVisibleRange - Whether the layer is in visible zoom range
   */
  static setLayerInVisibleRange(mapId: string, layerPath: string, inVisibleRange: boolean): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
    const orderedInfo = getStoreMapOrderedLayerInfoByPath(mapId, layerPath);

    if (orderedInfo && orderedInfo.inVisibleRange !== inVisibleRange) {
      orderedInfo.inVisibleRange = inVisibleRange;

      this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
    }
  }

  /**
   * Sets the map size in the store and optionally resizes the OpenLayers map.
   *
   * @param mapId - The map identifier
   * @param size - The new map size
   * @param resizeMap - Optional flag to also resize the OpenLayers map element
   */
  static setMapSize(mapId: string, size: Size, resizeMap: boolean = false): void {
    if (resizeMap) this.getMapViewer(mapId).map.setSize(size);

    // Save in store
    setStoreMapSize(mapId, size);
  }

  /**
   * Changes the map projection.
   *
   * Reprojects the view, reloads basemaps, refreshes layers, removes incompatible vector tile layers,
   * and repeats the last feature query. Shows a circular progress indicator during the transition.
   *
   * @param mapId - The map identifier
   * @param projectionCode - The target projection code
   * @returns A promise that resolves when the projection change is complete
   */
  static async setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    try {
      // Set circular progress to hide basemap switching
      this.getMapViewer(mapId).controllers.uiController.setCircularProgress(true);

      // get view status (center and projection) to calculate new center
      const currentView = this.getMapViewer(mapId).map.getView();
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
      const viewSettings = getStoreMapConfigViewSettings(mapId);
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
      setStoreMapProjection(mapId, projectionCode);

      // Clear the WMS layers that had an override CRS
      this.getMapViewer(mapId).controllers.layerController.clearWMSLayersWithOverrideCRS();

      // Clear any loaded vector features in the data table
      this.getMapViewer(mapId).controllers.layerSetController.clearVectorFeaturesFromAllFeatureInfoLayerSet();

      // Before changing the view, clear the basemaps right away to prevent a moment where a
      // vector tile basemap might, momentarily, be in different projection than the view.
      // Note: It seems that since OpenLayers 10.5 OpenLayers throws an exception about this. So this line was added.
      this.getMapViewer(mapId).basemap.clearBasemaps();

      // Set overview map visibility to false when reproject to remove it from the map as it is vector tile
      this.setOverviewMapVisibility(mapId, false);

      // Remove all vector tiles from the map, because they don't allow on-the-fly reprojection (OpenLayers 10.5 exception issue)
      // GV Experimental code, to test further... not problematic to keep it for now
      this.getMapViewerLayerAPI(mapId)
        .getGeoviewLayers()
        .filter((layer) => layer instanceof AbstractGVVectorTile)
        .forEach((layer) => {
          // Remove the layer
          this.getMapViewerLayerAPI(mapId).removeLayerUsingPath(layer.getLayerPath());

          // Log
          this.getMapViewer(mapId).notifications.showWarning('warning.layer.vectorTileRemoved', [layer.getLayerName()], true);
        });

      // set new view
      this.getMapViewer(mapId).setView(newView);

      // reload the basemap from new projection
      await this.resetBasemap(mapId);

      // refresh layers so new projection is render properly
      this.getMapViewerLayerAPI(mapId).refreshLayers();

      // Remove layer highlight if present to avoid bad reprojection
      const highlightName = getStoreLayerStateHighlightedLayer(mapId);
      if (highlightName !== '') {
        this.changeOrRemoveLayerHighlight(mapId, highlightName, highlightName);
      }

      // Reset the map object of overview map control
      this.setOverviewMapVisibility(mapId, true);

      // Repeat last query for layer features after a delay to allow projection change to propagate
      this.getMapViewer(mapId)
        .controllers.layerSetController.repeatLastQueryIfAny()
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('in repeatLastQueryIfAny in MapEventProcessor.setProjection', error);
        });
    } finally {
      // Remove circular progress as refresh is done
      this.getMapViewer(mapId).controllers.uiController.setCircularProgress(false);
    }
  }

  /**
   * Changes the map projection without awaiting the result.
   *
   * Fires and forgets the projection change, logging any errors.
   *
   * @param mapId - The map identifier
   * @param projectionCode - The target projection code
   */
  static setProjectionAndForget(mapId: string, projectionCode: TypeValidMapProjectionCodes): void {
    // Redirect
    this.setProjection(mapId, projectionCode).catch((error: unknown) => {
      logger.logError('Map-State Failed to set projection', error);
    });
  }

  /**
   * Animates the map rotation to the specified angle.
   *
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param mapId - The map identifier
   * @param rotation - The target rotation angle in radians
   */
  static rotate(mapId: string, rotation: number): void {
    // Do the actual view map rotation
    this.getMapViewer(mapId).map.getView().animate({ rotation });
    // GV No need to Save to the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  /**
   * Animates the map to the specified zoom level.
   *
   * The store is updated automatically via the MapViewer move-end event.
   *
   * @param mapId - The map identifier
   * @param zoom - The target zoom level
   * @param duration - Optional animation duration in ms
   * @returns A promise that resolves when the zoom animation is complete
   */
  static zoomMap(mapId: string, zoom: number, duration: number = OL_ZOOM_DURATION): Promise<void> {
    // Do the actual zoom
    this.getMapViewer(mapId).map.getView().animate({ zoom, duration });

    // Use a Promise and resolve it when the duration expired
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration + this.ZOOM_MIN_DELAY);
    });
    // GV No need to Save to the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  /**
   * Animates the map zoom without awaiting the result.
   *
   * Fires and forgets the zoom, logging any errors.
   *
   * @param mapId - The map identifier
   * @param zoom - The target zoom level
   * @param duration - Optional animation duration in ms
   */
  static zoomMapAndForget(mapId: string, zoom: number, duration: number = OL_ZOOM_DURATION): void {
    // Redirect
    this.zoomMap(mapId, zoom, duration).catch((error: unknown) => {
      logger.logError('Map-State Failed to zoom map', error);
    });
  }

  /**
   * Adds a feature to the highlighted features list and visually highlights it on the map.
   *
   * WMS features are excluded since they cannot be individually highlighted.
   *
   * @param mapId - The map identifier
   * @param feature - The feature to highlight
   */
  static addHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry): void {
    if (feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
      this.getMapViewerLayerAPI(mapId).featureHighlight.highlightFeature(feature);

      // Save in store
      // TODO: CHECK - What is this doing? Just refreshing the highlighted features with the same list?
      setStoreMapHighlightedFeatures(mapId, [...getStoreMapHighlightedFeatures(mapId), feature]);
    }
  }

  /**
   * Removes a highlighted feature, or all highlighted features, from the map.
   *
   * WMS features are excluded since they cannot be individually highlighted.
   *
   * @param mapId - The map identifier
   * @param feature - The feature to remove, or 'all' to remove all highlights
   */
  static removeHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry | 'all'): void {
    if (feature === 'all' || feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
      // Filter what we want to keep as highlighted features
      let highlightedFeatures: TypeFeatureInfoEntry[] = [];
      if (feature === 'all') {
        this.getMapViewerLayerAPI(mapId).featureHighlight.removeHighlight(feature);
      } else {
        this.getMapViewerLayerAPI(mapId).featureHighlight.removeHighlight(feature.uid!);

        // Get highlighted features from the store
        // TODO: CHECK - Why are we getting the features to resave them right after? Just to trigger a store update?
        highlightedFeatures = getStoreMapHighlightedFeaturesByUid(mapId, feature.uid);
      }

      // Save in store
      setStoreMapHighlightedFeatures(mapId, highlightedFeatures);
    }
  }

  /**
   * Removes all highlighted features for a specific layer.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path to remove highlights from
   */
  static removeLayerHighlights(mapId: string, layerPath: string): void {
    // Redirect to layer api
    this.getMapViewer(mapId).controllers.layerController.removeLayerHighlights(layerPath);
  }

  /**
   * Adds a layer to the map. This methods redirects to the method on the layer api.
   * @param {string} mapId - The map id.
   * @param geoviewLayerConfig - The geoview layer configuration to add.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns The result of the addition of the geoview layer.
   * @throws {LayerCreatedTwiceError} When there already is a layer on the map with the provided geoviewLayerId.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  static addGeoviewLayer(mapId: string, geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult {
    // Redirect to layer api
    return this.getMapViewerLayerAPI(mapId).addGeoviewLayer(geoviewLayerConfig, abortSignal);
  }

  /**
   * Adds point markers to a group, replacing existing markers with matching IDs or coordinates.
   *
   * @param mapId - The ID of the map
   * @param group - The group to add the markers to
   * @param pointMarkers - The point markers to add
   */
  static addPointMarkers(mapId: string, group: string, pointMarkers: TypePointMarker[]): void {
    const curMarkers = getStoreMapPointMarkers(mapId);

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
    setStoreMapPointMarkers(mapId, curMarkers);
    this.getMapViewerLayerAPI(mapId).featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  /**
   * Removes point markers from a group, or removes the entire group.
   *
   * @param mapId - The ID of the map
   * @param group - The group to remove the markers from
   * @param idsOrCoordinates - Optional IDs or coordinates of the markers to remove; if omitted, the entire group is removed
   */
  static removePointMarkersOrGroup(mapId: string, group: string, idsOrCoordinates?: string[] | Coordinate[]): void {
    const curMarkers = getStoreMapPointMarkers(mapId);

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
    setStoreMapPointMarkers(mapId, curMarkers);
    this.getMapViewerLayerAPI(mapId).featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  /**
   * Update or remove the layer highlight.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path to set as the highlighted layer.
   * @param {string} highlightedLayerPath - The layer path of the currently highlighted layer.
   * @returns {string} The layer path of the highlighted layer.
   */
  static changeOrRemoveLayerHighlight(mapId: string, layerPath: string, highlightedLayerPath: string): string {
    // Get the map viewer
    const mapViewer = this.getMapViewer(mapId);

    // If layer is currently highlighted layer, remove highlight
    if (highlightedLayerPath === layerPath) {
      mapViewer.controllers.layerController.setHighlightLayer('');
      mapViewer.controllers.layerController.removeHighlightLayer();
      return '';
    }

    // If the layer path is set to nothing, done
    if (!layerPath) return '';

    // Redirect to layer to highlight
    mapViewer.controllers.layerController.highlightLayer(layerPath);

    // Get bounds and highlight a bounding box for the layer (if true in global settings)
    const bounds = getStoreLayerStateLayerBounds(mapId, layerPath);
    if (bounds && getStoreShowLayerHighlightLayerBbox(mapId)) this.highlightBBox(mapId, bounds, true);

    return layerPath;
  }

  /**
   * Updates the ordered layer info in the store and recalculates layer Z indices.
   *
   * @param mapId - The map identifier
   * @param orderedLayerInfo - The new ordered layer info array
   */
  static setMapOrderedLayerInfo(mapId: string, orderedLayerInfo: TypeOrderedLayerInfo[]): void {
    // Save in store
    setStoreMapOrderedLayerInfoDirectly(mapId, orderedLayerInfo);

    this.setLayerZIndices(mapId);
  }

  /**
   * Sets or toggles the visibility of a specific layer within a map.
   * If the layer exists at the provided layer path for the given map, the method delegates
   * the visibility change to the map viewer's layer API. If `newValue` is provided, the layer
   * visibility is explicitly set to that value; otherwise, the visibility is toggled.
   * @param {string} mapId - The identifier of the map containing the target layer.
   * @param {string} layerPath - The path of the layer whose visibility is being changed.
   * @param {boolean} [newValue] - Optional. The new visibility value. If omitted, the visibility is toggled.
   * @returns {boolean} The resulting visibility state of the layer after the operation, or `false`
   * if the layer does not exist at the given path.
   */
  static setOrToggleMapLayerVisibility(mapId: string, layerPath: string, newValue?: boolean): boolean {
    // If the GV layer exists at the layer path
    if (this.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(layerPath)) {
      // Redirect to layerAPI
      return this.getMapViewerLayerAPI(mapId).setOrToggleLayerVisibility(layerPath, newValue);
    }
    return false;
  }

  /**
   * Sets the visibility of a layer in the store ordered layer info.
   *
   * @param mapId - The ID of the map
   * @param layerPath - The layer path of the layer to change
   * @param visibility - The visibility to set
   */
  static setMapLayerVisibility(mapId: string, layerPath: string, visibility: boolean): void {
    const curOrderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);

    // Get and update ordered layer info
    const layerInfo = curOrderedLayerInfo.find((orderedLayerInfo) => orderedLayerInfo.layerPath === layerPath);
    if (layerInfo && layerInfo.visible !== visibility) {
      layerInfo.visible = visibility;

      // Update the store
      this.setMapOrderedLayerInfo(mapId, curOrderedLayerInfo);
    }
  }

  /**
   * Sets the visibility of **all layers** in a given map.
   * Iterates through all GeoView layers associated with the specified map ID and
   * applies the provided visibility value. Only layers whose current visibility
   * differs from the desired state will be updated.
   * @param {string} mapId - The identifier of the map whose layers will be updated.
   * @param {boolean} newVisibility - The visibility state to apply to all layers (`true` to show, `false` to hide).
   */
  static setAllMapLayerVisibility(mapId: string, newVisibility: boolean): void {
    // Set the visibility for all layers
    const layerApi = this.getMapViewerLayerAPI(mapId);
    layerApi.getGeoviewLayers().forEach((layer) => {
      if (layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap !== true && layer.getVisible() !== newVisibility) {
        layerApi.setOrToggleLayerVisibility(layer.getLayerPath(), newVisibility);
      }
    });
  }

  /**
   * Sets the visibility of the Geoview basemap layer.
   * @param {string} mapId - The identifier of the map whose basemap layer will be updated.
   * @param {boolean} newVisibility - The visibility state to apply to the basemap layer (`true` to show, `false` to hide).
   */
  static setVisibilityOfGeoviewBasemapLayers(mapId: string, newVisibility: boolean): void {
    const layerApi = this.getMapViewerLayerAPI(mapId);
    layerApi.getGeoviewLayers().forEach((layer) => {
      if (layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap === true && layer.getVisible() !== newVisibility) {
        layerApi.setOrToggleLayerVisibility(layer.getLayerPath(), newVisibility);
      }
    });
  }

  /**
   * Reorders a layer by moving it up or down in the layer stack.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path to reorder
   * @param move - The number of positions to move (positive = up, negative = down)
   */
  static reorderLayer(mapId: string, layerPath: string, move: number): void {
    // Redirect to state API
    this.getMapViewer(mapId).stateApi.reorderLayers(mapId, layerPath, move);
  }

  /**
   * Replaces a layer in the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {ConfigBaseClass} layerConfig The config of the layer to add.
   * @param {string} layerPathToReplace The layerPath of the info to replace.
   */
  static replaceOrderedLayerInfo(mapId: string, layerConfig: ConfigBaseClass, layerPathToReplace?: string): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
    const layerPath = layerConfig.getGeoviewLayerId() ? `${layerConfig.getGeoviewLayerId()}/base-group` : layerConfig.layerPath;
    const pathToSearch = layerPathToReplace || layerPath;
    const index = getStoreMapOrderedLayerIndexByPath(mapId, pathToSearch);
    const replacedLayers = utilFindMapLayerAndChildrenFromOrderedInfo(pathToSearch, orderedLayerInfo);
    const newOrderedLayerInfo = LayerApi.generateArrayOfLayerOrderInfo(layerConfig);
    orderedLayerInfo.splice(index, replacedLayers.length, ...newOrderedLayerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Adds a new layer to the orderedLayerInfo array using a layer config.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config of the layer to add.
   */
  static addOrderedLayerInfoByConfig(
    mapId: string,
    geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig,
    index?: number
  ): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
    const newOrderedLayerInfo = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    if (!index) orderedLayerInfo.unshift(...newOrderedLayerInfo);
    else orderedLayerInfo.splice(index, 0, ...newOrderedLayerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Adds new layer info to the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {TypeOrderedLayerInfo} layerInfo The ordered layer info to add.
   */
  static addOrderedLayerInfo(mapId: string, layerInfo: TypeOrderedLayerInfo, index?: number): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
    if (!index) orderedLayerInfo.unshift(layerInfo);
    else orderedLayerInfo.splice(index, 0, layerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Removes a layer from the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to remove the layer from.
   * @param {string} layerPath - The path of the layer to remove.
   * @param {boolean} removeSublayers - Should sublayers be removed.
   */
  static removeOrderedLayerInfo(mapId: string, layerPath: string, removeSublayers: boolean = true): void {
    const orderedLayerInfo = getStoreMapOrderedLayerInfo(mapId);
    const newOrderedLayerInfo = removeSublayers
      ? orderedLayerInfo.filter((layerInfo) => !layerInfo.layerPath.startsWith(`${layerPath}/`) && !(layerInfo.layerPath === layerPath))
      : orderedLayerInfo.filter((layerInfo) => !(layerInfo.layerPath === layerPath));

    // Redirect
    this.setMapOrderedLayerInfo(mapId, newOrderedLayerInfo);
  }

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  /**
   * Gets the OpenLayers overview map control for the given map.
   *
   * @param mapId - The map identifier
   * @param div - The HTML div element to host the overview map
   * @returns The OpenLayers OverviewMap control
   */
  static getOverviewMapControl(mapId: string, div: HTMLDivElement): OLOverviewMap {
    const olMap = this.getMapViewer(mapId).map;
    return this.getMapViewer(mapId).basemap.getOverviewMapControl(olMap, div);
  }

  /**
   * Sets the visibility of the overview map control.
   *
   * @param mapId - The map identifier
   * @param visible - Whether the overview map should be visible
   */
  static setOverviewMapVisibility(mapId: string, visible: boolean): void {
    const olMap = this.getMapViewer(mapId).map;
    this.getMapViewer(mapId).basemap.setOverviewMapControlVisibility(olMap, visible);
  }

  /**
   * Resets the basemap using the current display language and projection.
   *
   * @param mapId - The map identifier
   * @returns A promise that resolves when the basemap has been reloaded
   */
  static resetBasemap(mapId: string): Promise<void> {
    // reset basemap will use the current display language and projection and recreate the basemap
    const language = this.getMapViewer(mapId).getDisplayLanguage();
    const projection = getStoreMapCurrentProjection(mapId);
    return this.getMapViewer(mapId).basemap.loadDefaultBasemaps(projection, language);
  }

  /**
   * Creates and sets a new basemap with the given options.
   *
   * @param mapId - The map identifier
   * @param basemapOptions - The basemap options to apply
   * @returns A promise that resolves when the basemap has been set
   */
  static async setBasemap(mapId: string, basemapOptions: TypeBasemapOptions): Promise<void> {
    // Set basemap will use the current display language and projection and recreate the basemap
    const language = this.getMapViewer(mapId).getDisplayLanguage();
    const projection = getStoreMapCurrentProjection(mapId);

    // Create the core basemap
    const basemap = await this.getMapViewer(mapId).basemap.createCoreBasemap(basemapOptions, projection, language);

    // Set the basemap and basemap options
    this.getMapViewer(mapId).basemap.setBasemap(basemap);

    // Save to the store
    setStoreMapCurrentBasemapOptions(mapId, basemapOptions);
  }

  /**
   * Replaces the keyboard pan interaction with a new one using the specified pixel delta.
   *
   * @param mapId - The map identifier
   * @param panDelta - The pixel delta for keyboard panning
   */
  static setMapKeyboardPanInteractions(mapId: string, panDelta: number): void {
    const mapElement = this.getMapViewer(mapId).map;

    // replace the KeyboardPan interaction by a new one
    mapElement.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) {
        mapElement.removeInteraction(interactionItem);
      }
    });
    mapElement.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
  }

  /**
   * Activates or deactivates WCAG keyboard map interactions (pan and zoom).
   *
   * @param mapId - The map identifier
   * @param active - Whether to activate or deactivate keyboard interactions
   */
  static setActiveMapInteractionWCAG(mapId: string, active: boolean): void {
    const mapElement = this.getMapViewer(mapId).map;

    // replace the KeyboardPan interaction by a new one
    mapElement.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) interactionItem.setActive(active);
      if (interactionItem instanceof KeyboardZoom) interactionItem.setActive(active);
    });
  }

  /**
   * Sets the React root for the overview map so it can be destroyed with the map element.
   *
   * @param mapId - The map identifier
   * @param overviewRoot - The React root element for the overview map
   */
  static setMapOverviewMapRoot(mapId: string, overviewRoot: Root): void {
    this.getMapViewer(mapId).overviewRoot = overviewRoot;
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {string} mapId - The map id.
   * @param {Extent} extent - The extent to zoom to.
   * @param {FitOptions} options - The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 }).
   * @returns Promise<void>
   */
  static zoomToExtent(mapId: string, extent: Extent, options: FitOptions = DEFAULT_OL_FITOPTIONS): Promise<void> {
    // Merge user options with defaults
    const mergedOptions: FitOptions = { ...DEFAULT_OL_FITOPTIONS, ...options };

    // Validate the extent coordinates - need to make sure we aren't excluding zero with !number or using invalid extents
    const validatedExtent = GeoUtilities.validateExtent(extent, getStoreMapCurrentProjectionEPSG(mapId));
    if (
      !extent.some((number) => {
        return (!number && number !== 0) || Number.isNaN(number);
      }) &&
      JSON.stringify(extent) === JSON.stringify(validatedExtent)
    ) {
      // Store state will be updated by map event
      this.getMapViewer(mapId).getView().fit(extent, mergedOptions);

      // Wait a bit and return.
      return delay(mergedOptions.duration! + this.ZOOM_MIN_DELAY);
    }

    // Invalid extent
    this.getMapViewer(mapId).notifications.showError('error.map.invalidZoomExtent', [], true);
    throw new InvalidExtentError(extent);
  }

  /**
   * Zooms to a geolocator search result location.
   *
   * Highlights the bounding box if available, zooms to the extent, and shows the click marker.
   *
   * @param mapId - The map identifier
   * @param searchItem - The search item description
   * @param coords - The lon/lat coordinates to zoom to
   * @param bbox - Optional bounding box extent for the search result
   * @returns A promise that resolves when the zoom is complete
   */
  static async zoomToGeoLocatorLocation(mapId: string, searchItem: string, coords: Coordinate, bbox?: Extent): Promise<void> {
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
      this.getMapViewerLayerAPI(mapId).featureHighlight.highlightGeolocatorBBox(convertedExtent);

      // Zoom to extent and await
      await this.zoomToExtent(mapId, convertedExtent, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
        duration: OL_ZOOM_DURATION,
      });

      // Now show the click marker icon
      this.clickMarkerIconShow(mapId, { lonlat: coords });
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
      await this.zoomToExtent(mapId, extent);

      // Now show the click marker icon
      this.clickMarkerIconShow(mapId, { lonlat: coords });
      for (let i = 0; i < indicatorBox.length; i++) {
        (indicatorBox[i] as HTMLElement).style.display = '';
      }
    }
  }

  /**
   * Return to initial view state of map using config.
   *
   * @param {string} mapId - ID of the map to return to original view
   * @returns Promise<void>
   */
  static async zoomToInitialExtent(mapId: string): Promise<void> {
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
      const lonlatExtent = homeView.extent as Extent;
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
    if (homeView.layerIds) extent = await this.getMapViewerLayerAPI(mapId).getExtentOfMultipleLayers(homeView.layerIds);

    // If extent is not valid, take the default one for the current projection
    if (!extent || extent.length !== 4 || extent.includes(Infinity))
      extent = Projection.transformExtentFromProj(
        MAP_EXTENTS[currProjection],
        Projection.getProjectionLonLat(),
        Projection.getProjectionFromString(`EPSG:${currProjection}`)
      );

    return this.zoomToExtent(mapId, extent, options);
  }

  /**
   * Zoom to geolocation position provided.
   *
   * @param {string} mapId - ID of map to zoom on
   * @param {GeolocationPosition} position - Info on position to zoom to.
   * @returns Promise<void>
   */
  static zoomToMyLocation(mapId: string, position: GeolocationPosition): Promise<void> {
    const coord: Coordinate = [position.coords.longitude, position.coords.latitude];
    const projectedCoords = Projection.transformPoints(
      [coord],
      Projection.PROJECTION_NAMES.LONLAT,
      getStoreMapCurrentProjectionEPSG(mapId)
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];

    return this.zoomToExtent(mapId, extent);
  }

  /**
   * Zoom to layer visible scale.
   *
   * @param {string} mapId - ID of map to zoom on
   * @param {string} layerPath - Path of layer to zoom to.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  static zoomToLayerVisibleScale(mapId: string, layerPath: string): void {
    const view = this.getMapViewer(mapId).getView();
    const mapZoom = view.getZoom();
    const geoviewLayer = this.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);
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
      .getBounds(this.getMapViewer(mapId).getProjection(), MapViewer.DEFAULT_STOPS)
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
        logger.logPromiseFailed('in getBounds in MapEventProcessor.zoomToLayerVisibleScale', error);
      });
  }

  /**
   * Zoom to extents of a layer.
   *
   * @param mapId - ID of map to zoom on
   * @param layerPath - The path of the layer to zoom to.
   * @throws {NoBoundsError} When the layer doesn't have bounds.
   */
  static zoomToLayerExtent(mapId: string, layerPath: string, fitOptions?: FitOptions): Promise<void> {
    // Define some zoom options
    const options: FitOptions = fitOptions ?? { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };

    // Get the layer bounds
    const bounds = getStoreLayerStateLayerBounds(mapId, layerPath);

    // If found
    if (bounds) {
      return this.zoomToExtent(mapId, bounds, options);
    }

    // Failed
    throw new NoBoundsError(layerPath);
  }

  /**
   * Set Z index for layers
   *
   * @param mapId - Id of map to set layer Z indices
   */
  static setLayerZIndices = (mapId: string): void => {
    const reversedLayers = [...getStoreMapOrderedLayerInfo(mapId)].reverse();
    reversedLayers.forEach((orderedLayerInfo, index) => {
      const gvLayer = this.getMapViewerLayerAPI(mapId).getGeoviewLayerIfExists(orderedLayerInfo.layerPath);
      gvLayer?.setZIndex(index + 10);
    });
  };

  /**
   * Converts a map coordinate to a pixel position.
   *
   * @param mapId - The map identifier
   * @param coord - The map coordinate
   * @returns The pixel position on the map viewport
   */
  static getPixelFromCoordinate = (mapId: string, coord: Coordinate): Pixel => {
    return this.getMapViewer(mapId).map.getPixelFromCoordinate(coord);
  };

  /**
   * Positions the click marker overlay at the given map coordinates.
   *
   * @param mapId - The map identifier
   * @param position - The projected map coordinates to place the marker at
   */
  static setClickMarkerOnPosition = (mapId: string, position: number[]): void => {
    this.getMapViewer(mapId).map.getOverlayById(`${mapId}-clickmarker`)!.setPosition(position);
  };

  /**
   * Get all active filters for layer.
   *
   * @param {string} mapId - The map id.
   * @param {string} layerPath - The path for the layer to get filters from.
   * @returns {LayerFilters} The active layer filters
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  static getActiveFilters(mapId: string, layerPath: string): LayerFilters {
    // Get the layer and layer config
    const layer = this.getMapViewerLayerAPI(mapId).getGeoviewLayerRegular(layerPath);
    const layerConfig = layer.getLayerConfig();

    // The initial filter
    const initialFilter = layerConfig.getLayerFilter();

    // The class breaks filter if any
    const classFilter = layer.getFilterFromStyle();

    // The data table filter if any
    const dataFilter = getStoreTableFilter(mapId, layerPath);

    // If the TimeSlider is initialized
    let timeFilter: string | undefined;
    if (isStoreTimeSliderInitialized(mapId)) {
      // Assign it for the return
      timeFilter = getStoreTimeSliderFilter(mapId, layerPath);
    }

    // Return the current filters in the application
    return new LayerFilters(initialFilter, classFilter, dataFilter, timeFilter);
  }

  /**
   * Apply all available filters to layer.
   * @param {string} mapId - The map id.
   * @param {string} layerPath - The path of the layer to apply filters to.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  static applyLayerFilters(mapId: string, layerPath: string): void {
    // Get the Geoview layer
    const geoviewLayer = this.getMapViewerLayerAPI(mapId).getGeoviewLayerRegularIfExists(layerPath);

    // If found it
    if (geoviewLayer) {
      // Read filter information from the UI
      const layerFilters = this.getActiveFilters(mapId, layerPath);

      // Apply the view filter on the layer
      geoviewLayer.setLayerFilters(layerFilters, true);
    }
  }

  /**
   * Loads a plugin script dynamically and adds the plugin to a map.
   * This method first loads the plugin script by name, then registers the
   * plugin with the {@link MapEventProcessor} for the specified map.
   * @param {string} mapId - The unique identifier of the map to which the plugin will be added.
   * @param {string} pluginName - The name of the plugin to load and register.
   * @returns {Promise<void>} A promise that resolves when the plugin has been successfully loaded
   * and added to the map, or rejects with a formatted error if loading or registration fails.
   */
  static loadAndAddPlugin(mapId: string, pluginName: string): Promise<void> {
    // Create a promise that will resolve when the plugin is added
    return new Promise<void>((resolve, reject) => {
      Plugin.loadScript(pluginName)
        .then((typePlugin) => {
          // add the plugin by passing in the loaded constructor from the script tag
          this.addPlugin(pluginName, typePlugin, mapId)
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
  }

  /**
   * Adds a new plugin to the map.
   *
   * Creates the plugin instance, validates its configuration against the schema,
   * loads translations, and calls the plugin's add method. Returns an existing
   * plugin instance if it is already loaded.
   *
   * @param pluginId - The plugin identifier
   * @param constructor - The plugin class constructor
   * @param mapId - The identifier of the map to add the plugin to
   * @param props - Optional plugin options
   * @returns A promise that resolves with the plugin instance
   * @throws {PluginError} When no constructor is provided
   */
  static async addPlugin(pluginId: string, constructor: typeof AbstractPlugin, mapId: string, props?: unknown): Promise<AbstractPlugin> {
    // Get the MapViewer
    const mapViewer = this.getMapViewer(mapId);

    // If the plugin is already loaded, return it
    if (mapViewer.plugins[pluginId]) return mapViewer.plugins[pluginId];

    // If no constructor provided
    if (!constructor) throw new PluginError(pluginId, mapId);

    // Construct the Plugin class
    // create new instance of the plugin. Here we must type the constructor variable to any
    // in order to cancel the "'new' expression, whose target lacks a construct signature" error message
    // ? unknown type cannot be use, need to escape
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugin: AbstractPlugin = new (constructor as any)(pluginId, mapViewer, props);

    // Attach to the map plugins object
    mapViewer.plugins[pluginId] = plugin;

    // a config object used to store package config
    let pluginConfigObj: unknown = {};

    // if a schema is defined then look for a config for this plugin
    if (plugin.schema && plugin.defaultConfig) {
      const schema = plugin.schema();
      const defaultConfig = plugin.defaultConfig();

      // create a validator object
      const validator = new Ajv({
        strict: false,
        allErrors: true,
      });

      // initialize validator with schema file
      const validate = validator.compile(schema as AnySchema);

      // if no config is provided then use default
      pluginConfigObj = defaultConfig;

      /**
       * If a user is using map config from a file then attempt to look
       * for custom config for loaded core packages on the same path of the map config.
       * If none exists then load the default config
       */
      const configUrl = document.getElementById(mapViewer.mapId)?.getAttribute('data-config-url');

      // Check if there is a corePackageConfig for the plugin
      const configObj = mapViewer.getCorePackageConfig(pluginId);

      // If there is an inline config use it, if not try to read the file config associated with map config
      if (configObj) {
        logger.logTraceCore('Plugin - addPlugin inline config', configObj);
        pluginConfigObj = configObj;
      } else if (configUrl) {
        const configPath = `${configUrl.split('.json')[0]}-${pluginId}.json`;

        try {
          // Try to find the custom config from the config path
          const result = await Fetch.fetchJson(configPath);

          if (result) {
            logger.logTraceCore('Plugin - addPlugin file config', result);
            pluginConfigObj = result;
          }
        } catch (error: unknown) {
          // Log warning
          logger.logWarning(`Config not found.`, error);
          // Notify with a warning
          mapViewer.notifications.addNotificationWarning('error.map.pluginConfigNotFound', [pluginId, mapId, configPath]);
        }
      }

      // validate configuration
      const valid = validate(pluginConfigObj);

      if (!valid && validate.errors && validate.errors.length) {
        for (let j = 0; j < validate.errors.length; j += 1) {
          const error = validate.errors[j];
          const errorMessage = `Plugin ${pluginId}: ${error.instancePath} ${error.message} - ${JSON.stringify(error.params)}`;

          // Log
          logger.logError(errorMessage);
          // Don't show error message as it can contain non-translated elements via Ajv error messages, only log for now
          // api.getMapViewer(mapId).notifications.showError(errorMessage);
        }
      }
    }

    // Set the config
    plugin.setConfig(pluginConfigObj);

    // add translations if provided
    Object.entries(plugin.defaultTranslations()).forEach(([languageKey, value]) => {
      // Add the resource bundle to support the plugin language
      i18next.addResourceBundle(languageKey, 'translation', value, true, false);
    });

    // Call plugin add method
    plugin.add();

    // Return the plugin
    return plugin;
  }

  // #endregion STATIC METHODS

  // #region CONFIG FROM MAP STATE
  // TODO: Move this section to config API after refactor

  /**
   * Creates a map config based on current map state.
   * @param {string} mapId - Id of map.
   * @param {boolean | "hybrid"} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   * @returns {TypeMapFeaturesInstance | undefined} The type map features instance
   */
  static createMapConfigFromMapState(
    mapId: string,
    overrideGeocoreServiceNames: boolean | 'hybrid' = true
  ): TypeMapFeaturesInstance | undefined {
    if (isStoreMapConfigInitialized(mapId)) {
      // Get paths of top level layers
      const layerOrder = getStoreMapLayerPaths(mapId).filter(
        (layerPath) => !this.getMapViewerLayerAPI(mapId).getLayerEntryConfigIfExists(layerPath)?.getParentLayerConfig()
      );

      // Build list of geoview layer configs
      const listOfGeoviewLayerConfig = layerOrder
        .map((layerPath) => this.#createGeoviewLayerConfig(mapId, layerPath, overrideGeocoreServiceNames))
        .filter((mapLayerEntry) => !!mapLayerEntry);

      // Get info for view
      const projection = getStoreMapCurrentProjection(mapId);
      const currentView = this.getMapViewer(mapId).map.getView();
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
        const sliders = this.#createTimeSliderConfigs(mapId);
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
   * Creates a new geometry group on the map if it doesn't already exist.
   * Geometry groups are used to organize and manage collections of vector features (lines, polygons, points).
   * @param {string} mapId - The map identifier
   * @param {string} groupName - The unique name for the geometry group to create
   */
  static createGeometryGroup(mapId: string, groupName: string): void {
    const layerApi = this.getMapViewerLayerAPI(mapId);
    if (!layerApi.geometry.hasGeometryGroup(groupName)) {
      layerApi.geometry.createGeometryGroup(groupName);
    }
  }

  /**
   * Deletes all geometries from a geometry group.
   * Removes all vector features (lines, polygons, points) that belong to the specified group.
   * The group itself remains and can be reused.
   * @param {string} mapId - The map identifier
   * @param {string} groupName - The name of the geometry group to clear
   */
  static deleteGeometriesFromGroup(mapId: string, groupName: string): void {
    const layerApi = this.getMapViewerLayerAPI(mapId);
    if (layerApi.geometry.hasGeometryGroup(groupName)) {
      layerApi.geometry.deleteGeometriesFromGroup(groupName);
    }
  }

  /**
   * Initializes drawing interactions on the given vector source
   * @param {string} mapId - The map identifier
   * @param {string} geomGroupKey - The geometry group key in which to hold the geometries
   * @param {string} type - The type of geometry to draw (Polygon, LineString, Circle, etc)
   * @param {TypeFeatureStyle} [style] - The styles for the drawing
   * @returns {Draw} The init draw interactions object
   */
  static initDrawInteractions(mapId: string, geomGroupKey: string, type: string, style: TypeFeatureStyle): Draw {
    return this.getMapViewer(mapId).initDrawInteractions(geomGroupKey, type, style);
  }

  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   *
   * @param {string[][]} namePairs -  The array of name pairs. Presumably one english and one french name in each pair.
   * @param {TypeMapFeaturesInstance} mapConfig - The config to modify.
   * @param {boolean} removeUnlisted - Remove any layer name that doesn't appear in namePairs.
   * @returns {TypeMapFeaturesInstance} Map config with updated names.
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

  // #endregion CONFIG FROM MAP STATE

  // #region STATIC PRIVATE METHODS

  /**
   * Creates layer initial settings according to provided configs.
   *
   * @param {ConfigBaseClass} layerEntryConfig - Layer entry config for the layer.
   * @param {TypeOrderedLayerInfo} orderedLayerInfo - Ordered layer info for the layer.
   * @param {TypeLegendLayer} legendLayerInfo - Legend layer info for the layer.
   * @returns {TypeLayerInitialSettings} Initial settings object.
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
   * Creates a layer entry config based on current layer state.
   *
   * @param {string} mapId - Id of map.
   * @param {string} layerPath - Path of the layer to create config for.
   * @param {boolean} isGeocore - Indicates if it is a geocore layer.
   * @param {boolean | 'hybrid'} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   * @returns {TypeLayerEntryConfig} Entry config object.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  static #createLayerEntryConfig(
    mapId: string,
    layerPath: string,
    isGeocore: boolean,
    overrideGeocoreServiceNames: boolean | 'hybrid'
  ): TypeLayerEntryConfig {
    // Get needed info
    const layerEntryConfig = this.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath);
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
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(mapId, sublayerPath, isGeocore, overrideGeocoreServiceNames))
      );
    }

    // Get initial settings
    const initialSettings = this.#getInitialSettings(layerEntryConfig, orderedLayerInfo, legendLayerInfo!);

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

  /**
   * Creates a geoview layer config based on current layer state.
   *
   * @param {string} mapId - Id of map.
   * @param {string} layerPath - Path of the layer to create config for.
   * @param {boolean | "hybrid"} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   * @returns {MapConfigLayerEntry | undefined} Geoview layer config object.
   */
  static #createGeoviewLayerConfig(
    mapId: string,
    layerPath: string,
    overrideGeocoreServiceNames: boolean | 'hybrid'
  ): MapConfigLayerEntry | undefined {
    // Get needed info
    const layerEntryConfig = this.getMapViewerLayerAPI(mapId).getLayerEntryConfigIfExists(layerPath);
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
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(mapId, sublayerPath, isGeocore, overrideGeocoreServiceNames))
      );
    else listOfLayerEntryConfig.push(this.#createLayerEntryConfig(mapId, layerPath, isGeocore, overrideGeocoreServiceNames));

    // Get initial settings
    const initialSettings = this.#getInitialSettings(layerEntryConfig, orderedLayerInfo, legendLayerInfo!);

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
   * Searches through a list of layer entry configs and replaces any matching layer names with their provided partner.
   *
   * @param {Record<string, string>} pairsDict -  The dict of name pairs. Presumably one english and one french name in each pair.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfigs - The layer entry configs to modify.
   * @param {boolean} removeUnlisted - Remove any layer name that doesn't appear in namePairs.
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

  // #endregion STATIC PRIVATE METHODS
}
