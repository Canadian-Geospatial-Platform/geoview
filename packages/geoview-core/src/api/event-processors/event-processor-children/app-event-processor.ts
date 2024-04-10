import { IAppState, TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { NotificationDetailsType } from '@/core/components';
import { TypeDisplayLanguage, TypeDisplayTheme } from '@/geo/map/map-schema-types';
import { TypeHTMLElement, getGeoViewStore } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from './map-event-processor';
import { api } from '@/app';

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
   * @param {string} mapId - The mapId
   * @returns {IAppState} The App state.
   */
  protected static async getAppStateAsync(mapId: string): Promise<IAppState> {
    // Return the app state
    return (await super.getStateAsync(mapId)).appState;
  }

  /**
   * Shortcut to get the display language for a given map id
   * @param {string} mapId - The mapId
   * @returns {TypeDisplayLanguage} The display language.
   */
  static getDisplayLanguage(mapId: string): TypeDisplayLanguage {
    return this.getAppState(mapId).displayLanguage;
  }

  /**
   * Shortcut to get the display theme for a given map id
   * @param {string} mapId - The mapId
   * @returns {TypeDisplayTheme} The display theme.
   */
  static getDisplayTheme(mapId: string): TypeDisplayTheme {
    return this.getAppState(mapId).displayTheme;
  }

  /**
   * Shortcut to get the supported languages for a given map id
   * @param {string} mapId - The mapId
   * @returns {TypeDisplayLanguage[]} The supported languages.
   */
  static getSupportedLanguages(mapId: string): TypeDisplayLanguage[] {
    return this.getAppState(mapId).suportedLanguages;
  }

  static async addNotification(mapId: string, notif: NotificationDetailsType): Promise<void> {
    // because notification is called before map is created, we use the async
    // version of getAppStateAsync
    const appState = await this.getAppStateAsync(mapId);
    const curNotifications = appState.notifications;
    // if the notification already exist, we increment the count
    const existingNotif = curNotifications.find(
      (item) => item.message === notif.message && item.notificationType === notif.notificationType
    );

    if (!existingNotif) {
      curNotifications.push({ key: notif.key, notificationType: notif.notificationType, message: notif.message, count: 1 });
    } else {
      existingNotif.count += 1;
    }

    this.getAppState(mapId).setterActions.setNotifications(curNotifications);
  }

  static removeNotification(mapId: string, key: string): void {
    // filter out notification
    const notifications = this.getAppState(mapId).notifications.filter((item: NotificationDetailsType) => item.key !== key);
    this.getAppState(mapId).setterActions.setNotifications(notifications);
  }

  static setAppIsCrosshairActive(mapId: string, isActive: boolean): void {
    this.getAppState(mapId).setterActions.setCrosshairActive(isActive);
  }

  static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): void {
    this.getAppState(mapId).setterActions.setDisplayLanguage(lang);
    // reload the basemap from new language
    MapEventProcessor.resetBasemap(mapId);
    // load guide in new language
    AppEventProcessor.setGuide(mapId);
  }

  static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void {
    this.getAppState(mapId).setterActions.setDisplayTheme(theme);
  }

  static setFullscreen(mapId: string, active: boolean, element?: TypeHTMLElement): void {
    this.getAppState(mapId).setterActions.setFullScreenActive(active);
    if (element !== undefined) api.maps[mapId].setFullscreen(active, element);
  }

  static setCircularProgress(mapId: string, active: boolean): void {
    this.getAppState(mapId).setterActions.setCircularProgress(active);
  }

  /**
   * Process the guide .md file and add the object to the store.
   * @param {string} mapId - ID of map to create guide object for.
   */
  static async setGuide(mapId: string): Promise<void> {
    const store = getGeoViewStore(mapId);
    const guide = await AppEventProcessor.createGuideObject(mapId);
    if (guide !== undefined) store.getState().appState.setterActions.setGuide(guide);
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure

  static getSectionHeading(content: string): string {
    const firstLine = content.split('\n')[0].trim().split(' ');
    return firstLine.filter((string) => !string.startsWith('#') && !string.startsWith('!')).join(' ');
  }

  static async createGuideObject(mapId: string): Promise<TypeGuideObject | undefined> {
    try {
      const language = AppEventProcessor.getDisplayLanguage(mapId);
      const response = await fetch(`./locales/${language}/guide.md`);
      const content = await response.text();
      const sections = content.split(/=(?=1!)(.*?)=/);
      if (!sections[0].trim()) {
        sections.shift();
      }
      const guideObject: TypeGuideObject = {};
      for (let i = 0; i < sections.length; i += 2) {
        const key = sections[i].trim().substring(2);
        const fullSectionContent = sections[i + 1].trim();
        const heading = AppEventProcessor.getSectionHeading(fullSectionContent);
        const subSections = fullSectionContent.split(/=(?=2!)(.*?)=/);
        const sectionContent = subSections[0];
        const children: TypeGuideObject = {};
        if (subSections.length > 1) {
          for (let j = 1; j < subSections.length; j += 2) {
            const childKey = subSections[j].trim().substring(2);
            const fullChildContent = subSections[j + 1].trim();
            const childHeading = AppEventProcessor.getSectionHeading(fullChildContent);
            const subSubSections = fullChildContent.split(/=(?=3!)(.*?)=/);
            const childContent = subSubSections[0];
            const grandChildren: TypeGuideObject = {};
            for (let k = 1; k < subSubSections.length; k += 2) {
              const grandChildKey = subSubSections[k].trim().substring(2);
              const grandChildContent = subSubSections[k + 1].trim();
              const grandChildHeading = AppEventProcessor.getSectionHeading(grandChildContent);
              grandChildren[grandChildKey] = { heading: grandChildHeading, content: grandChildContent };
            }
            children[childKey] = {
              heading: childHeading,
              content: childContent,
              children: grandChildren,
            };
          }
        }
        guideObject[key] = { heading, content: sectionContent, children };
      }
      return guideObject;
    } catch (error) {
      logger.logError(mapId, error);
      return undefined;
    }
  }
}
