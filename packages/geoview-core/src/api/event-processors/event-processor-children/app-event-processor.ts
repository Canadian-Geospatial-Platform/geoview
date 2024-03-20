import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement, TypeDisplayTheme, IAppState } from '@/core/types/cgpv-types';

import { AbstractEventProcessor } from '../abstract-event-processor';

export class AppEventProcessor extends AbstractEventProcessor {
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  /**
   * Shortcut to get the App state for a given map id
   * @param {string} mapId The mapId
   * @returns {IAppState} The App state.
   */
  protected static getAppState(mapId: string): IAppState {
    // Return the app state
    return super.getState(mapId).appState;
  }

  /**
   * Shortcut to get the App state for a given map id
   * @param {string} mapId The mapId
   * @returns {IAppState} The App state.
   */
  protected static async getAppStateAsync(mapId: string): Promise<IAppState> {
    // Return the app state
    return (await super.getStateAsync(mapId)).appState;
  }

  static async addAppNotification(mapId: string, notification: NotificationDetailsType): Promise<void> {
    // because notification is called before map is created, we use the async
    // version of getAppStateAsync
    (await this.getAppStateAsync(mapId)).actions.addNotification(notification);
  }

  static getDisplayLanguage(mapId: string): TypeDisplayLanguage {
    return this.getAppState(mapId).displayLanguage;
  }

  static getDisplayTheme(mapId: string): TypeDisplayTheme {
    return this.getAppState(mapId).displayTheme;
  }

  static getSupportedLanguages(mapId: string): TypeDisplayLanguage[] {
    return this.getAppState(mapId).suportedLanguages;
  }

  static setAppIsCrosshairActive(mapId: string, isActive: boolean): void {
    this.getAppState(mapId).actions.setCrosshairActive(isActive);
  }

  static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): void {
    this.getAppState(mapId).actions.setDisplayLanguage(lang);
  }

  static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void {
    this.getAppState(mapId).actions.setDisplayTheme(theme);
  }

  static setFullscreen(mapId: string, active: boolean, element: TypeHTMLElement): void {
    this.getAppState(mapId).actions.setFullScreenActive(active, element);
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
