import { AbstractMapViewerAdaptor } from '@/core/adaptors/base/abstract-map-viewer-adaptor';
import { getGeoViewStore, getGeoViewStoreAsync } from '@/core/stores/stores-managers';
import {
  getStoreActiveAppBarTab,
  type ActiveAppBarTabType,
  type FocusItemProps,
  type IUIState,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import type { IAppState, TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { TimeIANA } from '@/core/utils/date-mgt';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { UIDomain } from '@/core/domains/ui-domain';

export class UIStateAdaptor extends AbstractMapViewerAdaptor {
  /** The UI Domain on which the adaptor operates */
  #uiDomain: UIDomain;

  /**
   *
   * @param uiDomain
   * @param mapId
   */
  constructor(uiDomain: UIDomain, mapId: string) {
    super(mapId);

    // Keep a reference on the UI domain
    this.#uiDomain = uiDomain;

    // Listens when the language is changed in the UI domain and updates the store accordingly
    this.#uiDomain.onLanguageChanged((sender, event) => {
      this.#setDisplayLanguage(event.language);
    });
  }

  /**
   * Shows a tab button in the UI by removing it from the hiddenTabs list in the store.
   *
   * @param tab - The ID of the tab to show.
   */
  showTabButton(tab: string): void {
    const uiState = this.#getStoreUIState();
    const { hiddenTabs } = uiState;

    // Find it
    const tabIndex = hiddenTabs.indexOf(tab);
    if (tabIndex !== -1) {
      hiddenTabs.splice(tabIndex, 1);
      uiState.actions.setHiddenTabs([...hiddenTabs]);
    }
  }

  /**
   * Hides a tab button in the UI by adding it to the hiddenTabs list in the store.
   * Duplicate tabs are ignored.
   *
   * @param tab - The ID of the tab to hide.
   */
  hideTabButton(tab: string): void {
    const uiState = this.#getStoreUIState();
    const { hiddenTabs } = uiState;

    // Only add if not already hidden
    if (!hiddenTabs.includes(tab)) {
      uiState.actions.setHiddenTabs([...hiddenTabs, tab]);
    }
  }

  setActiveFooterBarTab(tab: string | undefined): void {
    this.#getStoreUIState().actions.setActiveFooterBarTab(tab);
  }

  /**
   * Gets the active app bar tab from the store.
   *
   * @returns The active app bar tab info.
   */
  getActiveAppBarTab(): ActiveAppBarTabType {
    return getStoreActiveAppBarTab(this.getMapId());
  }

  setActiveAppBarTab(tab: string | undefined, isOpen: boolean, isFocusTrapped: boolean): void {
    this.#getStoreUIState().actions.setActiveAppBarTab(tab, isOpen, isFocusTrapped);
  }

  setFooterBarIsOpen(isOpen: boolean): void {
    this.#getStoreUIState().actions.setFooterBarIsOpen(isOpen);
  }

  enableFocusTrap(uiFocus: FocusItemProps): void {
    this.#getStoreUIState().actions.enableFocusTrap(uiFocus);
  }

  disableFocusTrap(callbackElementId?: string): void {
    this.#getStoreUIState().actions.disableFocusTrap(callbackElementId);
  }

  setActiveTrapGeoView(active: boolean): void {
    this.#getStoreUIState().actions.setActiveTrapGeoView(active);
  }

  setFooterPanelResizeValue(value: number): void {
    this.#getStoreUIState().actions.setFooterPanelResizeValue(value);
  }

  setCircularProgress(active: boolean): void {
    this.#getStoreAppState().actions.setCircularProgress(active);
  }

  setDisplayTheme(theme: TypeDisplayTheme): void {
    this.#getStoreAppState().actions.setDisplayTheme(theme);
  }

  setDisplayDateTimezone(displayDateTimezone: TimeIANA): void {
    this.#getStoreAppState().actions.setDisplayDateTimezone(displayDateTimezone);
  }

  setCrosshairActive(active: boolean): void {
    this.#getStoreAppState().actions.setCrosshairActive(active);
  }

  setFullScreen(active: boolean): void {
    this.#getStoreAppState().actions.setFullScreenActive(active);
  }

  async addNotification(notification: NotificationDetailsType): Promise<void> {
    // Because notification is called before map is created, we use the async
    // version of getAppStateAsync
    const appState = await this.#getStoreAppStateAsync();
    const curNotifications = appState.notifications;

    // if the notification already exist, we increment the count
    const existingNotif = curNotifications.find(
      (item) => item.message === notification.message && item.notificationType === notification.notificationType
    );

    if (!existingNotif) {
      curNotifications.push({
        key: notification.key,
        notificationType: notification.notificationType,
        message: notification.message,
        count: 1,
      });
    } else {
      existingNotif.count += 1;
    }

    appState.actions.setNotifications(curNotifications);
  }

  removeNotification(key: string): void {
    // Get store state
    const appState = this.#getStoreAppState();

    // Filter out notification
    const notifications = appState.notifications.filter((item: NotificationDetailsType) => item.key !== key);
    appState.actions.setNotifications(notifications);
  }

  removeAllNotifications(): void {
    this.#getStoreAppState().actions.setNotifications([]);
  }

  setGuide(guide: TypeGuideObject): void {
    this.#getStoreAppState().actions.setGuide(guide);
  }

  #setDisplayLanguage(lang: TypeDisplayLanguage): void {
    this.#getStoreAppState().actions.setDisplayLanguage(lang);
  }

  /**
   * Retrieves the UI state from the GeoView store for the current map.
   *
   * @returns The UI state.
   */
  #getStoreUIState(): IUIState {
    return getGeoViewStore(this.getMapId()).getState().uiState;
  }

  /**
   * Retrieves the app state from the GeoView store for the current map.
   *
   * @returns The app state.
   */
  #getStoreAppState(): IAppState {
    return getGeoViewStore(this.getMapId()).getState().appState;
  }

  /**
   * Retrieves the app state from the GeoView store for the current map.
   *
   * @returns A Promise of an app state.
   */
  async #getStoreAppStateAsync(): Promise<IAppState> {
    return (await getGeoViewStoreAsync(this.getMapId())).getState().appState;
  }
}
