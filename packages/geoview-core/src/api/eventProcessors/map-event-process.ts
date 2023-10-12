import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { api } from '@/app';
import {
  mapPayload,
  lngLatPayload,
  mapMouseEventPayload,
  numberPayload,
  payloadIsAMapViewProjection,
  PayloadBaseClass,
  mapViewProjectionPayload,
  payloadIsABoolean,
} from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';

export class MapEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const { mapId } = store.getState();

    const unsubMapLoaded = store.subscribe(
      (state) => state.mapState.mapLoaded,
      (cur, prev) => {
        if (cur !== prev) api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, mapId, store.getState().mapState.mapElement!));
      }
    );

    const unsubMapCenterCoord = store.subscribe(
      (state) => state.mapState.mapCenterCoordinates,
      (cur, prev) => {
        if (cur !== prev) {
          api.maps[mapId].mapCenterCoordinates = cur;
          api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, mapId, cur));
        }
      }
    );

    const unsubMapPointerPosition = store.subscribe(
      (state) => state.mapState.pointerPosition,
      (cur, prev) => {
        if (cur !== prev) {
          api.maps[mapId].pointerPosition = cur!;
          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, mapId, cur!));
        }
      }
    );

    const unsubMapProjection = store.subscribe(
      (state) => state.mapState.currentProjection,
      (cur, prev) => {
        // because emit and on from api events can be trigger in loop, compare also the api value
        if (cur !== prev && api.maps[mapId].currentProjection !== cur!) {
          api.maps[mapId].currentProjection = cur!;
          api.event.emit(mapViewProjectionPayload(EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE, mapId, cur!));
        }
      }
    );

    const unsubMapZoom = store.subscribe(
      (state) => state.mapState.zoom,
      (cur, prev) => {
        if (cur !== prev) {
          api.maps[mapId].currentZoom = cur!;
          api.event.emit(numberPayload(EVENT_NAMES.MAP.EVENT_MAP_ZOOM_END, mapId, cur!));
        }
      }
    );

    const unsubMapSingleClick = store.subscribe(
      (state) => state.mapState.mapClickCoordinates,
      (cur, prev) => {
        if (cur !== prev) {
          api.maps[mapId].singleClickedPosition = cur!;
          api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK, mapId, cur!));
        }
      }
    );

    // TODO: add a destroy events on store/map destroy
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_VIEW_PROJECTION_CHANGE,
      (payload: PayloadBaseClass) => {
        // because emit and on from api events can be trigger in loop, compare also the api value
        if (payloadIsAMapViewProjection(payload) && api.maps[mapId].currentProjection !== payload.projection!) {
          api.maps[mapId].currentProjection = payload.projection!;
          store.setState({
            mapState: { ...store.getState().mapState, currentProjection: payload.projection! },
          });
        }
      },
      mapId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS,
      (payload: PayloadBaseClass) => {
        if (payloadIsABoolean(payload)) {
          console.log(payload.status + ' crosshair active')
          store.setState({ isCrosshairsActive: payload.status });
          console.log(store.getState().isCrosshairsActive + ' store crosshair active')
        }
      },
      mapId
    );

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push(
      unsubMapLoaded,
      unsubMapCenterCoord,
      unsubMapPointerPosition,
      unsubMapProjection,
      unsubMapZoom,
      unsubMapSingleClick
    );
  }
}
