import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { api } from '@/app';
import { booleanPayload } from '../events/payloads';
import { EVENT_NAMES } from '../events/event-types';

export class AppBarEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const unsub = store.subscribe((curState, prevState) => {
      if (curState.appBarState.geoLocatorActive !== prevState.appBarState.geoLocatorActive) {
        api.event.emit(
          booleanPayload(EVENT_NAMES.GEOLOCATOR.EVENT_GEOLOCATOR_TOGGLE, curState.mapId, curState.appBarState.geoLocatorActive)
        );
      }
    });

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push(unsub);
  }
}
