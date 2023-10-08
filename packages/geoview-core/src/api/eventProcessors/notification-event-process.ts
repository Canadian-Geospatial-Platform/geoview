import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { PayloadBaseClass, payloadIsANotification } from '@/api/events/payloads';
import { EVENT_NAMES } from '@/api/events/event-types';
import { api, generateId } from '@/app';

export class NotificationEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const { mapId } = store.getState();

    // TODO: add a destroy events on store/map destroy
    // when the add notification is triggered, add it to the strore notifications array
    api.event.on(
      EVENT_NAMES.NOTIFICATIONS.NOTIFICATION_ADD,
      (payload: PayloadBaseClass) => {
        if (payloadIsANotification(payload)) {
          store.setState((state) => ({
            notificationState: {
              notifications: [
                ...state.notificationState.notifications,
                { key: generateId(), notificationType: payload.notificationType, message: payload.message },
              ],
            },
          }));
        }
      },
      mapId
    );

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }
}
