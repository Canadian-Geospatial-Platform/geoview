import { Root } from 'react-dom/client';
import { ScaleLine } from 'ol/control';
import Overlay from 'ol/Overlay';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';
import { KeyboardPan } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';

import { CV_MAP_EXTENTS } from '@config/types/config-constants';
import {
  TypeBasemapOptions,
  TypeInteraction,
  TypeLayerInitialSettings,
  TypeValidAppBarCoreProps,
  TypeValidFooterBarTabsCoreProps,
  TypeValidMapProjectionCodes,
  TypeViewSettings,
} from '@config/types/map-schema-types';
import { api } from '@/app';
import { LayerApi } from '@/geo/layer/layer';
import { MapViewer, TypeMapState, TypeMapMouseInfo } from '@/geo/map/map-viewer';
import {
  MapConfigLayerEntry,
  TypeFeatureInfoEntry,
  TypeGeometry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  TypeMapConfig,
} from '@/geo/map/map-schema-types';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { Projection } from '@/geo/utils/projection';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { NORTH_POLE_POSITION, OL_ZOOM_DURATION, OL_ZOOM_MAXZOOM, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { whenThisThen } from '@/core/utils/utilities';

import { AppEventProcessor } from './app-event-processor';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { DataTableEventProcessor } from './data-table-event-processor';
import { TimeSliderEventProcessor } from './time-slider-event-processor';
import { UIEventProcessor } from './ui-event-processor';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeClickMarker } from '@/core/components';
import { IMapState, TypeOrderedLayerInfo, TypeScaleInfo } from '@/core/stores/store-interface-and-intial-values/map-state';
import { TypeFeatureInfoResultSet, TypeHoverFeatureInfo } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { TypeBasemapProps } from '@/geo/layer/basemap/basemap-types';
import { LegendEventProcessor } from './legend-event-processor';
import { TypeLegendLayer } from '@/core/components/layers/types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';

