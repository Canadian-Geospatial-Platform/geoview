import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { api } from '@/app';
import { mapPayload, lngLatPayload, mapMouseEventPayload } from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';

export class MapEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const unsub = store.subscribe((curState, prevState) => {
      if (curState.mapState.mapLoaded && prevState.mapState.mapLoaded === false && curState.mapState.mapElement) {
        api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, curState.mapId, curState.mapState.mapElement));
      }

      if (curState.mapState.mapCenterCoordinates !== prevState.mapState.mapCenterCoordinates) {
        api.maps[curState.mapId].mapCenterCoordinates = curState.mapState.mapCenterCoordinates;
        api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, curState.mapId, curState.mapState.mapCenterCoordinates));
      }

      if (curState.mapState.pointerPosition !== prevState.mapState.pointerPosition) {
        api.maps[curState.mapId].pointerPosition = curState.mapState.pointerPosition!;
        api.event.emit(mapMouseEventPayload(EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE, curState.mapId, curState.mapState.pointerPosition!));
      }
    });

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push(unsub);
  }
}
