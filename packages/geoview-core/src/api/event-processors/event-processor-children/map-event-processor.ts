import { Root } from 'react-dom/client';

import { ScaleLine } from 'ol/control';
import Overlay from 'ol/Overlay';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';
import View, { FitOptions } from 'ol/View';
import { KeyboardPan } from 'ol/interaction';

import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { api, Coordinate, NORTH_POLE_POSITION, TypeBasemapOptions, TypeBasemapProps, TypeClickMarker } from '@/app';
import { TypeInteraction, TypeMapState, TypeValidMapProjectionCodes } from '@/geo/map/map-schema-types';
import {
  mapPayload,
  lngLatPayload,
  mapMouseEventPayload,
  numberPayload,
  mapViewProjectionPayload,
  TypeGeometry,
  TypeFeatureInfoEntry,
} from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';
import { AppEventProcessor } from './app-event-processor';
import { TypeLegendLayer } from '@/core/components/layers/types';

export class MapEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoviewStoreType) {
    const { mapId } = store.getState();

    const unsubMapLoaded = store.subscribe(
      (state) => state.mapState.mapLoaded,
      (cur, prev) => {
        if (cur !== prev) api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, mapId, store.getState().mapState.mapElement!));
      }
    );

    // #region MAP STATE
    const unsubMapCenterCoord = store.subscribe(
      (state) => state.mapState.centerCoordinates,
      (cur, prev) => {
        if (cur !== prev) {
          api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, mapId, cur));
        }
      }
    );

    const unsubMapPointerPosition = store.subscribe(
      (state) => state.mapState.pointerPosition,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, mapId, cur));
        }
      }
    );

    const unsubMapProjection = store.subscribe(
      (state) => state.mapState.currentProjection,
      (cur, prev) => {
        // because emit and on from api events can be trigger in loop, compare also the api value
        if (cur !== prev && api.maps[mapId].getMapState().currentProjection !== cur!) {
          api.event.emit(mapViewProjectionPayload(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, cur!));
        }
      }
    );

    const unsubMapSingleClick = store.subscribe(
      (state) => state.mapState.clickCoordinates,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId, cur));
        }
      }
    );

    const unsubMapZoom = store.subscribe(
      (state) => state.mapState.zoom,
      (cur, prev) => {
        if (cur! && cur !== prev) {
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

    // Checks for changes to selected features and updates highlights
    const unsubMapSelectedFeatures = store.subscribe(
      (state) => state.mapState.selectedFeatures,
      (curFeatures, prevFeatures) => {
        // TODO: on reload, layer object is undefined, need to test for now and solve in #1580
        if (curFeatures.length === 0 && api.maps[mapId].layer !== undefined) api.maps[mapId].layer.featureHighlight.resetAnimation('all');
        else {
          const curFeatureUids = curFeatures.map((feature) => (feature.geometry as TypeGeometry).ol_uid);
          const prevFeatureUids = prevFeatures.map((feature) => (feature.geometry as TypeGeometry).ol_uid);
          const newFeatures = curFeatures.filter(
            (feature: TypeFeatureInfoEntry) => !prevFeatureUids.includes((feature.geometry as TypeGeometry).ol_uid)
          );
          const removedFeatures = prevFeatures.filter(
            (feature: TypeFeatureInfoEntry) => !curFeatureUids.includes((feature.geometry as TypeGeometry).ol_uid)
          );
          for (let i = 0; i < newFeatures.length; i++) api.maps[mapId].layer.featureHighlight.selectFeature(newFeatures[i]);
          for (let i = 0; i < removedFeatures.length; i++)
            api.maps[mapId].layer.featureHighlight.resetAnimation((removedFeatures[i].geometry as TypeGeometry).ol_uid);
        }
      }
    );
    // #endregion FEATURE SELECTION

    const unsubLegendLayers = store.subscribe(
      (state) => state.layerState.legendLayers,
      (cur) => {
        const orderedLayerPaths = MapEventProcessor.getLayerPathsFromLegendsArray(cur);
        const prevLayerOrder = [...store.getState().mapState.layerOrder];
        if (JSON.stringify(prevLayerOrder) !== JSON.stringify(orderedLayerPaths))
          store.getState().mapState.actions.setLayerOrder(orderedLayerPaths);
        const orderedVisibleLayers = orderedLayerPaths.filter(
          (layerPath) => store.getState().layerState.actions.getLayer(layerPath)?.isVisible !== 'no'
        );
        const prevVisibleLayers = [...store.getState().mapState.visibleLayers];
        if (JSON.stringify(prevVisibleLayers) !== JSON.stringify(orderedVisibleLayers))
          store.getState().mapState.actions.setVisibleLayers(orderedVisibleLayers);
      }
    );

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push(
      unsubMapHighlightedFeatures,
      unsubMapLoaded,
      unsubMapCenterCoord,
      unsubMapPointerPosition,
      unsubMapProjection,
      unsubMapSelectedFeatures,
      unsubMapZoom,
      unsubMapSingleClick,
      unsubLegendLayers
    );
  }

  //! THIS IS THE ONLY FUNCTION TO SET STORE DIRECTLY
  static setMapLoaded(mapId: string): void {
    // use api to access map because this function will set map element in store
    const { map } = api.maps[mapId];
    const store = getGeoViewStore(mapId);

    // initialize store OpenLayers events
    // TODO: destroy events on map destruction
    map.on('change:size', store.getState().mapState.events.onMapChangeSize);
    map.on('moveend', store.getState().mapState.events.onMapMoveEnd);
    map.on('pointermove', store.getState().mapState.events.onMapPointerMove);
    map.on('singleclick', store.getState().mapState.events.onMapSingleClick);
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
    const projectionPosition = fromLonLat(
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

    const orderedLayerPaths = MapEventProcessor.getLayerPathsFromLegendsArray(store.getState().layerState.legendLayers);
    store.getState().mapState.actions.setLayerOrder(orderedLayerPaths);
    const orderedVisibleLayers = orderedLayerPaths.filter(
      (layerPath) => store.getState().layerState.actions.getLayer(layerPath)?.isVisible !== 'no'
    );
    store.getState().mapState.actions.setVisibleLayers(orderedVisibleLayers);

    // trigger the creation of feature info layer set and legend layer set
    // We always trigger creation because outside package may rely on them
    api.getFeatureInfoLayerSet(mapId);
    api.getLegendsLayerSet(mapId);

    // set autofocus/blur on mouse enter/leave the map so user can scroll (zoom) without having to click the map
    const mapHTMLElement = map.getTargetElement();
    mapHTMLElement.addEventListener('mouseenter', () => mapHTMLElement.focus());
    mapHTMLElement.addEventListener('mouseleave', () => mapHTMLElement.blur());

    // set store
    // TODO: try async, evaluate if still needed OR use another approach
    setTimeout(() => store.getState().mapState.actions.setMapElement(map), 250);
    setTimeout(() => store.getState().mapState.actions.setOverlayNorthMarker(northPoleMarker), 250);
    setTimeout(() => store.getState().mapState.actions.setOverlayClickMarker(clickMarkerOverlay), 250);
    setTimeout(() => map.dispatchEvent('change:size'), 500); // dispatch event to set initial value
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region
  static getBasemapOptions(mapId: string): TypeBasemapOptions {
    return getGeoViewStore(mapId).getState().mapState.basemapOptions;
  }

  static clickMarkerIconHide(mapId: string): void {
    getGeoViewStore(mapId).getState().mapState.actions.hideClickMarker();
  }

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    getGeoViewStore(mapId).getState().mapState.actions.showClickMarker(marker);
  }

  static getMapInteraction(mapId: string): TypeInteraction {
    return getGeoViewStore(mapId).getState().mapState.interaction;
  }

  static getMapState(mapId: string): TypeMapState {
    return {
      currentProjection: getGeoViewStore(mapId).getState().mapState.currentProjection as TypeValidMapProjectionCodes,
      currentZoom: getGeoViewStore(mapId).getState().mapState.zoom,
      mapCenterCoordinates: getGeoViewStore(mapId).getState().mapState.centerCoordinates,
      pointerPosition: getGeoViewStore(mapId).getState().mapState.pointerPosition || {
        pixel: [],
        lnglat: [],
        projected: [],
        dragging: false,
      },
      singleClickedPosition: getGeoViewStore(mapId).getState().mapState.clickCoordinates || {
        pixel: [],
        lnglat: [],
        projected: [],
        dragging: false,
      },
    };
  }

  static setMapAttribution(mapId: string, attribution: string[]): void {
    getGeoViewStore(mapId).getState().mapState.actions.setAttribution(attribution);
  }

  static setInteraction(mapId: string, interaction: TypeInteraction): void {
    getGeoViewStore(mapId).getState().mapState.actions.setInteraction(interaction);
  }

  static setProjection(mapId: string, projectionCode: TypeValidMapProjectionCodes): void {
    // set circular progress to hide basemap switching
    getGeoViewStore(mapId).getState().appState.actions.setCircularProgress(true);
    // TODO: make async (last 2 seconds like for overview map)
    setTimeout(() => getGeoViewStore(mapId).getState().appState.actions.setCircularProgress(false), 2000);

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
    getGeoViewStore(mapId).getState().mapState.actions.setProjection(projectionCode, newView);

    // refresh layers so new projection is render properly
    api.maps[mapId].refreshLayers();
  }

  static rotate(mapId: string, rotation: number): void {
    getGeoViewStore(mapId).getState().mapState.actions.setRotation(rotation);
  }

  static zoom(mapId: string, zoom: number): void {
    getGeoViewStore(mapId).getState().mapState.actions.setZoom(zoom, OL_ZOOM_DURATION);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
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

  static getLayerPathsFromLegendsArray(legendsArray: TypeLegendLayer[]): string[] {
    const layerPathList: string[] = [];
    for (let i = 0; i < legendsArray.length; i++) {
      const nextLayerLegend = legendsArray.filter((layerLegend) => layerLegend.order === i)[0];
      if (nextLayerLegend) {
        layerPathList.push(nextLayerLegend.layerPath);
        if (nextLayerLegend.children.length > 0) {
          layerPathList.push(...this.getLayerPathsFromLegendsArray(nextLayerLegend.children));
        }
      }
    }
    return layerPathList;
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
  static zoomToExtent(mapId: string, extent: Extent, options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: 11, duration: 1000 }) {
    // store state will be updated by map event
    api.maps[mapId].getView().fit(extent, options);
  }

  static zoomToGeoLocatorLocation(mapId: string, coords: Coordinate, bbox?: Extent): void {
    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box') as HTMLCollectionOf<Element>;
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }

    const projectionConfig = api.projection.projections[MapEventProcessor.getMapState(mapId).currentProjection];
    if (bbox) {
      //! There were issues with fromLonLat in rare cases in LCC projections, transformExtent seems to solve them.
      //! fromLonLat and transformExtent give differing results in many cases, fromLonLat had issues with the first
      //! three results from a geolocator search for "vancouver river"
      const convertedExtent = transformExtent(bbox, 'EPSG:4326', projectionConfig);
      MapEventProcessor.zoomToExtent(mapId, convertedExtent, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
        duration: OL_ZOOM_DURATION,
      });

      // TODO: use proper function
      api.maps[mapId].layer.featureHighlight.highlightGeolocatorBBox(convertedExtent);
      setTimeout(() => {
        MapEventProcessor.clickMarkerIconShow(mapId, { lnglat: coords });
        for (let i = 0; i < indicatorBox.length; i++) {
          (indicatorBox[i] as HTMLElement).style.display = '';
        }
      }, OL_ZOOM_DURATION + 150);
    } else {
      MapEventProcessor.zoomToExtent(mapId, fromLonLat(coords, projectionConfig), { maxZoom: 16, duration: OL_ZOOM_DURATION });
      setTimeout(() => {
        MapEventProcessor.clickMarkerIconShow(mapId, { lnglat: coords });
        for (let i = 0; i < indicatorBox.length; i++) {
          (indicatorBox[i] as HTMLElement).style.display = '';
        }
      }, OL_ZOOM_DURATION + 150);
    }
  }

  static zoomToInitialExtent(mapId: string): void {
    const { center, zoom } = getGeoViewStore(mapId).getState().mapConfig!.map.viewSettings;
    const projectedCoords = api.projection.transformPoints(
      [center],
      `EPSG:4326`,
      `EPSG:${getGeoViewStore(mapId).getState().mapState.currentProjection}`
    );
    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: zoom, duration: OL_ZOOM_DURATION };

    MapEventProcessor.zoomToExtent(mapId, extent, options);
  }

  static zoomToMyLocation(mapId: string, position: GeolocationPosition): void {
    const coord: Coordinate = [position.coords.longitude, position.coords.latitude];
    const projectedCoords = api.projection.transformPoints(
      [coord],
      `EPSG:4326`,
      `EPSG:${getGeoViewStore(mapId).getState().mapState.currentProjection}`
    );

    const extent: Extent = [...projectedCoords[0], ...projectedCoords[0]];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

    MapEventProcessor.zoomToExtent(mapId, extent, options);
  }

  /**
   * Set Z index for layers
   *
   * @param {string} mapId Id of map to set layer Z indices
   */
  static setLayerZIndices = (mapId: string) => {
    const reversedLayers = [...getGeoViewStore(mapId).getState().mapState.layerOrder].reverse();
    reversedLayers.forEach((layerPath, index) => {
      if (api.maps[mapId].layer.registeredLayers[layerPath]?.olLayer)
        api.maps[mapId].layer.registeredLayers[layerPath].olLayer?.setZIndex(index + 10);
    });
  };

  // #endregion
}
