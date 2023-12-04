import { ScaleLine } from 'ol/control';
import Overlay from 'ol/Overlay';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';
import { KeyboardPan } from 'ol/interaction';

import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { api, Coordinate, NORTH_POLE_POSITION, TypeBasemapOptions, TypeClickMarker } from '@/app';
import { TypeMapState, TypeValidMapProjectionCodes } from '@/geo/map/map-schema-types';
import {
  mapPayload,
  lngLatPayload,
  mapMouseEventPayload,
  numberPayload,
  payloadIsAMapViewProjection,
  PayloadBaseClass,
  mapViewProjectionPayload,
  TypeGeometry,
  TypeFeatureInfoEntry,
} from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { OL_ZOOM_DURATION, OL_ZOOM_PADDING } from '@/core/utils/constant';

export class MapEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
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
          api.maps[mapId].mapState.mapCenterCoordinates = cur;
          api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, mapId, cur));
        }
      }
    );

    const unsubMapPointerPosition = store.subscribe(
      (state) => state.mapState.pointerPosition,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          api.maps[mapId].mapState.pointerPosition = cur;
          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, mapId, cur));
        }
      }
    );

    const unsubMapProjection = store.subscribe(
      (state) => state.mapState.currentProjection,
      (cur, prev) => {
        // because emit and on from api events can be trigger in loop, compare also the api value
        if (cur !== prev && api.maps[mapId].mapState.currentProjection !== cur!) {
          api.maps[mapId].mapState.currentProjection = cur;
          api.event.emit(mapViewProjectionPayload(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, cur!));
        }
      }
    );

    const unsubMapSingleClick = store.subscribe(
      (state) => state.mapState.clickCoordinates,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          api.maps[mapId].mapState.singleClickedPosition = cur;
          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId, cur));
        }
      }
    );

    const unsubMapZoom = store.subscribe(
      (state) => state.mapState.zoom,
      (cur, prev) => {
        if (cur! && cur !== prev) {
          api.maps[mapId].mapState.currentZoom = cur;
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

    // TODO: add a destroy events on store/map destroy
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE,
      (payload: PayloadBaseClass) => {
        // because emit and on from api events can be trigger in loop, compare also the api value
        if (payloadIsAMapViewProjection(payload) && api.maps[mapId].mapState.currentProjection !== payload.projection!) {
          api.maps[mapId].mapState.currentProjection = payload.projection!;
          store.setState({
            mapState: { ...store.getState().mapState, currentProjection: payload.projection! },
          });
        }
      },
      mapId
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
      unsubMapSingleClick
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

    // set store
    // TODO: evaluate if still needed OR use another approach
    setTimeout(() => store.getState().mapState.actions.setMapElement(map), 250);
    setTimeout(() => store.getState().mapState.actions.setOverlayNorthMarker(northPoleMarker), 250);
    setTimeout(() => store.getState().mapState.actions.setOverlayClickMarker(clickMarkerOverlay), 250);
    setTimeout(() => map.dispatchEvent('change:size'), 500); // dispatch event to set initial value
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use storte action to modify store - NEVER use setState!
  //! Some action does state modfication AND map actions.
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

  static zoomToExtent(mapId: string, extent: Extent, options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: 11, duration: 1000 }) {
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
  // #endregion
}
