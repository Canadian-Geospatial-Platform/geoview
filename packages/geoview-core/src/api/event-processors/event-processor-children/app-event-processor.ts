import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement } from '@/core/types/cgpv-types';

export class AppEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    store.getState();

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region
  static addAppNotification(mapId: string, notification: NotificationDetailsType) {
    const store = getGeoViewStore(mapId);
    store.getState().appState.actions.addNotification(notification);
  }

  static getDisplayLanguage(mapId: string): TypeDisplayLanguage {
    return getGeoViewStore(mapId).getState().appState.displayLanguage;
  }

  static getSupportedLanguages(mapId: string): TypeDisplayLanguage[] {
    return getGeoViewStore(mapId).getState().appState.suportedLanguages;
  }

  static setAppIsCrosshairActive(mapId: string, isActive: boolean): void {
    const store = getGeoViewStore(mapId);
    store.getState().appState.actions.setCrosshairActive(isActive);
  }

  static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): void {
    getGeoViewStore(mapId).getState().appState.actions.setDisplayLanguage(lang);
  }

  static toggleFullscreen(mapId: string, active: boolean, element: TypeHTMLElement): void {
    getGeoViewStore(mapId).getState().appState.actions.setFullScreenActive(active, element);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
