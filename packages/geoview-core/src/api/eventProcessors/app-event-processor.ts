import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { NotificationDetailsType } from '@/core/types/cgpv-types';

export class AppEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    store.getState();

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // **********************************************************
  // Static functions for Typescript files to set store values
  // **********************************************************
  static setAppIsCrosshairActive(mapId: string, isActive: boolean) {
    const store = getGeoViewStore(mapId);
    store.getState().appState.actions.setCrosshairActive(isActive);
  }

  static addAppNotification(mapId: string, notification: NotificationDetailsType) {
    const store = getGeoViewStore(mapId);
    store.getState().appState.actions.addNotification(notification);
  }
}
