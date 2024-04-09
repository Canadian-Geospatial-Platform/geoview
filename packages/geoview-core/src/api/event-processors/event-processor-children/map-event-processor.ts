import { Root } from 'react-dom/client';
import { ScaleLine } from 'ol/control';
import Overlay from 'ol/Overlay';
import { Extent } from 'ol/extent';
import View, { FitOptions } from 'ol/View';
import { KeyboardPan } from 'ol/interaction';
import { Coordinate } from 'ol/coordinate';
import { api } from '@/app';
import {
  TypeGeoviewLayerConfig,
  TypeHighlightColors,
  TypeInteraction,
  TypeLayerEntryConfig,
  TypeMapMouseInfo,
  TypeMapState,
  TypeValidMapProjectionCodes,
} from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { NORTH_POLE_POSITION, OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { whenThisThen } from '@/core/utils/utilities';
import { TypeFeatureInfoEntry, TypeGeometry } from '@/geo/utils/layer-set';

import { AppEventProcessor } from './app-event-processor';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeClickMarker } from '@/core/components';
import { TypeOrderedLayerInfo, TypeScaleInfo } from '@/core/stores';
import { TypeBasemapOptions, TypeBasemapProps } from '@/geo/layer/basemap/basemap-types';
import { TypeHoverFeatureInfo } from '@/geo/utils/hover-feature-info-layer-set';

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
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    const { mapId } = store.getState();

    // #region FEATURE SELECTION
    // Checks for changes to highlighted features and updates highlights
    const unsubMapHighlightedFeatures = store.subscribe(
      (state) => state.mapState.highlightedFeatures,
      (curFeatures, prevFeatures) => {
        // Log
        logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - highlightedFeatures', mapId, curFeatures);

        if (curFeatures.length === 0) api.maps[mapId].layer.featureHighlight.removeHighlight('all');
        else {
          const curFeatureUids = curFeatures.map((feature) => (feature.geometry as TypeGeometry).ol_uid);
          const prevFeatureUids = prevFeatures.map((feature) => (feature.geometry as TypeGeometry).ol_uid);
          const newFeatures = curFeatures.filter(
            (feature: TypeFeatureInfoEntry) => !prevFeatureUids.includes((feature.geometry as TypeGeometry).ol_uid)
          );
          const removedFeatures = prevFeatures.filter(
            (feature: TypeFeatureInfoEntry) => !curFeatureUids.includes((feature.geometry as TypeGeometry).ol_uid)
          );
          for (let i = 0; i < newFeatures.length; i++) api.maps[mapId].layer.featureHighlight.highlightFeature(newFeatures[i]);
          for (let i = 0; i < removedFeatures.length; i++)
            api.maps[mapId].layer.featureHighlight.removeHighlight((removedFeatures[i].geometry as TypeGeometry).ol_uid);
        }
      }
    );

    // #endregion FEATURE SELECTION

    const unsubOrderedLayerInfo = store.subscribe(
      (state) => state.mapState.orderedLayerInfo,
      (cur) => {
        // Log
        logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - orderedLaterInfo', mapId, cur);

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
  static async initMapControls(mapId: string): Promise<void> {
    // Log
    logger.logTraceCore('MAP EVENT PROCESSOR - initMapControls', mapId);

    // use api to access map because this function will set map element in store
    const { map } = api.maps[mapId];
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
    const projectionPosition = api.utilities.projection.transformFromLonLat(
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

    // Wait for the OpenLayers map to kick-start the scale control before saving the scale information in the store
    const scaleInfo = await this.getScaleInfoFromDomElement(mapId);

    // Save in the store
    store.getState().mapState.setterActions.setMapElement(map, map.getView().getZoom()!, scaleInfo);
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
   * @param {string} mapId The mapId
   * @returns {ILayerState} The Map state
   */
  protected static getMapStateProtected(mapId: string) {
    // TODO: Refactor - Rename this function when we want to clarify the small confusion with getMapState function below
    // Return the map state
    return this.getState(mapId).mapState;
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
      logger.logError("Couldn't retrieve the scale information from the dom tree", error);
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
   * @param {string} mapId the map id to retreive the config for
   * @returns {TypeMapFeaturesConfig | undefined} the map config or undefined if there is no config for this map id
   */
  static getGeoViewMapConfig(mapId: string): TypeMapFeaturesConfig | undefined {
    // Return the map config
    return this.getState(mapId).mapConfig;
  }

  static getBasemapOptions(mapId: string): TypeBasemapOptions {
    return this.getMapStateProtected(mapId).basemapOptions;
  }

  static getMapHighlightColor(mapId: string): string | undefined {
    return this.getMapStateProtected(mapId).highlightColor;
  }

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    // Project coords
    const projectedCoords = api.utilities.projection.transformPoints(
      [marker.lnglat],
      `EPSG:4326`,
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
    api.maps[mapId].layer.featureHighlight.highlightGeolocatorBBox(extent, isLayerHighlight);
  }

  static getMapInteraction(mapId: string): TypeInteraction {
    return this.getMapStateProtected(mapId).interaction;
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

  static setClickCoordinates(mapId: string, clickCoordinates: TypeMapMouseInfo): void {
    // Perform query via the feature info layer set process
    api.maps[mapId].layer.featureInfoLayerSet.queryLayers(clickCoordinates.lnglat);

    // Save in store
    this.getMapStateProtected(mapId).setterActions.setClickCoordinates(clickCoordinates);
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
    api.maps[mapId].map.getInteractions().forEach((x) => x.setActive(interaction === 'dynamic'));

    // Save in store
    this.getMapStateProtected(mapId).setterActions.setInteraction(interaction);
  }

  static async setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    try {
      // Set circular progress to hide basemap switching
      AppEventProcessor.setCircularProgress(mapId, true);

      // get view status (center and projection) to calculate new center
      const currentView = api.maps[mapId].map.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const newCenter = api.utilities.projection.transformPoints([currentCenter!], currentProjection, 'EPSG:4326')[0];
      const newProjection = projectionCode as TypeValidMapProjectionCodes;

      // create new view
      const newView = new View({
        zoom: currentView.getZoom() as number,
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        center: api.utilities.projection.transformPoints([newCenter], 'EPSG:4326', `EPSG:${newProjection}`)[0] as [number, number],
        projection: `EPSG:${newProjection}`,
      });

      // set new view
      api.maps[mapId].map.setView(newView);

      // use store action to set projection value in store and apply new view to the map
      this.getMapStateProtected(mapId).setterActions.setProjection(projectionCode);

      // reload the basemap from new projection
      this.resetBasemap(mapId);

      // refresh layers so new projection is render properly and await on it
      await api.maps[mapId].refreshLayers();
    } finally {
      // Remove circular progress as refresh is done
      AppEventProcessor.setCircularProgress(mapId, false);
    }
  }

  static rotate(mapId: string, rotation: number): void {
    // Do the actual view map rotation
    api.maps[mapId].map.getView().animate({ rotation });
    // GV No need to save in the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  static zoom(mapId: string, zoom: number, duration: number = OL_ZOOM_DURATION): void {
    // Do the actual zoom
    api.maps[mapId].map.getView().animate({ zoom, duration });
    // GV No need to save in the store, because this will trigger an event on MapViewer which will take care of updating the store
  }

  static getMapOrderedLayerInfo(mapId: string): TypeOrderedLayerInfo[] {
    return this.getMapStateProtected(mapId).orderedLayerInfo;
  }

  static getMapIndexFromOrderedLayerInfo(mapId: string, layerPath: string): number {
    // Get index of a layer
    const info = this.getMapStateProtected(mapId).orderedLayerInfo;
    for (let i = 0; i < info.length; i++) if (info[i].layerPath === layerPath) return i;
    return -1;
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

  static setMapHighlightColor(mapId: string, color: TypeHighlightColors): void {
    // Save in store
    this.getMapStateProtected(mapId).setterActions.setHighlightColor(color);
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

  static setOrToggleMapLayerVisibility(mapId: string, layerPath: string, newValue?: boolean): void {
    // Apply some visibility logic
    const curOrderedLayerInfo = this.getMapStateProtected(mapId).orderedLayerInfo;
    const layerVisibility = this.getMapVisibilityFromOrderedLayerInfo(mapId, layerPath);
    const layerInfos = curOrderedLayerInfo.filter((info) => info.layerPath.startsWith(layerPath));
    const parentLayerPathArray = layerPath.split('/');
    parentLayerPathArray.pop();
    const parentLayerPath = parentLayerPathArray.join('/');
    const parentLayerInfo = curOrderedLayerInfo.find((info) => info.layerPath === parentLayerPath);

    layerInfos.forEach((layerInfo) => {
      if (layerInfo) {
        // eslint-disable-next-line no-param-reassign
        layerInfo!.visible = newValue || !layerVisibility;
        api.maps[mapId].layer.geoviewLayer(layerInfo.layerPath).setVisible(layerInfo.visible, layerInfo.layerPath);
      }
    });

    if (parentLayerInfo !== undefined) {
      const parentLayerVisibility = this.getMapVisibilityFromOrderedLayerInfo(mapId, parentLayerPath);
      if ((!layerVisibility || newValue) && parentLayerVisibility === false) {
        if (parentLayerInfo) {
          parentLayerInfo.visible = true;
          api.maps[mapId].layer.geoviewLayer(parentLayerPath).setVisible(true, parentLayerPath);
        }
      }
      const children = curOrderedLayerInfo.filter(
        (info) => info.layerPath.startsWith(parentLayerPath) && info.layerPath !== parentLayerPath
      );
      if (!children.some((child) => child.visible === true)) this.setOrToggleMapLayerVisibility(mapId, parentLayerPath, false);
    }

    // Redirect
    this.getMapStateProtected(mapId).setterActions.setOrderedLayerInfo([...curOrderedLayerInfo]);
  }

  static reorderLayer(mapId: string, layerPath: string, move: number): void {
    // Apply some ordering logic
    const direction = move < 0 ? -1 : 1;
    let absoluteMoves = Math.abs(move);
    const orderedLayers = [...this.getMapStateProtected(mapId).orderedLayerInfo];
    let startingIndex = -1;
    for (let i = 0; i < orderedLayers.length; i++) if (orderedLayers[i].layerPath === layerPath) startingIndex = i;
    const layerInfo = orderedLayers[startingIndex];
    const movedLayers = orderedLayers.filter((layer) => layer.layerPath.startsWith(layerPath));
    orderedLayers.splice(startingIndex, movedLayers.length);
    let nextIndex = startingIndex;
    const pathLength = layerInfo.layerPath.split('/').length;
    while (absoluteMoves > 0) {
      nextIndex += direction;
      if (nextIndex === orderedLayers.length || nextIndex === 0) {
        absoluteMoves = 0;
      } else if (orderedLayers[nextIndex].layerPath.split('/').length === pathLength) absoluteMoves--;
    }
    orderedLayers.splice(nextIndex, 0, ...movedLayers);

    // Redirect
    this.setMapOrderedLayerInfo(mapId, orderedLayers);
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
    const newOrderedLayerInfo = api.maps[mapId].layer.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
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
    const newOrderedLayerInfo = api.maps[mapId].layer.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
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
  // #region
  static createEmptyBasemap(mapId: string) {
    return api.maps[mapId].basemap.createEmptyBasemap();
  }

  static createOverviewMapBasemap(mapId: string): TypeBasemapProps | undefined {
    return api.maps[mapId].basemap.getOverviewMap();
  }

  static resetBasemap(mapId: string) {
    // reset basemap will use the current display language and projection and recreate the basemap
    const language = AppEventProcessor.getDisplayLanguage(mapId);
    const projection = this.getMapState(mapId).currentProjection as TypeValidMapProjectionCodes;
    api.maps[mapId].basemap.loadDefaultBasemaps(projection, language);
  }

  static setMapKeyboardPanInteractions(mapId: string, panDelta: number): void {
    const mapElement = api.maps[mapId].map;

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
    api.maps[mapId].overviewRoot = overviewRoot;
  }

  /**
   * Zoom to the specified extent.
   *
   * @param {string} mapId The map id.
   * @param {Extent} extent The extent to zoom to.
   * @param {FitOptions} options The options to configure the zoomToExtent (default: { padding: [100, 100, 100, 100], maxZoom: 11 }).
   */
  static zoomToExtent(
    mapId: string,
    extent: Extent,
    options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: 11, duration: 1000 }
  ): Promise<void> {
    // store state will be updated by map event
    api.maps[mapId].getView().fit(extent, options);

    // Use a Promise and resolve it when the duration expired
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, (options.duration || 1000) + 150);
    });
    // The +150 is to make sure the logic before turning these function async remains
    // TODO: Refactor - Check the +150 relevancy and try to remove it by clarifying the reason for its existance
  }

  static async zoomToGeoLocatorLocation(mapId: string, coords: Coordinate, bbox?: Extent): Promise<void> {
    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box') as HTMLCollectionOf<Element>;
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }

    const projectionConfig = api.utilities.projection.projections[this.getMapState(mapId).currentProjection];
    if (bbox) {
      // GV There were issues with fromLonLat in rare cases in LCC projections, transformExtent seems to solve them.
      // GV fromLonLat and transformExtent give differing results in many cases, fromLonLat had issues with the first
      // GV three results from a geolocator search for "vancouver river"
      const convertedExtent = api.utilities.projection.transformExtent(bbox, 'EPSG:4326', projectionConfig);

      // Highlight
      api.maps[mapId].layer.featureHighlight.highlightGeolocatorBBox(convertedExtent);

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
      const projectedCoords = api.utilities.projection.transformPoints(
        [coords],
        `EPSG:4326`,
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

  static zoomToInitialExtent(mapId: string): Promise<void> {
    const { center, zoom } = getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings;
    const projectedCoords = api.utilities.projection.transformPoints(
      [center],
      `EPSG:4326`,
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );
    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: zoom, duration: OL_ZOOM_DURATION };

    return this.zoomToExtent(mapId, extent, options);
  }

  static zoomToMyLocation(mapId: string, position: GeolocationPosition): Promise<void> {
    const coord: Coordinate = [position.coords.longitude, position.coords.latitude];
    const projectedCoords = api.utilities.projection.transformPoints(
      [coord],
      `EPSG:4326`,
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

    return this.zoomToExtent(mapId, extent, options);
  }

  /**
   * Set Z index for layers
   *
   * @param {string} mapId Id of map to set layer Z indices
   */
  static setLayerZIndices = (mapId: string) => {
    const reversedLayers = [...this.getMapStateProtected(mapId).orderedLayerInfo].reverse();
    reversedLayers.forEach((orderedLayerInfo, index) => {
      if (api.maps[mapId].layer.registeredLayers[orderedLayerInfo.layerPath]?.olLayer)
        api.maps[mapId].layer.registeredLayers[orderedLayerInfo.layerPath].olLayer?.setZIndex(index + 10);
    });
  };

  static getPixelFromCoordinate = (mapId: string, coord: Coordinate): [number, number] => {
    return api.maps[mapId].map.getPixelFromCoordinate(coord) as unknown as [number, number];
  };

  static setClickMarkerOnPosition = (mapId: string, position: number[]) => {
    api.maps[mapId].map.getOverlayById(`${mapId}-clickmarker`)!.setPosition(position);
  };

  // #endregion
}
