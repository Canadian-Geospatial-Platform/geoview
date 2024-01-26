import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { getGeoViewStore, getGeoViewStoreAsync } from '@/core/stores/stores-managers';
import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement, TypeDisplayTheme } from '@/core/types/cgpv-types';

export class AppEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoviewStoreType) {
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
  static async addAppNotification(mapId: string, notification: NotificationDetailsType): Promise<void> {
    // because notification is called before map is created, we use the async
    // version of getGeoViewStore
    const store = await getGeoViewStoreAsync(mapId);
    store.getState().appState.actions.addNotification(notification);
  }

  static getDisplayLanguage(mapId: string): TypeDisplayLanguage {
    return getGeoViewStore(mapId).getState().appState.displayLanguage;
  }

  static getDisplayTheme(mapId: string): TypeDisplayTheme {
    return getGeoViewStore(mapId).getState().appState.displayTheme;
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

  static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void {
    getGeoViewStore(mapId).getState().appState.actions.setDisplayTheme(theme);
  }

  static setFullscreen(mapId: string, active: boolean, element: TypeHTMLElement): void {
    getGeoViewStore(mapId).getState().appState.actions.setFullScreenActive(active, element);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
