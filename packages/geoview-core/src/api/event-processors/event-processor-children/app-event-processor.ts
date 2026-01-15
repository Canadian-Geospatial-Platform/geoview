import type { TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import type { IAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { NotificationDetailsType } from '@/core/components';
import type { TypeHTMLElement } from '@/core/types/global-types';
import { createGuideObject } from '@/core/utils/utilities';
import { MapEventProcessor } from './map-event-processor';
import type { SnackbarType } from '@/core/utils/notifications';
import { logger } from '@/core/utils/logger';
import { formatError } from '@/core/exceptions/core-exceptions';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

export class AppEventProcessor extends AbstractEventProcessor {
  // Static functions for Typescript files to access store actions
  // **********************************************************
  // GV Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  // GV Some action does state modifications AND map actions.
  // GV ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  /**
   * Gets the app state slice from the store for the specified map.
   * Provides access to application-level state including display language, theme, and notifications.
   * @param {string} mapId - The map identifier
   * @return {IAppState} The app state slice
   * @protected
   * @static
   */
  protected static getAppState(mapId: string): IAppState {
    // Return the app state
    return super.getState(mapId).appState;
  }

  /**
   * Asynchronously gets the app state slice from the store for the specified map.
   * This method waits for the store to be available before returning the state.
   * @param {string} mapId - The map identifier
   * @return {Promise<IAppState>} Promise that resolves with the app state slice
   * @protected
   * @static
   */
  protected static async getAppStateAsync(mapId: string): Promise<IAppState> {
    // Return the app state
    return (await super.getStateAsync(mapId)).appState;
  }

  /**
   * Gets the current display language setting for the map.
   * @param {string} mapId - The map identifier
   * @return {TypeDisplayLanguage} The display language ('en' or 'fr')
   * @static
   */
  static getDisplayLanguage(mapId: string): TypeDisplayLanguage {
    return this.getAppState(mapId).displayLanguage;
  }

  /**
   * Gets the current display theme setting for the map.
   * @param {string} mapId - The map identifier
   * @return {TypeDisplayTheme} The display theme ('dark', 'light' or 'geo-ca')
   * @static
   */
  static getDisplayTheme(mapId: string): TypeDisplayTheme {
    return this.getAppState(mapId).displayTheme;
  }

  /**
   * Gets the root HTML element that contains the GeoView map instance.
   * @param {string} mapId - The map identifier
   * @return {HTMLElement} The GeoView container HTML element
   * @static
   */
  static getGeoviewHTMLElement(mapId: string): HTMLElement {
    return this.getAppState(mapId).geoviewHTMLElement;
  }

  /**
   * Gets whether unsymbolized features should be displayed on the map.
   * When true, features without defined styles will still be rendered with default styling.
   * @param {string} mapId - The map identifier
   * @return {boolean} True if unsymbolized features should be shown, false otherwise
   * @static
   */
  static getShowUnsymbolizedFeatures(mapId: string): boolean {
    return this.getAppState(mapId).showUnsymbolizedFeatures;
  }

  /**
   * Displays a snackbar message to the user and optionally adds it to the notification panel.
   * Routes the message to the appropriate notification method based on type (info, success, warning, error).
   * @param {string} mapId - The map identifier
   * @param {SnackbarType} type - The type of message (info, success, warning, error)
   * @param {string} messageKey - The translation key for the message
   * @param {string[]} [param] - Optional parameters to replace in the message string
   * @param {boolean} notification - True to add the message to notification panel (default false)
   * @return {void}
   * @static
   */
  static addMessage(mapId: string, type: SnackbarType, messageKey: string, param?: string[], notification: boolean = false): void {
    switch (type) {
      case 'info':
        MapEventProcessor.getMapViewer(mapId).notifications.showMessage(messageKey, param, notification);
        break;
      case 'success':
        MapEventProcessor.getMapViewer(mapId).notifications.showSuccess(messageKey, param, notification);
        break;
      case 'warning':
        MapEventProcessor.getMapViewer(mapId).notifications.showWarning(messageKey, param, notification);
        break;
      case 'error':
        MapEventProcessor.getMapViewer(mapId).notifications.showError(messageKey, param, notification);
        break;
      default:
        break;
    }
  }

  /**
   * Adds a notification to the notification panel or increments count if it already exists.
   * Uses the async version of getAppStateAsync since notifications can be added before map is fully created.
   * Checks if notification already exists and increments its count if found, otherwise adds new notification with count of 1.
   * @param {string} mapId - The map identifier
   * @param {NotificationDetailsType} notif - The notification details to add
   * @return {Promise<void>} Promise that resolves when the notification is added
   * @static
   */
  static async addNotification(mapId: string, notif: NotificationDetailsType): Promise<void> {
    // Because notification is called before map is created, we use the async
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

  /**
   * Removes a specific notification from the notification panel by its key.
   * @param {string} mapId - The map identifier
   * @param {string} key - The unique key of the notification to remove
   * @return {void}
   * @static
   */
  static removeNotification(mapId: string, key: string): void {
    // filter out notification
    const notifications = this.getAppState(mapId).notifications.filter((item: NotificationDetailsType) => item.key !== key);
    this.getAppState(mapId).setterActions.setNotifications(notifications);
  }

  /**
   * Removes all notifications from the notification panel.
   * @param {string} mapId - The map identifier
   * @return {void}
   * @static
   */
  static removeAllNotifications(mapId: string): void {
    this.getAppState(mapId).setterActions.setNotifications([]);
  }

  /**
   * Sets the crosshair active state and enables/disables map interaction for WCAG compliance.
   * When crosshair is active, the map is focused and keyboard interactions are enabled.
   * @param {string} mapId - The map identifier
   * @param {boolean} isActive - True to activate crosshair, false to deactivate
   * @return {void}
   * @static
   */
  static setAppIsCrosshairActive(mapId: string, isActive: boolean): void {
    this.getAppState(mapId).setterActions.setCrosshairActive(isActive);

    // Because the map is focused/blured, we need to enable/disable the map interaction for WCAG
    MapEventProcessor.setActiveMapInteractionWCAG(mapId, isActive);
  }

  /**
   * Sets the display language for the map and triggers related updates.
   * Changes i18n language, resets basemap, reloads guide, and clears notifications to prevent mixed language content.
   * @param {string} mapId - The map identifier
   * @param {TypeDisplayLanguage} lang - The language to set ('en' or 'fr')
   * @return {Promise<void>} Promise that resolves when all language changes are complete
   * @static
   */
  static setDisplayLanguage(mapId: string, lang: TypeDisplayLanguage): Promise<void> {
    // Return a new promise of void when all will be done instead of promise of array of voids
    return new Promise((resolve, reject) => {
      // Change language in i18n for the useTranslation used by the ui components
      const promiseChangeLanguage = MapEventProcessor.getMapViewer(mapId).getI18nInstance().changeLanguage(lang);

      this.getAppState(mapId).setterActions.setDisplayLanguage(lang);

      // reload the basemap from new language
      const promiseResetBasemap = MapEventProcessor.resetBasemap(mapId);

      // load guide in new language
      const promiseSetGuide = AppEventProcessor.setGuide(mapId);

      // Remove all previous notifications to ensure there is no mix en and fr
      AppEventProcessor.removeAllNotifications(mapId);

      // When all promises are done
      Promise.all([promiseChangeLanguage, promiseResetBasemap, promiseSetGuide])
        .then(() => {
          // Now resolve
          resolve();
        })
        .catch((error: unknown) => {
          // Reject
          reject(formatError(error));
        });
    });
  }

  /**
   * Sets the display theme for the map.
   * @param {string} mapId - The map identifier
   * @param {TypeDisplayTheme} theme - The theme to set ('dark' or 'geo-ca')
   * @return {void}
   * @static
   */
  static setDisplayTheme(mapId: string, theme: TypeDisplayTheme): void {
    this.getAppState(mapId).setterActions.setDisplayTheme(theme);
  }

  /**
   * Toggles fullscreen mode for the map.
   * @param {string} mapId - The map identifier
   * @param {boolean} active - True to enter fullscreen, false to exit
   * @param {TypeHTMLElement} [element] - Optional HTML element to make fullscreen (defaults to map container)
   * @return {void}
   * @static
   */
  static setFullscreen(mapId: string, active: boolean, element?: TypeHTMLElement): void {
    this.getAppState(mapId).setterActions.setFullScreenActive(active);
    MapEventProcessor.getMapViewer(mapId).setFullscreen(active, element);
  }

  /**
   * Shows or hides the circular progress indicator on the map.
   * Used to indicate loading states for async operations.
   * @param {string} mapId - The map identifier
   * @param {boolean} active - True to show progress indicator, false to hide
   * @return {void}
   * @static
   */
  static setCircularProgress(mapId: string, active: boolean): void {
    this.getAppState(mapId).setterActions.setCircularProgress(active);
  }

  /**
   * Processes the guide markdown file and stores the parsed guide object in the app state.
   * Loads the guide content based on the current display language and logs performance metrics.
   * @param {string} mapId - The map identifier to create guide object for
   * @return {Promise<void>} Promise that resolves when the guide is loaded and stored
   * @static
   */
  static async setGuide(mapId: string): Promise<void> {
    // Start guide loading tracker
    logger.logMarkerStart('map-guide');

    const language = AppEventProcessor.getDisplayLanguage(mapId);
    const guide = await createGuideObject(mapId, language, this.getAppState(mapId).geoviewAssetsURL);
    if (guide !== undefined) this.getAppState(mapId).setterActions.setGuide(guide);

    // Check guide loading tracker
    logger.logMarkerCheck('map-guide', 'for guide to be loaded');
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  // GV NEVER add a store action who does set state AND map action at a same time.
  // GV Review the action in store state to make sure
}
