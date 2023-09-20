import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { api } from '@/app';
import { mapPayload, lngLatPayload } from '../events/payloads';
import { EVENT_NAMES } from '../events/event-types';

export class MapEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const unsub = store.subscribe((curState, prevState) => {
      if (curState.mapState.mapLoaded && prevState.mapState.mapLoaded === false && curState.mapState.mapElement) {
        api.event.emit(mapPayload(EVENT_NAMES.MAP.EVENT_MAP_LOADED, curState.mapId, curState.mapState.mapElement));
      }

      if (curState.mapState.currentMapCenterCoordinates !== prevState.mapState.currentMapCenterCoordinates) {
        api.maps[curState.mapId].currentMapCenterCoordinates = curState.mapState.currentMapCenterCoordinates;
        api.event.emit(lngLatPayload(EVENT_NAMES.MAP.EVENT_MAP_MOVE_END, curState.mapId, curState.mapState.currentMapCenterCoordinates));
      }
    });

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push(unsub);
  }
}
