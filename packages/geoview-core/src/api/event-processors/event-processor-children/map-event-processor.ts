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
  TypeMapState,
  TypeValidMapProjectionCodes,
} from '@/geo/map/map-schema-types';
import { lngLatPayload, mapMouseEventPayload, numberPayload, mapViewProjectionPayload } from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { NORTH_POLE_POSITION, OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { TypeFeatureInfoEntry, TypeGeometry } from '@/geo/utils/layer-set';

import { AppEventProcessor } from './app-event-processor';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeBasemapOptions, TypeBasemapProps, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeClickMarker } from '@/core/components';
import { TypeOrderedLayerInfo } from '@/core/stores';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

export class MapEventProcessor extends AbstractEventProcessor {
  /**
   * Override the initialization process to wire subscriptions and return them so they can be destroyed later.
   */
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    const { mapId } = store.getState();

    // TODO: Refactor - We should remove all the api.event.emits from the Processor and place them
    // TO.DOCONT: where they belong, closer to their respective classes, in those examples, the MAP.
    // TO.DOCONT: Only use store subscriptions at the processor level to maintain a
    // TO.DOCONT: store state internally and, eventually, use them to order the state changes to reduce
    // TO.DOCONT: possible component refreshes.

    // #region MAP STATE
    const unsubMapCenterCoord = store.subscribe(
      (state) => state.mapState.centerCoordinates,
      (cur, prev) => {
        if (cur !== prev) {
          // Log (too annoying, already have trace in EVENT_MAP_MOVE_END handler that works well)
          // logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - centerCoordinates (changed)', mapId, cur);

          api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, mapId, cur));
        }
      }
    );

    const unsubMapPointerPosition = store.subscribe(
      (state) => state.mapState.pointerPosition,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          // Log (too annoying, already have trace in EVENT_MAP_POINTER_MOVE handler that works well)
          // logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - pointerPosition (changed)', mapId, cur);

          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, mapId, cur));
        }
      }
    );

    const unsubMapProjection = store.subscribe(
      (state) => state.mapState.currentProjection,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          // Log (this event is raised, and we currently have no handles for it, by design)
          logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - currentProjection (changed)', mapId, cur);

          api.event.emit(mapViewProjectionPayload(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, cur!));
        }
      }
    );

    const unsubMapSingleClick = store.subscribe(
      (state) => state.mapState.clickCoordinates,
      (cur, prev) => {
        if (cur && cur !== prev) {
          // Log (too annoying, already have trace in EVENT_MAP_SINGLE_CLICK handler that works well)
          // logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - currentProjection (changed)', mapId, cur);

          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId, cur));
        }
      }
    );

    const unsubMapZoom = store.subscribe(
      (state) => state.mapState.zoom,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          // Log
          logger.logTraceCoreStoreSubscription('MAP EVENT PROCESSOR - zoom (changed)', mapId, cur);

          api.event.emit(numberPayload(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, mapId, cur));
        }
      }
    );
    // #endregion MAP STATE

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
          store.getState().mapState.actions.setVisibleLayers(curVisibleLayers as string[]);
      }
    );

    // Return the array of subscriptions so they can be destroyed later
    return [
      unsubMapHighlightedFeatures,
      unsubMapCenterCoord,
      unsubMapPointerPosition,
      unsubMapProjection,
      unsubOrderedLayerInfo,
      unsubMapZoom,
      unsubMapSingleClick,
    ];
  }

  // GV THIS IS THE ONLY FUNCTION TO SET STORE DIRECTLY
  static setMapLoaded(mapId: string): void {
    // Log
    logger.logTraceCore('MAP EVENT PROCESSOR - setMapLoaded', mapId);

    // use api to access map because this function will set map element in store
    const { map } = api.maps[mapId];
    const store = getGeoViewStore(mapId);

    // initialize store OpenLayers events
    // TODO: destroy events on map destruction
    map.on('change:size', store.getState().mapState.events.onMapChangeSize);
    map.on('moveend', store.getState().mapState.events.onMapMoveEnd);

    // If not on a static map, wire handlers on pointermove and singleclick
    if (store.getState().mapState.interaction !== 'static') {
      map.on('pointermove', store.getState().mapState.events.onMapPointerMove);
      map.on('singleclick', store.getState().mapState.events.onMapSingleClick);
    }

    map.getView().on('change:resolution', store.getState().mapState.events.onMapZoomEnd);
    map.getView().on('change:rotation', store.getState().mapState.events.onMapRotation);

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
    const projectionPosition = api.projection.transformFromLonLat(
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

    // set autofocus/blur on mouse enter/leave the map so user can scroll (zoom) without having to click the map
    const mapHTMLElement = map.getTargetElement();
    mapHTMLElement.addEventListener('wheel', () => mapHTMLElement.focus());
    mapHTMLElement.addEventListener('mouseleave', () => mapHTMLElement.blur());

    // set store
    store.getState().mapState.actions.setMapElement(map);
    store.getState().mapState.actions.setOverlayNorthMarker(northPoleMarker);
    store.getState().mapState.actions.setOverlayClickMarker(clickMarkerOverlay);
    map.dispatchEvent('change:size'); // dispatch event to set initial value

    // set map interaction
    MapEventProcessor.setInteraction(mapId, store.getState().mapState.interaction);
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

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

  static clickMarkerIconHide(mapId: string): void {
    this.getMapStateProtected(mapId).actions.hideClickMarker();
  }

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    this.getMapStateProtected(mapId).actions.showClickMarker(marker);
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
    this.getMapStateProtected(mapId).actions.setAttribution(attribution);
  }

  static setInteraction(mapId: string, interaction: TypeInteraction): void {
    this.getMapStateProtected(mapId).actions.setInteraction(interaction);
  }

  static async setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): Promise<void> {
    try {
      // Set circular progress to hide basemap switching
      getGeoViewStore(mapId).getState().appState.actions.setCircularProgress(true);

      // get view status (center and projection) to calculate new center
      const currentView = api.maps[mapId].map.getView();
      const currentCenter = currentView.getCenter();
      const currentProjection = currentView.getProjection().getCode();
      const newCenter = api.projection.transformPoints([currentCenter!], currentProjection, 'EPSG:4326')[0];
      const newProjection = projectionCode as TypeValidMapProjectionCodes;

      // create new view
      const newView = new View({
        zoom: currentView.getZoom() as number,
        minZoom: currentView.getMinZoom(),
        maxZoom: currentView.getMaxZoom(),
        center: api.projection.transformPoints([newCenter], 'EPSG:4326', `EPSG:${newProjection}`)[0] as [number, number],
        projection: `EPSG:${newProjection}`,
      });

      // use store action to set projection value in store and apply new view to the map
      this.getMapStateProtected(mapId).actions.setProjection(projectionCode, newView);

      // refresh layers so new projection is render properly and await on it
      await api.maps[mapId].refreshLayers();
    } finally {
      // Remove circular progress as refresh is done
      getGeoViewStore(mapId).getState().appState.actions.setCircularProgress(false);
    }
  }

  static rotate(mapId: string, rotation: number): void {
    this.getMapStateProtected(mapId).actions.setRotation(rotation);
  }

  static zoom(mapId: string, zoom: number): void {
    this.getMapStateProtected(mapId).actions.setZoom(zoom, OL_ZOOM_DURATION);
  }

  static getMapIndexFromOrderedLayerInfo(mapId: string, layerPath: string): number {
    return this.getMapStateProtected(mapId).actions.getIndexFromOrderedLayerInfo(layerPath);
  }

  static getMapOrderedLayerInfo(mapId: string): TypeOrderedLayerInfo[] {
    return this.getMapStateProtected(mapId).orderedLayerInfo;
  }

  static getMapVisibilityFromOrderedLayerInfo(mapId: string, layerPath: string): boolean {
    return this.getMapStateProtected(mapId).actions.getVisibilityFromOrderedLayerInfo(layerPath);
  }

  static setMapHighlightColor(mapId: string, color: TypeHighlightColors): void {
    this.getMapStateProtected(mapId).actions.setHighlightColor(color);
  }

  static setMapLayerHoverable(mapId: string, layerPath: string, hoverable: boolean): void {
    this.getMapStateProtected(mapId).actions.setHoverable(layerPath, hoverable);
  }

  static setMapOrderedLayerInfo(mapId: string, orderedLayerInfo: TypeOrderedLayerInfo[]): void {
    this.getMapStateProtected(mapId).actions.setOrderedLayerInfo(orderedLayerInfo);
  }

  static setMapLayerQueryable(mapId: string, layerPath: string, queryable: boolean): void {
    this.getMapStateProtected(mapId).actions.setQueryable(layerPath, queryable);
  }

  static setOrToggleMapVisibility(mapId: string, layerPath: string, newValue?: boolean): void {
    this.getMapStateProtected(mapId).actions.setOrToggleLayerVisibility(layerPath, newValue);
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
    const layerPath =
      'geoviewLayerId' in geoviewLayerConfig
        ? `${geoviewLayerConfig.geoviewLayerId}/${(geoviewLayerConfig as TypeGeoviewLayerConfig).geoviewLayerId}`
        : geoviewLayerConfig.layerPath;
    const index = this.getMapIndexFromOrderedLayerInfo(mapId, layerPathToReplace || layerPath);
    const replacedLayers = orderedLayerInfo.filter((layerInfo) => layerInfo.layerPath.startsWith(layerPathToReplace || layerPath));
    const newOrderedLayerInfo = api.maps[mapId].layer.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
    orderedLayerInfo.splice(index, replacedLayers.length, ...newOrderedLayerInfo);
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
    const projection = MapEventProcessor.getMapState(mapId).currentProjection as TypeValidMapProjectionCodes;
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

    const projectionConfig = api.projection.projections[MapEventProcessor.getMapState(mapId).currentProjection];
    if (bbox) {
      // GV There were issues with fromLonLat in rare cases in LCC projections, transformExtent seems to solve them.
      // GV fromLonLat and transformExtent give differing results in many cases, fromLonLat had issues with the first
      // GV three results from a geolocator search for "vancouver river"
      const convertedExtent = api.projection.transformExtent(bbox, 'EPSG:4326', projectionConfig);

      // Highlight
      api.maps[mapId].layer.featureHighlight.highlightGeolocatorBBox(convertedExtent);

      // Zoom to extent and await
      await MapEventProcessor.zoomToExtent(mapId, convertedExtent, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
        duration: OL_ZOOM_DURATION,
      });

      // Now show the click marker icon
      MapEventProcessor.clickMarkerIconShow(mapId, { lnglat: coords });
      for (let i = 0; i < indicatorBox.length; i++) {
        (indicatorBox[i] as HTMLElement).style.display = '';
      }
    } else {
      const projectedCoords = api.projection.transformPoints(
        [coords],
        `EPSG:4326`,
        `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
      );

      const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
      const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

      // Zoom to extent and await
      await MapEventProcessor.zoomToExtent(mapId, extent, options);

      // Now show the click marker icon
      MapEventProcessor.clickMarkerIconShow(mapId, { lnglat: coords });
      for (let i = 0; i < indicatorBox.length; i++) {
        (indicatorBox[i] as HTMLElement).style.display = '';
      }
    }
  }

  static zoomToInitialExtent(mapId: string): Promise<void> {
    const { center, zoom } = getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings;
    const projectedCoords = api.projection.transformPoints(
      [center],
      `EPSG:4326`,
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );
    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: zoom, duration: OL_ZOOM_DURATION };

    return MapEventProcessor.zoomToExtent(mapId, extent, options);
  }

  static zoomToMyLocation(mapId: string, position: GeolocationPosition): Promise<void> {
    const coord: Coordinate = [position.coords.longitude, position.coords.latitude];
    const projectedCoords = api.projection.transformPoints(
      [coord],
      `EPSG:4326`,
      `EPSG:${this.getMapStateProtected(mapId).currentProjection}`
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

    return MapEventProcessor.zoomToExtent(mapId, extent, options);
  }

  /**
   * Set Z index for layers
   *
   * @param {string} mapId Id of map to set layer Z indices
   */
  static setLayerZIndices = (mapId: string) => {
    const reversedLayers = [...this.getMapStateProtected(mapId).orderedLayerInfo].reverse();
    reversedLayers.forEach((orderedLayerInfo, index) => {
      if ((api.maps[mapId].layer.registeredLayers[orderedLayerInfo.layerPath] as AbstractBaseLayerEntryConfig)?.olLayer)
        (api.maps[mapId].layer.registeredLayers[orderedLayerInfo.layerPath] as AbstractBaseLayerEntryConfig).olLayer?.setZIndex(index + 10);
    });
  };

  // #endregion
}
