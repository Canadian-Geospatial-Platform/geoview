import { ScaleLine } from 'ol/control';
import Overlay from 'ol/Overlay';
import { fromLonLat, transformExtent } from 'ol/proj';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';

import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { api, Coordinate, NORTH_POLE_POSITION, TypeClickMarker } from '@/app';
import { TypeMapState } from '@/geo/map/map-schema-types';
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
        if (curFeatures.length === 0) api.maps[mapId].layer.featureHighlight.resetAnimation('all');
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

  // **********************************************************
  // Static functions for Typescript files to set store values
  // **********************************************************
  // #region
  static setMapLoaded(mapId: string): void {
    const { map } = api.maps[mapId];
    const store = getGeoViewStore(mapId);

    // initialize store OpenLayers events
    // TODO: destroy events on map destruction
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
    setTimeout(() => store.getState().mapState.actions.setMapElement(map), 250);
    setTimeout(() => store.getState().mapState.actions.setOverlayNorthMarker(northPoleMarker), 250);
    setTimeout(() => store.getState().mapState.actions.setOverlayClickMarker(clickMarkerOverlay), 250);
  }

  static clickMarkerIconHide(mapId: string): void {
    const store = getGeoViewStore(mapId);
    store.getState().mapState.actions.hideClickMarker();
  }

  static clickMarkerIconShow(mapId: string, marker: TypeClickMarker): void {
    const store = getGeoViewStore(mapId);
    store.getState().mapState.actions.showClickMarker(marker);
  }

  static getMapState(mapId: string): TypeMapState {
    return {
      currentProjection: getGeoViewStore(mapId).getState().mapState.currentProjection,
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
    const store = getGeoViewStore(mapId);
    store.setState({
      mapState: { ...store.getState().mapState, attribution },
    });
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // #region
  static rotate(mapId: string, rotation: number): void {
    api.maps[mapId].map.getView().animate({ rotation });
  }

  static zoom(mapId: string, zoom: number): void {
    api.maps[mapId].map.getView().animate({ zoom, duration: OL_ZOOM_DURATION });
  }

  static zoomToExtent(mapId: string, extent: Extent, options?: FitOptions): void {
    api.maps[mapId].zoomToExtent(extent, options);
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
    const projectedCoords = fromLonLat(center, `EPSG:${getGeoViewStore(mapId).getState().mapState.currentProjection}`);
    const extent: Extent = [...projectedCoords, ...projectedCoords];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: zoom, duration: OL_ZOOM_DURATION };

    MapEventProcessor.zoomToExtent(mapId, extent, options);
  }

  static zoomToMyLocation(mapId: string, position: GeolocationPosition): void {
    const projectedCoords = fromLonLat(
      [position.coords.longitude, position.coords.latitude],
      `EPSG:${getGeoViewStore(mapId).getState().mapState.currentProjection}`
    );
    const extent: Extent = [...projectedCoords, ...projectedCoords];
    const options: FitOptions = { padding: OL_ZOOM_PADDING, maxZoom: 13, duration: OL_ZOOM_DURATION };

    MapEventProcessor.zoomToExtent(mapId, extent, options);
  }
  // #endregion
}