import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { AbstractGeoViewVector } from '@/geo/layer/geoview-layers/vector/abstract-geoview-vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';

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
   * Override the initialization process to register store subscriptions handlers and return them so they can be destroyed later.
   */
  protected override onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    const { mapId } = store.getState();

    // #region FEATURE SELECTION
    // Checks for changes to highlighted features and updates highlights
    const unsubMapHighlightedFeatures = store.subscribe(
      (state) => state.mapState.highlightedFeatures,
      (curFeatures, prevFeatures) => {
        // Log
        logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - highlightedFeatures', mapId, curFeatures);

        if (curFeatures.length === 0) MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.removeHighlight('all');
        else {
          const curFeatureUids = curFeatures.map((feature) => (feature.geometry as TypeGeometry).ol_uid);
          const prevFeatureUids = prevFeatures.map((feature) => (feature.geometry as TypeGeometry).ol_uid);
          const newFeatures = curFeatures.filter(
            (feature: TypeFeatureInfoEntry) => !prevFeatureUids.includes((feature.geometry as TypeGeometry).ol_uid)
          );
          const removedFeatures = prevFeatures.filter(
            (feature: TypeFeatureInfoEntry) => !curFeatureUids.includes((feature.geometry as TypeGeometry).ol_uid)
          );
          for (let i = 0; i < newFeatures.length; i++)
            MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.highlightFeature(newFeatures[i]);
          for (let i = 0; i < removedFeatures.length; i++)
            MapEventProcessor.getMapViewerLayerAPI(mapId).featureHighlight.removeHighlight(
              (removedFeatures[i].geometry as TypeGeometry).ol_uid
            );
        }
      }
    );

    // #endregion FEATURE SELECTION

    const unsubOrderedLayerInfo = store.subscribe(
      (state) => state.mapState.orderedLayerInfo,
      (cur) => {
        // Log
        logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - orderedLayerInfo', mapId, cur);

        const curVisibleLayers = cur
          .map((layerInfo) => {
            if (layerInfo.visible) return layerInfo.layerPath;
            return undefined;
          })
          .filter((layerPath) => layerPath);
        const prevVisibleLayers = [...store.getState().mapState.visibleLayers];
        if (JSON.stringify(prevVisibleLayers) !== JSON.stringify(curVisibleLayers))
          store.getState().mapState.setterActions.setVisibleLayers(curVisibleLayers as string[]);
      }
    );

    // Return the array of subscriptions so they can be destroyed later
    return [unsubMapHighlightedFeatures, unsubOrderedLayerInfo];
  }

  /**
   * Initializes the map controls
   * @param {string} mapId - The map id being initialized
   */
  static initMapControls(mapId: string): void {
    // Log
    logger.logTraceCore('MAP EVENT PROCESSOR - initMapControls', mapId);

    // use api to access map because this function will set map element in store
    const { map } = this.getMapViewer(mapId);
    const store = getGeoViewStore(mapId);

    // add map controls (scale)
    const scaleBar = new ScaleLine({
      units: 'metric',
      target: document.getElementById(`${mapId}-scaleControlBar`) as HTMLElement,
      bar: true,
      text: true,
    });

    const scaleLine = new ScaleLine({
      units: 'metric',
      target: document.getElementById(`${mapId}-scaleControlLine`) as HTMLElement,
    });
    map.addControl(scaleLine);
    map.addControl(scaleBar);

    // add map overlays
    // create overlay for north pole icon
    const northPoleId = `${mapId}-northpole`;
    const projectionPosition = Projection.transformFromLonLat(
      [NORTH_POLE_POSITION[1], NORTH_POLE_POSITION[0]],
      `EPSG:${store.getState().mapState.currentProjection}`
    );

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
   * This is use to reduce the use of api.maps[mapId] and be more explicit
   * @param {string} mapId - map Id
   * @returns {MapViewer} The Map viewer instance
   */
  static getMapViewer(mapId: string): MapViewer {
    return api.maps[mapId];
  }

  /**
   * Shortcut to get the Map Viewer layer api instance for a given map id
   * This is use to reduce the use of api.maps[mapId].layer and be more explicit
   * @param {string} mapId - map Id
   * @returns {LayerApi} The Map viewer layer API instance
   */
  static getMapViewerLayerAPI(mapId: string): LayerApi {
    return api.maps[mapId].layer;
  }

  /**
   * Shortcut to get the Map Viewer plugins instance for a given map id
   * This is use to reduce the use of api.maps[mapId].plugins and be more explicit
   * @param {string} mapId - map Id
   * @returns {TypeRecordOfPlugin} The map plugins record
   */
  static async getMapViewerPlugins(mapId: string): Promise<TypeRecordOfPlugin> {
    try {
      // Check if the plugins exist
      // TODO: if you run the code fast enough (only happened to me in the TimeSliderEventProcessor),
      // TO.DOCONT: the getMapViewer should be async, because it can be unset as well ( so not just getMapViewerPlugins() ).
      await whenThisThen(() => api && api.maps && api.maps[mapId] && api.maps[mapId].plugins);
    } catch (error) {
      // Log
      logger.logError(`Couldn't retrieve the plugins instance on Map Viewer`, error);
    }

    return api.maps[mapId].plugins;
  }

  /**
   * Asynchronously retrieves the scale information as read from the Dom element for the given map id
   * @param {string} mapId The mapId
   * @returns {Promise<TypeScaleInfo>} A Promise to receive scale information when the dom has it
   */
  static async getScaleInfoFromDomElement(mapId: string): Promise<TypeScaleInfo> {
    try {
      // Check if the scaleControl exists and is showing information, wait for it
      await whenThisThen(
        () =>
          document.getElementById(`${mapId}-scaleControlLine`)?.querySelector('.ol-scale-line-inner') &&
          document.getElementById(`${mapId}-scaleControlBar`)?.querySelector('.ol-scale-text')
      );
    } catch (error) {
      // Log
      logger.logError(`Couldn't retrieve the scale information from the dom tree`, error);
      // TODO: Check - Maybe we want to actually throw the exception here? Logging only for now until couple maps get tested.
      // throw error;
    }

    const scaleControlLineInnerElement = document
      .getElementById(`${mapId}-scaleControlLine`)
      ?.querySelector('.ol-scale-line-inner') as HTMLElement;
    const lineWidth = scaleControlLineInnerElement?.style.width;
    const labelGraphic = scaleControlLineInnerElement?.innerHTML;

    const scaleControlBarInnerElement = document.getElementById(`${mapId}-scaleControlBar`)?.querySelector('.ol-scale-text') as HTMLElement;
    const labelNumeric = scaleControlBarInnerElement?.innerHTML;

    return { lineWidth, labelGraphic, labelNumeric };
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
    return this.getMapStateProtected(mapId).basemapOptions;
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

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    // Project coords
    const projectedCoords = Projection.transformPoints(
      [marker.lnglat],
      Projection.PROJECTION_NAMES.LNGLAT,
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
      currentProjection: mapState.currentProjection as TypeValidMapProjectionCodes,
      currentZoom: mapState.zoom,
      mapCenterCoordinates: mapState.centerCoordinates,
      pointerPosition: mapState.pointerPosition || {
        pixel: [],
        lnglat: [],
        projected: [],
        dragging: false,
      },
      singleClickedPosition: mapState.clickCoordinates || {
        pixel: [],
        lnglat: [],
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

  static setMapPointerPosition(mapId: string, pointerPosition: TypeMapMouseInfo): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setPointerPosition(pointerPosition);
  }

  static setClickCoordinates(mapId: string, clickCoordinates: TypeMapMouseInfo): Promise<TypeFeatureInfoResultSet> {
    // Perform query via the feature info layer set process
    const promise = this.getMapViewerLayerAPI(mapId).featureInfoLayerSet.queryLayers(clickCoordinates.lnglat);

    // Save in store
    this.getMapStateProtected(mapId).setterActions.setClickCoordinates(clickCoordinates);

    // Return the promise
    return promise;
  }

  static setZoom(mapId: string, zoom: number): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setZoom(zoom);
  }

  static setRotation(mapId: string, rotation: number): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setRotation(rotation);
  }

  static setMapChangeSize(mapId: string, size: [number, number], scale: TypeScaleInfo): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapChangeSize(size, scale);
  }

  static setMapMoveEnd(
    mapId: string,
    centerCoordinates: Coordinate,
    pointerPosition: TypeMapMouseInfo,
    degreeRotation: string,
    isNorthVisible: boolean,
    scale: TypeScaleInfo
  ): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setMapMoveEnd(centerCoordinates, pointerPosition, degreeRotation, isNorthVisible, scale);
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
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjection, Projection.PROJECTION_NAMES.LNGLAT)[0] as [
        number,
        number
      ];
      const newProjection = projectionCode as TypeValidMapProjectionCodes;

      // If maxExtent was provided, apply
      // GV The extent is different between LCC and WM and switching from one to the other may introduce weird constraint.
      // GV We may have to keep extent as array for configuration file but, technically, user does not change projection often.
      const mapMaxExtent = this.getGeoViewMapConfig(mapId)?.map.viewSettings.maxExtent ? CV_MAP_EXTENTS[newProjection] : undefined;

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

      // set new view
      this.getMapViewer(mapId).setView(newView);

      // reload the basemap from new projection
      await this.resetBasemap(mapId);

      // refresh layers so new projection is render properly and await on it
      await this.getMapViewer(mapId).refreshLayers();
    } finally {
      // Remove circular progress as refresh is done
      AppEventProcessor.setCircularProgress(mapId, false);
    }
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
  static getMapOrderedLayerInfoForLayer(mapId: string, layerPath: string): TypeOrderedLayerInfo | undefined {
    return this.getMapStateProtected(mapId).orderedLayerInfo.find((orderedLayerInfo) => orderedLayerInfo.layerPath === layerPath);
  }

  static getMapIndexFromOrderedLayerInfo(mapId: string, layerPath: string): number {
    // Get index of a layer
    const info = this.getMapStateProtected(mapId).orderedLayerInfo;
    for (let i = 0; i < info.length; i++) if (info[i].layerPath === layerPath) return i;
    return -1;
  }

  static getMapLegendCollapsedFromOrderedLayerInfo(mapId: string, layerPath: string): boolean {
    // Get legend status of a layer
    const info = this.getMapStateProtected(mapId).orderedLayerInfo;
    const pathInfo = info.find((item) => item.layerPath === layerPath);
    return pathInfo?.legendCollapsed !== false;
  }

  static getMapVisibilityFromOrderedLayerInfo(mapId: string, layerPath: string): boolean {
    // Get visibility of a layer
    const info = this.getMapStateProtected(mapId).orderedLayerInfo;
    const pathInfo = info.find((item) => item.layerPath === layerPath);
    return pathInfo?.visible !== false;
  }

  static addHighlightedFeature(mapId: string, feature: TypeFeatureInfoEntry): void {
    if (feature.geoviewLayerType !== CONST_LAYER_TYPES.WMS) {
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
      const highlightedFeatures =
        feature === 'all'
          ? []
          : this.getMapStateProtected(mapId).highlightedFeatures.filter(
              (featureInfoEntry: TypeFeatureInfoEntry) =>
                (featureInfoEntry.geometry as TypeGeometry).ol_uid !== (feature.geometry as TypeGeometry).ol_uid
            );

      // Save in store
      this.getMapStateProtected(mapId).setterActions.setHighlightedFeatures(highlightedFeatures);
    }
  }

  /**
   * Update or remove the layer highlight.
   * @param {string} mapId - The ID of the map.
   * @param {string} layerPath - The layer path to set as the highlighted layer.
   * @param {string} hilightedLayerPath - The layer path of the currently highlighted layer.
   * @returns {string} The layer path of the highlighted layer.
   */
  static changeOrRemoveLayerHighlight(mapId: string, layerPath: string, hilightedLayerPath: string): string {
    // If layer is currently highlighted layer, remove highlight
    if (hilightedLayerPath === layerPath) {
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

  static setMapLegendCollapsed(mapId: string, layerPath: string, collapsed?: boolean): void {
    this.getMapStateProtected(mapId).setterActions.setLegendCollapsed(layerPath, collapsed);
  }

  static setOrToggleMapLayerVisibility(mapId: string, layerPath: string, newValue?: boolean): void {
    // Redirect to layerAPI
    this.getMapViewerLayerAPI(mapId).setOrToggleLayerVisibility(layerPath, newValue);
  }

  static setOrderedLayerInfoWithNoOrderChangeState(mapId: string, curOrderedLayerInfo: TypeOrderedLayerInfo[]): void {
    // Redirect
    this.getMapStateProtected(mapId).setterActions.setOrderedLayerInfo([...curOrderedLayerInfo]);
  }

  static reorderLayer(mapId: string, layerPath: string, move: number): void {
    // Redirect to state API
    api.maps[mapId].stateApi.reorderLayers(mapId, layerPath, move);
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
      ? `${(geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId}/${(geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId}`
      : (geoviewLayerConfig as TypeLayerEntryConfig).layerPath;
    const index = this.getMapIndexFromOrderedLayerInfo(mapId, layerPathToReplace || layerPath);
    const replacedLayers = orderedLayerInfo.filter((layerInfo) => layerInfo.layerPath.startsWith(layerPathToReplace || layerPath));
    const newOrderedLayerInfo = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    orderedLayerInfo.splice(index, replacedLayers.length, ...newOrderedLayerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Add a new layer to the front of the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to add the layer to.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The config of the layer to add.
   * @return {void}
   */
  static addOrderedLayerInfo(mapId: string, geoviewLayerConfig: TypeGeoviewLayerConfig | TypeLayerEntryConfig, index?: number): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const newOrderedLayerInfo = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    if (!index) orderedLayerInfo.unshift(...newOrderedLayerInfo);
    else orderedLayerInfo.splice(index, 0, ...newOrderedLayerInfo);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayerInfo);
  }

  /**
   * Remove a layer from the orderedLayerInfo array.
   *
   * @param {string} mapId The ID of the map to remove the layer from.
   * @param {string} layerPath The path of the layer to remove.
   * @return {void}
   */
  static removeOrderedLayerInfo(mapId: string, layerPath: string): void {
    const { orderedLayerInfo } = this.getMapStateProtected(mapId);
    const newOrderedLayerInfo = orderedLayerInfo.filter((layerInfo) => !layerInfo.layerPath.startsWith(layerPath));

    // Redirect
    this.setMapOrderedLayerInfo(mapId, newOrderedLayerInfo);
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
  static createOverviewMapBasemap(mapId: string): TypeBasemapProps | undefined {
    return this.getMapViewer(mapId).basemap.getOverviewMap();
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
    const basemap = await this.getMapViewer(mapId).basemap.createCoreBasemap(basemapOptions, projection, language);

    if (basemap) {
      this.getMapViewer(mapId).basemap.setBasemap(basemap);
      this.setCurrentBasemapOptions(mapId, basemapOptions);
    }
  }

  static setMapKeyboardPanInteractions(mapId: string, panDelta: number): void {
    const mapElement = this.getMapViewer(mapId).map;

    // replace the KeyboardPan interraction by a new one
    mapElement!.getInteractions().forEach((interactionItem) => {
      if (interactionItem instanceof KeyboardPan) {
        mapElement!.removeInteraction(interactionItem);
      }
    });
    mapElement!.addInteraction(new KeyboardPan({ pixelDelta: panDelta }));
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
    // Validate the extent coordinates
    if (
      !extent.some((number) => {
        return !number || Number.isNaN(number);
      })
    ) {
      // store state will be updated by map event
      this.getMapViewer(mapId).getView().fit(extent, options);

      // Use a Promise and resolve it when the duration expired
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, (options.duration || OL_ZOOM_DURATION) + 150);
      });
      // The +150 is to make sure the logic before turning these function async remains
      // TODO: Refactor - Check the +150 relevancy and try to remove it by clarifying the reason for its existance
    }

    // Invalid extent
    throw new Error(`Couldn't zoom to extent, invalid extent: ${extent}`);
  }

  static async zoomToGeoLocatorLocation(mapId: string, coords: Coordinate, bbox?: Extent): Promise<void> {
    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box') as HTMLCollectionOf<Element>;
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }

    const projectionConfig = Projection.PROJECTIONS[this.getMapState(mapId).currentProjection];
    if (bbox) {
      // GV There were issues with fromLonLat in rare cases in LCC projections, transformExtent seems to solve them.
      // GV fromLonLat and transformExtent give differing results in many cases, fromLonLat had issues with the first
      // GV three results from a geolocator search for "vancouver river"
      const convertedExtent = Projection.transformExtent(bbox, Projection.PROJECTION_NAMES.LNGLAT, projectionConfig);

      // Highlight
      this.getMapViewerLayerAPI(mapId).featureHighlight.highlightGeolocatorBBox(convertedExtent);

      // Zoom to extent and await
      await this.zoomToExtent(mapId, convertedExtent, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
        duration: OL_ZOOM_DURATION,
      });

      // Now show the click marker icon
      this.clickMarkerIconShow(mapId, { lnglat: coords });
      for (let i = 0; i < indicatorBox.length; i++) {
        (indicatorBox[i] as HTMLElement).style.display = '';
      }
    } else {
      const projectedCoords = Projection.transformPoints(
        [coords],
        Projection.PROJECTION_NAMES.LNGLAT,
        `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
      );

      const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
      const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

      // Zoom to extent and await
      await this.zoomToExtent(mapId, extent, options);

      // Now show the click marker icon
      this.clickMarkerIconShow(mapId, { lnglat: coords });
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
    let extent: Extent = CV_MAP_EXTENTS[currProjection];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, duration: OL_ZOOM_DURATION };

    // Transform center coordinates and update options if zoomAndCenter are in config
    if (getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView!.zoomAndCenter) {
      [options.maxZoom] = getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView!.zoomAndCenter!;

      const center = getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView!.zoomAndCenter![1];
      const projectedCoords = Projection.transformPoints([center], Projection.PROJECTION_NAMES.LNGLAT, `EPSG:${currProjection}`);

      extent = [...projectedCoords[0], ...projectedCoords[0]];
    }

    // If extent is in config, use it
    if (getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView?.extent)
      extent = getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView!.extent as Extent;

    // Get extents of provided layer IDs if available
    if (getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView?.layerIds) {
      const layerExtents = api.maps[mapId].layer.getExtentOfMultipleLayers(
        getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings.initialView?.layerIds
      );

      if (layerExtents) extent = layerExtents;
    }

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
      Projection.PROJECTION_NAMES.LNGLAT,
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

    return this.zoomToExtent(mapId, extent, options);
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

  static getPixelFromCoordinate = (mapId: string, coord: Coordinate): [number, number] => {
    return this.getMapViewer(mapId).map.getPixelFromCoordinate(coord) as unknown as [number, number];
  };

  static setClickMarkerOnPosition = (mapId: string, position: number[]): void => {
    this.getMapViewer(mapId).map.getOverlayById(`${mapId}-clickmarker`)!.setPosition(position);
  };

  /**
   * Creates layer initial settings according to provided configs.
   * @param {ConfigBaseClass} layerEntryConfig - Layer entry config for the layer.
   * @param {TypeOrderedLayerInfo} orderedLayerInfo - Ordered layer info for the layer.
   * @param {TypeLegendLayer} legendLayerInfo - Legend layer info for the layer.
   * @returns {TypeLayerInitialSettings} Initial settings object.
   */
  static getInitialSettings(
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
   * @returns {TypeLayerEntryConfig} Entry config object.
   */
  static createLayerEntryConfig(mapId: string, layerPath: string): TypeLayerEntryConfig {
    // Get needed info
    const layerEntryConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath);
    const orderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfoForLayer(mapId, layerPath);
    const legendLayerInfo = LegendEventProcessor.getLegendLayerInfo(mapId, layerPath);

    // Get original layerEntryConfig from map config
    const pathArray = layerPath.split('/');
    if (pathArray[0] === pathArray[1]) pathArray.splice(0, 1);
    const geoviewLayerConfig = MapEventProcessor.getGeoViewMapConfig(mapId)?.map.listOfGeoviewLayerConfig?.find(
      (layerConfig) => layerConfig.geoviewLayerId === pathArray[0]
    );

    let configLayerEntryConfig;
    if (geoviewLayerConfig) {
      configLayerEntryConfig = (geoviewLayerConfig as TypeGeoviewLayerConfig).listOfLayerEntryConfig.find(
        (nextEntryConfig: TypeLayerEntryConfig) => nextEntryConfig.layerId === pathArray[1]
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
    if (layerEntryConfig!.entryType === 'group') {
      const sublayerPaths = MapEventProcessor.getMapLayerOrder(mapId).filter(
        (entryLayerPath) => entryLayerPath.startsWith(layerPath) && entryLayerPath.split('/').length === layerPath.split('/').length + 1
      );
      sublayerPaths.forEach((sublayerPath) => listOfLayerEntryConfig.push(MapEventProcessor.createLayerEntryConfig(mapId, sublayerPath)));
    }

    // Get initial settings
    const initialSettings = this.getInitialSettings(layerEntryConfig!, orderedLayerInfo!, legendLayerInfo!);

    // Construct layer entry config
    const newLayerEntryConfig = {
      layerId: layerEntryConfig!.layerId,
      layerName: layerEntryConfig!.layerName,
      layerFilter: (configLayerEntryConfig as VectorLayerEntryConfig)?.layerFilter
        ? (configLayerEntryConfig as VectorLayerEntryConfig).layerFilter
        : undefined,
      initialSettings,
      style: legendLayerInfo!.styleConfig ? legendLayerInfo!.styleConfig : undefined,
      source: (layerEntryConfig! as VectorLayerEntryConfig).source ? (layerEntryConfig! as VectorLayerEntryConfig).source : undefined,
      entryType: listOfLayerEntryConfig.length ? 'group' : undefined,
      listOfLayerEntryConfig: listOfLayerEntryConfig.length ? listOfLayerEntryConfig : [],
    };

    // Only use feature info specified in original config, not drawn from services
    if (newLayerEntryConfig.source?.featureInfo) delete newLayerEntryConfig.source?.featureInfo;
    if (configLayerEntryConfig?.source?.featureInfo) newLayerEntryConfig.source!.featureInfo = configLayerEntryConfig.source.featureInfo;

    return newLayerEntryConfig as unknown as TypeLayerEntryConfig;
  }

  /**
   * Creates a geoview layer config based on current layer state.
   * @param {string} mapId - Id of map.
   * @param {string} layerPath - Path of the layer to create config for.
   * @returns {MapConfigLayerEntry} Geoview layer config object.
   */
  static createGeoviewLayerConfig(mapId: string, layerPath: string): MapConfigLayerEntry {
    // Get needed info
    const layerEntryConfig = MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath)!;
    const { geoviewLayerConfig } = layerEntryConfig;
    const orderedLayerInfo = MapEventProcessor.getMapOrderedLayerInfoForLayer(mapId, layerPath);
    const legendLayerInfo = LegendEventProcessor.getLegendLayerInfo(mapId, layerPath);

    // Check for sublayers
    const sublayerPaths = MapEventProcessor.getMapLayerOrder(mapId).filter(
      // We only want the immediate child layers, group sublayers will handle their own sublayers
      (entryLayerPath) => entryLayerPath.startsWith(layerPath) && entryLayerPath.split('/').length === layerPath.split('/').length + 1
    );

    // Build list of sublayer entry configs
    const listOfLayerEntryConfig: TypeLayerEntryConfig[] = [];
    if (sublayerPaths.length)
      sublayerPaths.forEach((sublayerPath) => listOfLayerEntryConfig.push(MapEventProcessor.createLayerEntryConfig(mapId, sublayerPath)));
    else listOfLayerEntryConfig.push(this.createLayerEntryConfig(mapId, layerPath));

    // Get initial settings
    const initialSettings = this.getInitialSettings(layerEntryConfig!, orderedLayerInfo!, legendLayerInfo!);

    // Construct geoview layer config
    const newGeoviewLayerConfig: MapConfigLayerEntry = {
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
   */
  static createMapConfigFromMapState(mapId: string): TypeMapFeaturesConfig | undefined {
    const config = MapEventProcessor.getGeoViewMapConfig(mapId);

    if (config) {
      // Get paths of top level layers
      const layerOrder = MapEventProcessor.getMapLayerOrder(mapId).filter(
        (layerPath) => MapEventProcessor.getMapViewerLayerAPI(mapId).getLayerEntryConfig(layerPath)?.parentLayerConfig === undefined
      );

      // Build list of geoview layer configs
      const listOfGeoviewLayerConfig = layerOrder.map((layerPath) => this.createGeoviewLayerConfig(mapId, layerPath));

      // Get info for view
      const projection = this.getMapState(mapId).currentProjection as TypeValidMapProjectionCodes;
      const currentView = this.getMapViewer(mapId).map.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const centerLatLng = Projection.transformPoints([currentCenter!], currentProjection, Projection.PROJECTION_NAMES.LNGLAT)[0] as [
        number,
        number
      ];

      // Set view settings
      const viewSettings: TypeViewSettings = {
        initialView: { zoomAndCenter: [currentView.getZoom() as number, centerLatLng] },
        enableRotation: config.map.viewSettings.enableRotation !== undefined ? config.map.viewSettings.enableRotation : undefined,
        rotation: this.getMapStateProtected(mapId).rotation,
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        maxExtent: this.getGeoViewMapConfig(mapId)?.map.viewSettings.maxExtent ? CV_MAP_EXTENTS[projection] : undefined,
        projection,
      };

      // Set map config settings
      const map: TypeMapConfig = {
        basemapOptions: this.getCurrentBasemapOptions(mapId),
        interaction: this.getMapInteraction(mapId),
        listOfGeoviewLayerConfig,
        highlightColor: config.map.highlightColor,
        viewSettings,
      };

      // Construct map config
      const newMapConfig: TypeMapFeaturesConfig = {
        mapId,
        map,
        theme: AppEventProcessor.getDisplayTheme(mapId),
        navBar: config.navBar,
        footerBar: config.footerBar,
        appBar: config.appBar,
        overviewMap: config.overviewMap,
        components: config.components,
        corePackages: config.corePackages,
        externalPackages: config.externalPackages,
        serviceUrls: config.serviceUrls,
        schemaVersionUsed: config.schemaVersionUsed,
      };

      // Set open app bar tab
      if (newMapConfig.appBar) {
        newMapConfig.appBar.selectedTab = UIEventProcessor.getActiveAppBarTab(mapId).tabGroup as TypeValidAppBarCoreProps;
        newMapConfig.appBar.collapsed = !UIEventProcessor.getActiveAppBarTab(mapId).isOpen;
      }

      // Set open footer bar tab
      if (newMapConfig.footerBar) {
        newMapConfig.footerBar.selectedTab = UIEventProcessor.getActiveFooterBarTab(mapId) as TypeValidFooterBarTabsCoreProps;
        newMapConfig.footerBar.collapsed = UIEventProcessor.getFooterBarIsCollapsed(mapId);
      }

      return newMapConfig;
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
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerHybrid(layerPath);
    if (geoviewLayer) {
      if (
        geoviewLayer instanceof WMS ||
        geoviewLayer instanceof GVWMS ||
        geoviewLayer instanceof EsriImage ||
        geoviewLayer instanceof GVEsriImage
      ) {
        const filter = TimeSliderEventProcessor.getTimeSliderFilter(mapId, layerPath);
        if (filter) geoviewLayer.applyViewFilter(layerPath, filter);
      } else {
        const filters = this.getActiveVectorFilters(mapId, layerPath);

        if (filters && filters.length)
          (geoviewLayer as AbstractGeoViewVector | AbstractGVVector | EsriDynamic | GVEsriDynamic).applyViewFilter(
            layerPath,
            filters.join(' and ')
          );
      }
    }
  }

  /**
   * Get all active filters for layer.
   *
   * @param {string} mapId The map id.
   * @param {string} layerPath The path for the layer to get filters from.
   */
  static getActiveVectorFilters(mapId: string, layerPath: string): (string | undefined)[] | undefined {
    const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(mapId).getGeoviewLayerHybrid(layerPath);
    if (geoviewLayer) {
      const initialFilter = this.getInitialFilter(mapId, layerPath);
      const tableFilter = DataTableEventProcessor.getTableFilter(mapId, layerPath);
      const sliderFilter = TimeSliderEventProcessor.getTimeSliderFilter(mapId, layerPath);
      return [initialFilter, tableFilter, sliderFilter].filter((filter) => filter);
    }
    return undefined;
  }

  // #endregion
}
