import { useStore } from 'zustand';
import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { PayloadBaseClass, payloadIsANotification } from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { api } from '@/app';

export class NotificationEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const { mapId } = store.getState();

    // TODO: add a destroy events on store/map destroy
    api.event.on(
      EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD,
      (payload: PayloadBaseClass) => {
        if (payloadIsANotification(payload)) {
          useStore(store, (state) => state.notificationState.addNotification(payload));
        }
      },
      mapId
    );

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }
}
