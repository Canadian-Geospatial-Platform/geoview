import { Root } from 'react-dom/client';
import { ScaleLine, OverviewMap as OLOverviewMap } from 'ol/control';
import Overlay from 'ol/Overlay';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';
import { KeyboardPan, KeyboardZoom } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import { Size } from 'ol/size';
import { Pixel } from 'ol/pixel';

import {
  MAP_EXTENTS,
  TypeBasemapOptions,
  TypeInteraction,
  TypeValidAppBarCoreProps,
  TypeValidFooterBarTabsCoreProps,
  TypeValidMapProjectionCodes,
  TypeViewSettings,
  TypePointMarker,
  TypeHighlightColors,
  TypeMapViewSettings,
  TypeFeatureInfoEntry,
  TypeMapConfig,
  TypeMapFeaturesInstance,
} from '@/api/types/map-schema-types';
import {
  CONST_LAYER_TYPES,
  MapConfigLayerEntry,
  TypeLayerInitialSettings,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
} from '@/api/types/layer-schema-types';
import { api } from '@/app';
import { LayerApi } from '@/geo/layer/layer';
import { MapViewer, TypeMapState, TypeMapMouseInfo } from '@/geo/map/map-viewer';
import { PluginsContainer } from '@/api/plugin/plugin-types';
import { Projection } from '@/geo/utils/projection';
import { isPointInExtent, isExtentLonLat } from '@/geo/utils/utilities';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { NORTH_POLE_POSITION, OL_ZOOM_DURATION, OL_ZOOM_MAXZOOM, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { isValidUUID, whenThisThen } from '@/core/utils/utilities';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeClickMarker } from '@/core/components';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { IMapState, TypeOrderedLayerInfo, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { getAppCrosshairsActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { TypeHoverFeatureInfo } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';

import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { InvalidExtentError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';

// GV The paradigm when working with MapEventProcessor vs MapState goes like this:
// GV MapState provides: 'state values', 'actions' and 'setterActions'.
// GV Whereas Zustand would suggest having 'state values' and 'actions', in GeoView, we have a 'MapEventProcessor' in the middle.
// GV This is because we wanted to have centralized code between UI actions and backend actions via a MapEventProcessor.
// GV In summary:
// GV The UI components should use MapState's 'state values' to read and 'actions' to set states (which simply redirect to MapEventProcessor).
// GV The back-end code should use MapEventProcessor which uses 'state values' and 'setterActions'
// GV Essentially 3 main call-stacks:
// GV   - MapEventProcessor ---calls---> MapState.setterActions
// GV   - UI Component ---calls---> MapState.actions ---calls---> MapEventProcessor ---calls---> MapState.setterActions
// GV   - MapEventProcessor ---triggers---> MapViewer events ---calls---> MapState.setterActions
// GV The reason for this pattern is so that UI components and processes performing back-end code
// GV both end up running code in MapEventProcessor (UI: via 'actions' and back-end code via 'MapEventProcessor')
export class MapEventProcessor extends AbstractEventProcessor {
  /**
   * Initializes the map controls
   * @param {string} mapId - The map id being initialized
   */
  static async initMapControls(mapId: string): Promise<void> {
    // Log
    logger.logTraceCore('MAP EVENT PROCESSOR - initMapControls', mapId);

    // use api to access map because this function will set map element in store
    const mapViewer = this.getMapViewer(mapId);
    const { map } = mapViewer;
    const store = getGeoViewStore(mapId);

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
    const mapProjection = Projection.getProjectionFromString(`EPSG:${store.getState().mapState.currentProjection}`);

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
      offset: [-18, -35],
      element: document.getElementById(clickMarkerId) as HTMLElement,
      stopEvent: false,
    });
    map.addOverlay(clickMarkerOverlay);

    // Save in the store
    store.getState().mapState.setterActions.setOverlayNorthMarker(northPoleMarker);
    store.getState().mapState.setterActions.setOverlayClickMarker(clickMarkerOverlay);

    // Get the size
    const size = await mapViewer.getMapSize();

    // Set map size
    MapEventProcessor.setMapSize(mapId, size);

    // Get the scale information
    const scale = this.getScaleInfoFromDomElement(mapId);

    // Set the map scale
    MapEventProcessor.setMapScale(mapId, scale);

    // set map interaction
    this.setInteraction(mapId, store.getState().mapState.interaction);
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************

  // #region
  /**
   * Shortcut to get the Map state for a given map id
   * @param {string} mapId - map Id
   * @returns {IMapState} The Map state
   */
  protected static getMapStateProtected(mapId: string): IMapState {
    // TODO: Refactor - Rename this function when we want to clarify the small confusion with getMapState function below
    // Return the map state
    return this.getState(mapId).mapState;
  }

  /**
   * Shortcut to get the Map Viewer instance for a given map id
   * This is use to reduce the use of api.getMapViewer(mapId) and be more explicit
   * @param {string} mapId - map Id
   * @returns {MapViewer} The Map viewer instance
   */
  static getMapViewer(mapId: string): MapViewer {
    return api.getMapViewer(mapId);
  }

  /**
   * Shortcut to get the Map Viewer layer api instance for a given map id
   * This is use to reduce the use of api.getMapViewer(mapId).layer and be more explicit
   * @param {string} mapId - map Id
   * @returns {LayerApi} The Map viewer layer API instance
   */
  static getMapViewerLayerAPI(mapId: string): LayerApi {
    return api.getMapViewer(mapId).layer;
  }

  /**
   * Shortcut to get the Map Viewer plugins instance for a given map id
   * This is use to reduce the use of api.getMapViewer(mapId).plugins and be more explicit
   * @param {string} mapId - map Id
   * @returns {PluginsContainer} The map plugins container
   */
  static async getMapViewerPlugins(mapId: string): Promise<PluginsContainer> {
    // TODO: Check - Remove the try/catch here to force explicit case-by-case handling instead of via shared function.
    await whenThisThen(() => api && api.hasMapViewer(mapId));
    return api.getMapViewer(mapId).plugins;
  }

  /**
   * Retrieves the scale information from the DOM elements for the given map ID.
   * @param {string} mapId - The unique identifier of the map.
   * @returns {TypeScaleInfo} The scale information object
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
   * Shortcut to get the Map config for a given map id
   * @param {string} mapId the map id to retrieve the config for
   * @returns {TypeMapFeaturesConfig | undefined} the map config or undefined if there is no config for this map id
   */
  static getGeoViewMapConfig(mapId: string): TypeMapFeaturesConfig | undefined {
    // Return the map config
    return this.getState(mapId).mapConfig;
  }

  static getBasemapOptions(mapId: string): TypeBasemapOptions {
    return this.getMapStateProtected(mapId).currentBasemapOptions || this.getMapStateProtected(mapId).basemapOptions;
  }

  static getCurrentBasemapOptions(mapId: string): TypeBasemapOptions {
    return this.getMapStateProtected(mapId).currentBasemapOptions;
  }

  /**
   * Gets initial filter(s) for a layer.
   * @param {string} mapId - The map id of the state to act on
   * @param {string} layerPath - The path of the layer
   * @returns {string | undefined} The initial filter(s) for the layer
   */
  static getInitialFilter(mapId: string, layerPath: string): string | undefined {
    return this.getMapStateProtected(mapId).initialFilters[layerPath];
  }

  static getPointMarkers(mapId: string): Record<string, TypePointMarker[]> {
    return this.getMapStateProtected(mapId).pointMarkers;
  }

  /**
   * Gets feature highlight color.
   * @param {string} mapId - The ID of the map
   * @returns {TypeHighlightColors} The highlight color
   */
  static getFeatureHighlightColor(mapId: string): TypeHighlightColors {
    return this.getMapStateProtected(mapId).featureHighlightColor;
  }

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    // Project coords
    const projectedCoords = Projection.transformPoints(
      [marker.lonlat],
      Projection.PROJECTION_NAMES.LONLAT,
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );

    // Redirect to processor
    this.setClickMarkerOnPosition(mapId, projectedCoords[0]);

    // Save in store
    this.getMapStateProtected(mapId).setterActions.setClickMarker(projectedCoords[0]);
  }

  static clickMarkerIconHide(mapId: string): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setClickMarker(undefined);
  }

  static highlightBBox(mapId: string, extent: Extent, isLayerHighlight?: boolean): void {
    // Perform a highlight
    this.getMapViewerLayerAPI(mapId).featureHighlight.highlightGeolocatorBBox(extent, isLayerHighlight);
  }

  static getMapInteraction(mapId: string): TypeInteraction {
    return this.getMapStateProtected(mapId).interaction;
  }

  /**
   * Gets map layer paths in order.
   * @param {string} mapId - The map id
   * @returns {string[]} The ordered layer paths
   */
  static getMapLayerOrder(mapId: string): string[] {
    return this.getMapStateProtected(mapId).orderedLayerInfo.map((orderedLayerInfo) => {
      return orderedLayerInfo.layerPath;
    });
  }

  static getMapState(mapId: string): TypeMapState {
    const mapState = this.getMapStateProtected(mapId);
    return {
      currentProjection: mapState.currentProjection,
      currentZoom: mapState.zoom,
      mapCenterCoordinates: mapState.centerCoordinates,
      pointerPosition: mapState.pointerPosition || {
        pixel: [],
        lonlat: [],
        projected: [],
        dragging: false,
      },
      singleClickedPosition: mapState.clickCoordinates || {
        pixel: [],
        lonlat: [],
        projected: [],
        dragging: false,
      },
    };
  }

  static setMapAttribution(mapId: string, attribution: string[]): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setAttribution(attribution);
  }

  static setMapLoaded(mapId: string, mapLoaded: boolean): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapLoaded(mapLoaded);
  }

  static setMapDisplayed(mapId: string): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapDisplayed();
  }

  static setMapPointerPosition(mapId: string, pointerPosition: TypeMapMouseInfo): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setPointerPosition(pointerPosition);
  }

  static setClickCoordinates(mapId: string, clickCoordinates: TypeMapMouseInfo): void {
    // GV: We do not need to perform query, there is a handler on the map click in layer set.
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setClickCoordinates(clickCoordinates);

    // If in WCAG mode, we need to emit the event
    if (getAppCrosshairsActive(mapId)) this.getMapViewer(mapId).emitMapSingleClick(clickCoordinates);
  }

  static getLayersInVisibleRange = (mapId: string): string[] => {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const layersInVisibleRange = orderedLayerInfo.filter((layer) => layer.inVisibleRange).map((layer) => layer.layerPath);
    return layersInVisibleRange;
  };

  static setLayerInVisibleRange(mapId: string, layerPath: string, inVisibleRange: boolean): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const orderedLayer = orderedLayerInfo.find((layer) => layer.layerPath === layerPath);

    if (orderedLayer && orderedLayer.inVisibleRange !== inVisibleRange) {
      orderedLayer.inVisibleRange = inVisibleRange;
      this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
    }
  }

  static setZoom(mapId: string, zoom: number): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setZoom(zoom);
  }

  static setIsMouseInsideMap(mapId: string, inside: boolean): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setIsMouseInsideMap(inside);
  }

  static setRotation(mapId: string, rotation: number): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setRotation(rotation);
  }

  static setMapSize(mapId: string, size: Size): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapSize(size);
  }

  static setMapScale(mapId: string, scale: TypeScaleInfo): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapScale(scale);
  }

  static setMapMoveEnd(
    mapId: string,
    centerCoordinates: Coordinate,
    pointerPosition: TypeMapMouseInfo,
    degreeRotation: string,
    isNorthVisible: boolean,
    mapExtent: Extent,
    scale: TypeScaleInfo
  ): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapMoveEnd(
      centerCoordinates,
      pointerPosition,
      degreeRotation,
      isNorthVisible,
      mapExtent,
      scale
    );
  }

  static setInteraction(mapId: string, interaction: TypeInteraction): void {
    // enable or disable map interaction when type of map interaction is set
    this.getMapViewer(mapId)
      .map.getInteractions()
      .forEach((x) => x.setActive(interaction === 'dynamic'));

    // Save in store
    this.getMapStateProtected(mapId).setterActions.setInteraction(interaction);
  }

  static async setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    try {
      // Set circular progress to hide basemap switching
      AppEventProcessor.setCircularProgress(mapId, true);

      // get view status (center and projection) to calculate new center
      const currentView = this.getMapViewer(mapId).map.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjection, Projection.PROJECTION_NAMES.LONLAT)[0] as [
        number,
        number,
      ];
      const newProjection = projectionCode;

      // If maxExtent was provided and native projection, apply
      // GV The extent is different between LCC and WM and switching from one to the other may introduce weird constraint.
      // GV We may have to keep extent as array for configuration file but, technically, user does not change projection often.
      // GV A wider LCC extent like [-125, 30, -60, 89] (minus -125) will introduce distortion on larger screen...
      // GV It is why we apply the max extent only on native projection
      const viewSettings = this.getGeoViewMapConfig(mapId)?.map.viewSettings;
      const mapMaxExtent = viewSettings!.maxExtent && newProjection === viewSettings!.projection ? MAP_EXTENTS[newProjection] : undefined;

      // create new view settings
      const newView: TypeViewSettings = {
        initialView: { zoomAndCenter: [currentView.getZoom() as number, centerLatLng] },
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: mapMaxExtent,
        projection: newProjection,
      };

      // use store action to set projection value in store and apply new view to the map
      this.getMapStateProtected(mapId).setterActions.setProjection(projectionCode);

      // Before changing the view, clear the basemaps right away to prevent a moment where a
      // vector tile basemap might, momentarily, be in different projection than the view.
      // Note: It seems that since OpenLayers 10.5 OpenLayers throws an exception about this. So this line was added.
      this.getMapViewer(mapId).basemap.clearBasemaps();

      // Set overview map visibility to false when reproject to remove it from the map as it is vector tile
      MapEventProcessor.setOverviewMapVisibility(mapId, false);

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
      this.getMapViewer(mapId).refreshLayers();

      // When the map projection is changed, all layer bounds must be recalculated
      this.getMapViewer(mapId).layer.recalculateBoundsAll();

      // Remove layer highlight if present to avoid bad reprojection
      const highlightName = LegendEventProcessor.getLayerPanelState(mapId, 'highlightedLayer') as string;
      if (highlightName !== '') {
        MapEventProcessor.changeOrRemoveLayerHighlight(mapId, highlightName, highlightName);
      }

      // Reset the map object of overview map control
      MapEventProcessor.setOverviewMapVisibility(mapId, true);
    } finally {
      // Remove circular progress as refresh is done
      AppEventProcessor.setCircularProgress(mapId, false);
    }
  }

  /**
   * Sets the home view
   * @param mapId - The map id
   * @param view - The view settings
   */
  static setHomeButtonView(mapId: string, view: TypeMapViewSettings): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setHomeView(view);
  }

  static rotate(mapId: string, rotation: number): void {
    // Do the actual view map rotation
    this.getMapViewer(mapId).map.getView().animate({ rotation });
    // GV No need to save in the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  static zoom(mapId: string, zoom: number, duration: number = OL_ZOOM_DURATION): void {
    // Do the actual zoom
    this.getMapViewer(mapId).map.getView().animate({ zoom, duration });
    // GV No need to save in the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  /**
   * Gets the ordered layer info.
   * @param {string} mapId - The map id
   * @returns {TypeOrderedLayerInfo[]} The ordered layer info
   */
  static getMapOrderedLayerInfo(mapId: string): TypeOrderedLayerInfo[] {
    return this.getMapStateProtected(mapId).orderedLayerInfo;
  }

  /**
   * Gets the ordered layer info for one layer.
   * @param {string} mapId - The map id.
   * @param {string} layerPath - The path of the layer to get.
   * @returns {TypeOrderedLayerInfo | undefined} The ordered layer info.
   */
  static findMapLayerFromOrderedInfo(
    mapId: string,
    layerPath: string,
    orderedLayerInfo: TypeOrderedLayerInfo[] = this.getMapStateProtected(mapId).orderedLayerInfo
  ): TypeOrderedLayerInfo | undefined {
    return orderedLayerInfo.find((layer) => layer.layerPath === layerPath);
  }

  /**
   * Gets the ordered layer info for one layer and its children.
   * @param {string} mapId - The map id.
   * @param {string} layerPath - The path of the layer to get.
   * @param {TypeOrderedLayerInfo[]} orderedLayerInfo - The array of ordered layer info to search, default is current ordered layer info.
   * @returns {TypeOrderedLayerInfo[] | undefined} The ordered layer info of the layer and its children.
   */
  static findMapLayerAndChildrenFromOrderedInfo(
    mapId: string,
    layerPath: string,
    orderedLayerInfo: TypeOrderedLayerInfo[] = this.getMapStateProtected(mapId).orderedLayerInfo
  ): TypeOrderedLayerInfo[] {
    return orderedLayerInfo.filter((layer) => layer.layerPath.startsWith(`${layerPath}/`) || layer.layerPath === layerPath);
  }

  static getMapIndexFromOrderedLayerInfo(mapId: string, layerPath: string): number {
    // Get index of a layer
    const info = this.getMapStateProtected(mapId).orderedLayerInfo;
    for (let i = 0; i < info.length; i++) if (info[i].layerPath === layerPath) return i;
    return -1;
  }

  static getLegendCollapsibleLayers(mapId: string): TypeOrderedLayerInfo[] {
    // Get collapsible layers
    const orderedLayerInfo = this.getMapOrderedLayerInfo(mapId);
    const { legendLayers } = this.getState(mapId).layerState;

    return orderedLayerInfo.filter((layer) => {
      const legendLayer = LegendEventProcessor.findLayerByPath(legendLayers, layer.layerPath);
      return (
        (legendLayer?.children && legendLayer.children.length > 0) ||
        (legendLayer?.items && legendLayer.items.length > 1) ||
        (legendLayer?.type === CONST_LAYER_TYPES.WMS && legendLayer?.icons?.some((icon) => icon.iconImage && icon.iconImage !== 'no data'))
      );
    });
  }

  static getAllLegendLayersCollapsed(mapId: string): boolean {
    // Get whether all the collapsible layers are collapsed
    const collapsibleLayers = MapEventProcessor.getLegendCollapsibleLayers(mapId);

    // If there are no collapsible layers, return true
    if (collapsibleLayers.length === 0) return true;
    return collapsibleLayers.every((layer) => layer.legendCollapsed);
  }

  static getMapLegendCollapsedFromOrderedLayerInfo(mapId: string, layerPath: string): boolean {
    // Get legend status of a layer
    return this.findMapLayerFromOrderedInfo(mapId, layerPath)?.legendCollapsed !== false;
  }

  static getMapVisibilityFromOrderedLayerInfo(mapId: string, layerPath: string): boolean {
    // Get visibility of a layer
    return this.findMapLayerFromOrderedInfo(mapId, layerPath)?.visible !== false;
  }

  /**
   * Checks if any parent of a layer is hidden.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to check.
   */
  static getMapLayerParentHidden(mapId: string, layerPath: string): boolean {
    const curOrderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(mapId);

    // For each parent
    const parentLayerPathArray = layerPath.split('/');
    parentLayerPathArray.pop();
    let parentLayerPath = parentLayerPathArray.join('/');
    let parentLayerInfo = curOrderedLayerInfo.find((info: TypeOrderedLayerInfo) => info.layerPath === parentLayerPath);

    while (parentLayerInfo !== undefined) {
      // Return true as soon as any parent is not visible
      if (parentLayerInfo.visible === false) return true;

      // Prepare for next parent
      parentLayerPathArray.pop();
      parentLayerPath = parentLayerPathArray.join('/');
      // eslint-disable-next-line no-loop-func
      parentLayerInfo = curOrderedLayerInfo.find((info: TypeOrderedLayerInfo) => info.layerPath === parentLayerPath);
    }

    return false;
  }

  static getMapInVisibleRangeFromOrderedLayerInfo(mapId: string, layerPath: string): boolean {
    // Get inVisibleRange of a layer
    return this.findMapLayerFromOrderedInfo(mapId, layerPath)?.inVisibleRange !== false;
  }

  static addHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry): void {
    if (feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
      MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.highlightFeature(feature);
      // Save in store
      this.getMapStateProtected(mapId).setterActions.setHighlightedFeatures([
        ...this.getMapStateProtected(mapId).highlightedFeatures,
        feature,
      ]);
    }
  }

  static removeHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry | 'all'): void {
    if (feature === 'all' || feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
      // Filter what we want to keep as highlighted features
      let highlightedFeatures: TypeFeatureInfoEntry[] = [];
      if (feature === 'all') {
        MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.removeHighlight(feature);
      } else {
        MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.removeHighlight(feature.uid!);
        highlightedFeatures = this.getMapStateProtected(mapId).highlightedFeatures.filter(
          (featureInfoEntry: TypeFeatureInfoEntry) => featureInfoEntry.uid !== feature.uid
        );
      }

      // Save in store
      this.getMapStateProtected(mapId).setterActions.setHighlightedFeatures(highlightedFeatures);
    }
  }

  static removeLayerHighlights(mapId: string, layerPath: string): void {
    MapEventProcessor.getMapViewerLayerAPI(mapId).removeLayerHighlights(layerPath);
  }

  /**
   * Add a point marker
   * @param {string} mapId - The ID of the map.
   * @param {string} group - The group to add the markers to.
   * @param {TypePointMarker} pointMarkers - The point markers to add.
   */
  static addPointMarkers(mapId: string, group: string, pointMarkers: TypePointMarker[]): void {
    const curMarkers = this.getMapStateProtected(mapId).pointMarkers;

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
    this.getMapStateProtected(mapId).setterActions.setPointMarkers(curMarkers);
    MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  /**
   * Remove a point marker
   * @param {string} mapId - The ID of the map.
   * @param {string} group - The group to remove the markers from.
   * @param {string | Coordinate} idsOrCoordinates - The IDs or coordinates of the markers to remove.
   */
  static removePointMarkersOrGroup(mapId: string, group: string, idsOrCoordinates?: string[] | Coordinate[]): void {
    const curMarkers = this.getMapStateProtected(mapId).pointMarkers;

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
    this.getMapStateProtected(mapId).setterActions.setPointMarkers(curMarkers);
    MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.pointMarkers?.updatePointMarkers(curMarkers);
  }

  /**
   * Update or remove the layer highlight.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path to set as the highlighted layer.
   * @param {string} highlightedLayerPath - The layer path of the currently highlighted layer.
   * @returns {string} The layer path of the highlighted layer.
   */
  static changeOrRemoveLayerHighlight(mapId: string, layerPath: string, highlightedLayerPath: string): string {
    // If layer is currently highlighted layer, remove highlight
    if (highlightedLayerPath === layerPath) {
      LegendEventProcessor.setHighlightLayer(mapId, '');
      MapEventProcessor.getMapViewerLayerAPI(mapId).removeHighlightLayer();
      return '';
    }

    // Redirect to layer to highlight
    MapEventProcessor.getMapViewerLayerAPI(mapId).highlightLayer(layerPath);

    // Get bounds and highlight a bounding box for the layer
    const bounds = LegendEventProcessor.getLayerBounds(mapId, layerPath);

    if (bounds && bounds[0] !== Infinity) this.getMapStateProtected(mapId).actions.highlightBBox(bounds, true);

    return layerPath;
  }

  static addInitialFilter(mapId: string, layerPath: string, filter: string): void {
    const curFilters = this.getMapStateProtected(mapId).initialFilters;
    this.getMapStateProtected(mapId).setterActions.setInitialFilters({ ...curFilters, [layerPath]: filter });
  }

  static setCurrentBasemapOptions(mapId: string, basemapOptions: TypeBasemapOptions): void {
    this.getMapStateProtected(mapId).setterActions.setCurrentBasemapOptions(basemapOptions);
  }

  static setMapLayerHoverable(mapId: string, layerPath: string, hoverable: boolean): void {
    this.getMapStateProtected(mapId).setterActions.setHoverable(layerPath, hoverable);
  }

  static setMapHoverFeatureInfo(mapId: string, hoverFeatureInfo: TypeHoverFeatureInfo): void {
    this.getMapStateProtected(mapId).setterActions.setHoverFeatureInfo(hoverFeatureInfo);
  }

  static setMapOrderedLayerInfo(mapId: string, orderedLayerInfo: TypeOrderedLayerInfo[]): void {
    this.getMapStateProtected(mapId).setterActions.setOrderedLayerInfo(orderedLayerInfo);
    this.setLayerZIndices(mapId);
  }

  static setMapLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void {
    this.getMapStateProtected(mapId).setterActions.setQueryable(layerPath, queryable);
  }

  static setMapLegendCollapsed(mapId: string, layerPath: string, collapsed: boolean): void {
    this.getMapStateProtected(mapId).setterActions.setLegendCollapsed(layerPath, collapsed);
  }

  static setAllMapLayerCollapsed(mapId: string, newCollapsed: boolean): void {
    // Set the collapsed state for all layers
    const orderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfo(mapId);
    orderedLayerInfo.forEach((layer) => {
      if (layer.legendCollapsed !== newCollapsed) {
        this.setMapLegendCollapsed(mapId, layer.layerPath, newCollapsed);
      }
    });
  }

  static setOrToggleMapLayerVisibility(mapId: string, layerPath: string, newValue?: boolean): boolean {
    // Redirect to layerAPI
    return this.getMapViewerLayerAPI(mapId).setOrToggleLayerVisibility(layerPath, newValue);
  }

  /**
   * Sets the opacity of a layer in the layer legend.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path of the layer to change.
   * @param {boolean} visibility - The visibility to set.
   */
  static setMapLayerVisibilityInStore(mapId: string, layerPath: string, visibility: boolean): void {
    const curOrderedLayerInfo = this.getMapOrderedLayerInfo(mapId);

    // Get and update ordered layer info
    const layerInfo = curOrderedLayerInfo.find((orderedLayerInfo) => orderedLayerInfo.layerPath === layerPath);
    if (layerInfo && layerInfo.visible !== visibility) {
      layerInfo.visible = visibility;
      // Update the store with setterActions
      this.setMapOrderedLayerInfo(mapId, curOrderedLayerInfo);
    }
  }

  static setAllMapLayerVisibility(mapId: string, newVisibility: boolean): void {
    // Set the visibility for all layers
    const layerApi = this.getMapViewerLayerAPI(mapId);
    layerApi.getGeoviewLayers().forEach((layer) => {
      if (layer.getVisible() !== newVisibility) {
        layerApi.setOrToggleLayerVisibility(layer.getLayerPath(), newVisibility);
      }
    });
  }

  static reorderLayer(mapId: string, layerPath: string, move: number): void {
    // Redirect to state API
    api.getMapViewer(mapId).stateApi.reorderLayers(mapId, layerPath, move);
  }

  /**
   * Replace a layer in the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config of the layer to add.
   * @param {string} layerPathToReplace The layerPath of the info to replace.
   * @return {void}
   */
  static replaceOrderedLayerInfo(
    mapId: string,
    geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig,
    layerPathToReplace?: string
  ): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const layerPath = (geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId
      ? `${(geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId}/base-group`
      : (geoviewLayerConfig as TypeLayerEntryConfig).layerPath;
    const pathToSearch = layerPathToReplace || layerPath;
    const index = this.getMapIndexFromOrderedLayerInfo(mapId, pathToSearch);
    const replacedLayers = this.findMapLayerAndChildrenFromOrderedInfo(mapId, pathToSearch);
    const newOrderedLayerInfo = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    orderedLayerInfo.splice(index, replacedLayers.length, ...newOrderedLayerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Add a new layer to the orderedLayerInfo array using a layer config.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config of the layer to add.
   * @return {void}
   */
  static addOrderedLayerInfoByConfig(
    mapId: string,
    geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig,
    index?: number
  ): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const newOrderedLayerInfo = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    if (!index) orderedLayerInfo.unshift(...newOrderedLayerInfo);
    else orderedLayerInfo.splice(index, 0, ...newOrderedLayerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Add new layer info to the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {TypeOrderedLayerInfo} layerInfo The ordered layer info to add.
   */
  static addOrderedLayerInfo(mapId: string, layerInfo: TypeOrderedLayerInfo, index?: number): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    if (!index) orderedLayerInfo.unshift(layerInfo);
    else orderedLayerInfo.splice(index, 0, layerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Remove a layer from the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to remove the layer from.
   * @param {string} layerPath The path of the layer to remove.
   * @param {boolean} removeSublayers Should sublayers be removed.
   * @return {void}
   */
  static removeOrderedLayerInfo(mapId: string, layerPath: string, removeSublayers: boolean = true): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const newOrderedLayerInfo = removeSublayers
      ? orderedLayerInfo.filter((layerInfo) => !layerInfo.layerPath.startsWith(`${layerPath}/`) && !(layerInfo.layerPath === layerPath))
      : orderedLayerInfo.filter((layerInfo) => !(layerInfo.layerPath === layerPath));

    // Redirect
    this.setMapOrderedLayerInfo(mapId, newOrderedLayerInfo);
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  static getOverviewMapControl(mapId: string, div: HTMLDivElement): OLOverviewMap {
    const olMap = this.getMapViewer(mapId).map;
    return this.getMapViewer(mapId).basemap.getOverviewMapControl(olMap, div);
  }

  static setOverviewMapVisibility(mapId: string, visible: boolean): void {
    const olMap = this.getMapViewer(mapId).map;
    this.getMapViewer(mapId).basemap.setOverviewMapControlVisibility(olMap, visible);
  }

  static resetBasemap(mapId: string): Promise<void> {
    // reset basemap will use the current display language and projection and recreate the basemap
    const language = AppEventProcessor.getDisplayLanguage(mapId);
    const projection = this.getMapState(mapId).currentProjection as TypeValidMapProjectionCodes;
    return this.getMapViewer(mapId).basemap.loadDefaultBasemaps(projection, language);
  }

  static async setBasemap(mapId: string, basemapOptions: TypeBasemapOptions): Promise<void> {
    // Set basemap will use the current display language and projection and recreate the basemap
    const language = AppEventProcessor.getDisplayLanguage(mapId);
    const projection = this.getMapState(mapId).currentProjection as TypeValidMapProjectionCodes;

    // Create the core basemap
    const basemap = await this.getMapViewer(mapId).basemap.createCoreBasemap(basemapOptions, projection, language);

    // Set the basemap and basemap options
    this.getMapViewer(mapId).basemap.setBasemap(basemap);
    this.setCurrentBasemapOptions(mapId, basemapOptions);
  }

  static setMapKeyboardPanInteractions(mapId: string, panDelta: number): void {
    const mapElement = this.getMapViewer(mapId).map;

    // replace the KeyboardPan interraction by a new one
    mapElement.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) {
        mapElement.removeInteraction(interactionItem);
      }
    });
    mapElement.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
  }

  static setActiveMapInteractionWCAG(mapId: string, active: boolean): void {
    const mapElement = this.getMapViewer(mapId).map;

    // replace the KeyboardPan interraction by a new one
    mapElement.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) interactionItem.setActive(active);
      if (interactionItem instanceof KeyboardZoom) interactionItem.setActive(active);
    });
  }

  /**
   * Set the React root overview map element so it can be destroy if the map element is destroyed
   *
   * @param mapId The map id.
   * @param overviewRoot The React root element for the overview map
   */
  static setMapOverviewMapRoot(mapId: string, overviewRoot: Root): void {
    this.getMapViewer(mapId).overviewRoot = overviewRoot;
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {string} mapId The map id.
   * @param {Extent} extent The extent to zoom to.
   * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11, duration: 500 }).
   */
  static zoomToExtent(
    mapId: string,
    extent: Extent,
    options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: OL_ZOOM_MAXZOOM, duration: OL_ZOOM_DURATION }
  ): Promise<void> {
    // Validate the extent coordinates - need to make sure we aren't excluding zero with !number
    if (
      !extent.some((number) => {
        return (!number && number !== 0) || Number.isNaN(number);
      })
    ) {
      // store state will be updated by map event
      this.getMapViewer(mapId).getView().fit(extent, options);

      // Use a Promise and resolve it when the duration expired
      return new Promise((resolve) => {
        setTimeout(
          () => {
            resolve();
          },
          (options.duration || OL_ZOOM_DURATION) + 150
        );
      });
      // The +150 is to make sure the logic before turning these function async remains
      // TODO: Refactor - Check the +150 relevancy and try to remove it by clarifying the reason for its existance
    }

    // Invalid extent
    throw new InvalidExtentError(extent);
  }

  static async zoomToGeoLocatorLocation(mapId: string, coords: Coordinate, bbox?: Extent): Promise<void> {
    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box');
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }

    const projectionConfig = Projection.PROJECTIONS[this.getMapState(mapId).currentProjection];
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
        `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
      );

      const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
      const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

      // Zoom to extent and await
      await this.zoomToExtent(mapId, extent, options);

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
  static zoomToInitialExtent(mapId: string): Promise<void> {
    const currProjection = this.getMapStateProtected(mapId).currentProjection;
    let extent: Extent = MAP_EXTENTS[currProjection];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };
    const homeView = this.getMapStateProtected(mapId).homeView || this.getMapStateProtected(mapId).initialView;

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
      extent = isExtentLonLat(lonlatExtent)
        ? Projection.transformExtentFromProj(
            lonlatExtent,
            Projection.getProjectionLonLat(),
            Projection.getProjectionFromString(`EPSG:${currProjection}`)
          )
        : lonlatExtent;

      options.padding = [0, 0, 0, 0];
    }

    // If layer IDs are in the config, use them
    if (homeView.layerIds) extent = this.getMapViewerLayerAPI(mapId).getExtentOfMultipleLayers(homeView.layerIds);

    // If extent is not valid, take the default one for the current projection
    if (extent.length !== 4 || extent.includes(Infinity))
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
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

    return this.zoomToExtent(mapId, extent, options);
  }

  /**
   * Zoom to layer visible scale.
   *
   * @param {string} mapId - ID of map to zoom on
   * @param {string} layerPath - Path of layer to zoom to.
   */
  static zoomToLayerVisibleScale(mapId: string, layerPath: string): void {
    const view = this.getMapViewer(mapId).getView();
    const mapZoom = view.getZoom();
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);
    const layerMaxZoom = geoviewLayer!.getMaxZoom();
    const layerMinZoom = geoviewLayer!.getMinZoom();

    // Set the right zoom (Infinity will act as a no change in zoom level)
    let layerZoom = Infinity;
    if (layerMinZoom !== -Infinity && layerMinZoom >= mapZoom!) layerZoom = layerMinZoom + 0.25;
    else if (layerMaxZoom !== Infinity && layerMaxZoom <= mapZoom!) layerZoom = layerMaxZoom - 0.25;

    // Change view to go to proper zoom centered in the middle of layer extent
    // If there is no layerExtent or if the zoom needs to zoom out, the center will be undefined and not use
    // Check if the map center is already in the layer extent and if so, do not center
    const layerExtent = (geoviewLayer! as AbstractGVLayer).getBounds(this.getMapViewer(mapId).getProjection(), MapViewer.DEFAULT_STOPS);
    const centerExtent =
      layerExtent && layerMinZoom > mapZoom! && !isPointInExtent(view.getCenter()!, layerExtent)
        ? [(layerExtent[2] + layerExtent[0]) / 2, (layerExtent[1] + layerExtent[3]) / 2]
        : undefined;

    view.animate({
      center: centerExtent,
      zoom: layerZoom,
      duration: OL_ZOOM_DURATION,
    });
  }

  /**
   * Set Z index for layers
   *
   * @param {string} mapId - Id of map to set layer Z indices
   */
  static setLayerZIndices = (mapId: string): void => {
    const reversedLayers = [...this.getMapStateProtected(mapId).orderedLayerInfo].reverse();
    reversedLayers.forEach((orderedLayerInfo, index) => {
      const olLayer = this.getMapViewerLayerAPI(mapId).getOLLayer(orderedLayerInfo.layerPath);
      if (olLayer) olLayer?.setZIndex(index + 10);
    });
  };

  static getPixelFromCoordinate = (mapId: string, coord: Coordinate): Pixel => {
    return this.getMapViewer(mapId).map.getPixelFromCoordinate(coord);
  };

  static setClickMarkerOnPosition = (mapId: string, position: number[]): void => {
    this.getMapViewer(mapId).map.getOverlayById(`${mapId}-clickmarker`)!.setPosition(position);
  };

  /**
   * Get all active filters for layer.
   *
   * @param {string} mapId The map id.
   * @param {string} layerPath The path for the layer to get filters from.
   */
  static getActiveVectorFilters(mapId: string, layerPath: string): (string | undefined)[] | undefined {
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);
    if (geoviewLayer) {
      const initialFilter = this.getInitialFilter(mapId, layerPath);
      const tableFilter = DataTableEventProcessor.getTableFilter(mapId, layerPath);
      const sliderFilter = TimeSliderEventProcessor.getTimeSliderFilter(mapId, layerPath);
      return [initialFilter, tableFilter, sliderFilter].filter((filter) => filter);
    }
    return undefined;
  }

  /**
   * Apply all available filters to layer.
   *
   * @param {string} mapId The map id.
   * @param {string} layerPath The path of the layer to apply filters to.
   */
  static applyLayerFilters(mapId: string, layerPath: string): void {
    // Get the Geoview layer
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayer(layerPath);

    // If found it and of right type
    if (
      geoviewLayer &&
      (geoviewLayer instanceof AbstractGVVector ||
        geoviewLayer instanceof GVWMS ||
        geoviewLayer instanceof GVEsriImage ||
        geoviewLayer instanceof GVEsriDynamic)
    ) {
      // Depending on the instance
      if (geoviewLayer instanceof GVWMS || geoviewLayer instanceof GVEsriImage) {
        // Read filter information
        const filter = TimeSliderEventProcessor.getTimeSliderFilter(mapId, layerPath);

        // If filter was defined
        if (filter) geoviewLayer.applyViewFilter(filter);
      } else {
        // Read filter information
        const filters = this.getActiveVectorFilters(mapId, layerPath) || [''];
        const filter = filters.join(' and ');

        // If EsriDynamic
        if (geoviewLayer instanceof GVEsriDynamic) {
          // Force the layer to applyfilter so it refreshes its layerDefs
          geoviewLayer.applyViewFilter(filter);
        } else if (geoviewLayer instanceof AbstractGVVector) {
          // Force the layer to applyfilter so it refreshes its layer config filter
          geoviewLayer.applyViewFilter(filter);
        } else {
          // Not supported
          throw new NotSupportedError('Layer type not supported when trying to perform an applyLayerFilters.');
        }
      }
    }
  }

  // #endregion

  // TODO: Move this section to config API after refactor
  // #region CONFIG FROM MAP STATE

  /**
   * Creates layer initial settings according to provided configs.
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
        queryable: orderedLayerInfo.queryable,
        hoverable: orderedLayerInfo.hoverable,
      },
      controls: legendLayerInfo.controls,
      bounds: layerEntryConfig.initialSettings.bounds,
      className: layerEntryConfig.initialSettings.className,
      extent: layerEntryConfig.initialSettings.extent,
      minZoom: layerEntryConfig.initialSettings.minZoom,
      maxZoom: layerEntryConfig.initialSettings.maxZoom,
    };
  }

  /**
   * Creates a layer entry config based on current layer state.
   * @param {string} mapId - Id of map.
   * @param {string} layerPath - Path of the layer to create config for.
   * @param {boolean} isGeocore - Indicates if it is a geocore layer.
   * @param {boolean | 'hybrid'} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   * @returns {TypeLayerEntryConfig} Entry config object.
   */
  static #createLayerEntryConfig(
    mapId: string,
    layerPath: string,
    isGeocore: boolean,
    overrideGeocoreServiceNames: boolean | 'hybrid'
  ): TypeLayerEntryConfig {
    // Get needed info
    const layerEntryConfig = this.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath);
    const orderedLayerInfo = this.findMapLayerFromOrderedInfo(mapId, layerPath);
    const legendLayerInfo = LegendEventProcessor.getLegendLayerInfo(mapId, layerPath);

    // Get original layerEntryConfig from map config
    const pathArray = layerPath.split('/');
    if (pathArray[0] === pathArray[1]) pathArray.splice(0, 1);
    const geoviewLayerConfig = this.getGeoViewMapConfig(mapId)?.map.listOfGeoviewLayerConfig?.find(
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
    if (layerEntryConfig!.getEntryTypeIsGroup()) {
      const sublayerPaths = this.getMapLayerOrder(mapId).filter(
        (entryLayerPath) =>
          entryLayerPath.startsWith(`${layerPath}/`) && entryLayerPath.split('/').length === layerPath.split('/').length + 1
      );
      sublayerPaths.forEach((sublayerPath) =>
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(mapId, sublayerPath, isGeocore, overrideGeocoreServiceNames))
      );
    }

    // Get initial settings
    const initialSettings = this.#getInitialSettings(layerEntryConfig!, orderedLayerInfo!, legendLayerInfo!);

    const source = (layerEntryConfig! as VectorLayerEntryConfig).source
      ? { ...(layerEntryConfig! as VectorLayerEntryConfig).source }
      : undefined;

    // Only use feature info specified in original config, not drawn from services
    if (source?.featureInfo) delete source?.featureInfo;
    if (configLayerEntryConfig?.source?.featureInfo && source) source.featureInfo = configLayerEntryConfig.source.featureInfo;

    if (source?.dataAccessPath && isGeocore && overrideGeocoreServiceNames !== true) source.dataAccessPath = undefined;

    const layerStyle =
      legendLayerInfo!.styleConfig && (!isGeocore || overrideGeocoreServiceNames === true) ? legendLayerInfo!.styleConfig : undefined;

    // Construct layer entry config
    const newLayerEntryConfig = {
      layerId: layerEntryConfig!.layerId,
      layerName: isGeocore && overrideGeocoreServiceNames === false ? undefined : layerEntryConfig!.getLayerName(),
      layerFilter: AbstractBaseLayerEntryConfig.getClassOrTypeLayerFilter(configLayerEntryConfig),
      initialSettings,
      layerStyle,
      entryType: listOfLayerEntryConfig.length ? 'group' : undefined,
      source: listOfLayerEntryConfig.length ? undefined : source,
      listOfLayerEntryConfig: listOfLayerEntryConfig.length ? listOfLayerEntryConfig : undefined,
    };

    return newLayerEntryConfig as unknown as TypeLayerEntryConfig;
  }

  /**
   * Creates a geoview layer config based on current layer state.
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
    const layerEntryConfig = this.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath);

    // If not found, log warning and skip
    if (!layerEntryConfig) {
      // Log
      logger.logWarning(`Couldn't find the layer entry config for layer path '${layerPath}'`);
      return undefined;
    }

    const { geoviewLayerConfig } = layerEntryConfig;
    const orderedLayerInfo = this.findMapLayerFromOrderedInfo(mapId, layerPath);
    const legendLayerInfo = LegendEventProcessor.getLegendLayerInfo(mapId, layerPath);

    // Check if the layer is a geocore layers
    const isGeocore = isValidUUID(layerPath.split('/')[0]);

    const layerEntryLayerPaths = geoviewLayerConfig.listOfLayerEntryConfig.map(
      (geoviewLayerEntryConfig) => geoviewLayerEntryConfig.layerPath
    );

    // Check for sublayers
    const sublayerPaths = this.getMapLayerOrder(mapId).filter(
      // We only want the immediate child layers, group sublayers will handle their own sublayers
      (entryLayerPath) => layerEntryLayerPaths.includes(entryLayerPath)
    );

    // Build list of sublayer entry configs
    const listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
    if (sublayerPaths.length)
      sublayerPaths.forEach((sublayerPath) =>
        listOfLayerEntryConfig.push(this.#createLayerEntryConfig(mapId, sublayerPath, isGeocore, overrideGeocoreServiceNames))
      );
    else listOfLayerEntryConfig.push(this.#createLayerEntryConfig(mapId, layerPath, isGeocore, overrideGeocoreServiceNames));

    // Get initial settings
    const initialSettings = this.#getInitialSettings(layerEntryConfig, orderedLayerInfo!, legendLayerInfo!);

    // Construct geoview layer config
    const newGeoviewLayerConfig: MapConfigLayerEntry =
      isGeocore && overrideGeocoreServiceNames !== true
        ? {
            geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
            geoviewLayerName: overrideGeocoreServiceNames === false ? undefined : geoviewLayerConfig.geoviewLayerName,
            geoviewLayerType: 'geoCore',
            initialSettings,
            listOfLayerEntryConfig,
          }
        : {
            externalDateFormat: geoviewLayerConfig.externalDateFormat,
            geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
            geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
            geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
            initialSettings,
            isTimeAware: geoviewLayerConfig.isTimeAware,
            listOfLayerEntryConfig,
            metadataAccessPath: geoviewLayerConfig.metadataAccessPath,
            serviceDateFormat: geoviewLayerConfig.serviceDateFormat,
          };

    return newGeoviewLayerConfig;
  }

  /**
   * Creates a map config based on current map state.
   * @param {string} mapId - Id of map.
   * @param {boolean | "hybrid"} overrideGeocoreServiceNames - Indicates if geocore layer names should be kept as is or returned to defaults.
   */
  static createMapConfigFromMapState(
    mapId: string,
    overrideGeocoreServiceNames: boolean | 'hybrid' = true
  ): TypeMapFeaturesInstance | undefined {
    const config = this.getGeoViewMapConfig(mapId);

    if (config) {
      // Get paths of top level layers
      const layerOrder = this.getMapLayerOrder(mapId).filter(
        (layerPath) => this.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath)?.parentLayerConfig === undefined
      );

      // Build list of geoview layer configs
      const listOfGeoviewLayerConfig = layerOrder
        .map((layerPath) => this.#createGeoviewLayerConfig(mapId, layerPath, overrideGeocoreServiceNames))
        .filter((mapLayerEntry) => !!mapLayerEntry);

      // Get info for view
      const projection = this.getMapStateProtected(mapId).currentProjection;
      const currentView = this.getMapViewer(mapId).map.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjection, Projection.PROJECTION_NAMES.LONLAT)[0] as [
        number,
        number,
      ];

      // Set view settings
      const viewSettings: TypeViewSettings = {
        initialView: { zoomAndCenter: [currentView.getZoom() as number, centerLatLng] },
        homeView: this.getMapStateProtected(mapId).homeView,
        enableRotation: config.map.viewSettings.enableRotation !== undefined ? config.map.viewSettings.enableRotation : undefined,
        rotation: this.getMapStateProtected(mapId).rotation,
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: this.getGeoViewMapConfig(mapId)?.map.viewSettings.maxExtent ? MAP_EXTENTS[projection] : undefined,
        projection,
      };

      // Set map config settings
      const map: TypeMapConfig = {
        basemapOptions: this.getCurrentBasemapOptions(mapId),
        interaction: this.getMapInteraction(mapId),
        listOfGeoviewLayerConfig,
        highlightColor: config.map.highlightColor,
        overlayObjects: { pointMarkers: this.getPointMarkers(mapId) },
        viewSettings,
      };

      // Construct map config
      const newMapConfig: TypeMapFeaturesInstance = {
        map,
        theme: AppEventProcessor.getDisplayTheme(mapId),
        navBar: config.navBar,
        footerBar: config.footerBar,
        appBar: config.appBar,
        overviewMap: config.overviewMap,
        components: config.components,
        corePackages: config.corePackages,
        corePackagesConfig: config.corePackagesConfig,
        externalPackages: config.externalPackages,
        serviceUrls: config.serviceUrls,
        schemaVersionUsed: config.schemaVersionUsed,
        globalSettings: config.globalSettings,
      };

      // Set app bar tab settings
      if (newMapConfig.appBar) {
        newMapConfig.appBar.selectedTab = UIEventProcessor.getActiveAppBarTab(mapId).tabId as TypeValidAppBarCoreProps;
        newMapConfig.appBar.collapsed = !UIEventProcessor.getActiveAppBarTab(mapId).isOpen;

        const selectedDataTableLayerPath = DataTableEventProcessor.getSingleDataTableState(mapId, 'selectedLayerPath');
        if (selectedDataTableLayerPath) newMapConfig.appBar.selectedDataTableLayerPath = selectedDataTableLayerPath as string;
        const selectedLayerPath = LegendEventProcessor.getLayerPanelState(mapId, 'selectedLayerPath');
        if (selectedLayerPath) newMapConfig.appBar.selectedLayersLayerPath = selectedLayerPath as string;
      }

      // Set footer bar tab settings
      if (newMapConfig.footerBar) {
        newMapConfig.footerBar.selectedTab = UIEventProcessor.getActiveFooterBarTab(mapId) as TypeValidFooterBarTabsCoreProps;
        newMapConfig.footerBar.collapsed = UIEventProcessor.getFooterBarIsCollapsed(mapId);

        const selectedDataTableLayerPath = DataTableEventProcessor.getSingleDataTableState(mapId, 'selectedLayerPath');
        if (selectedDataTableLayerPath) newMapConfig.footerBar.selectedDataTableLayerPath = selectedDataTableLayerPath as string;
        const selectedLayerLayerPath = LegendEventProcessor.getLayerPanelState(mapId, 'selectedLayerPath');
        if (selectedLayerLayerPath) newMapConfig.footerBar.selectedLayersLayerPath = selectedLayerLayerPath as string;
        const selectedTimeSliderLayerPath = TimeSliderEventProcessor.getTimeSliderSelectedLayer(mapId);
        if (selectedTimeSliderLayerPath) newMapConfig.footerBar.selectedTimeSliderLayerPath = selectedTimeSliderLayerPath;
      }

      return newMapConfig;
    }

    return undefined;
  }

  /**
   * Searches through a map config and replaces any matching layer names with their provided partner.
   *
   * @param {string[][]} namePairs -  The array of name pairs. Presumably one english and one french name in each pair.
   * @param {TypeMapFeaturesInstance} mapConfig - The config to modify.
   * @param {boolean} removeUnlisted - Remove any layer name that doesn't appear in namePairs.
   * @returns {TypeMapFeaturesInstance} Map config with updated names.
   */
  static replaceMapConfigLayerNames(
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
      const layerName = layerEntryConfig.getLayerName();
      // If there's a name in pairsDict that matches
      if (layerName && pairsDict[layerName]) layerEntryConfig.setLayerName(pairsDict[layerName]);
      else if (removeUnlisted) layerEntryConfig.setLayerName('');
      if (layerEntryConfig.listOfLayerEntryConfig?.length)
        this.#replaceLayerEntryConfigNames(pairsDict, layerEntryConfig.listOfLayerEntryConfig, removeUnlisted);
    });
  }
  // #endregion
}
