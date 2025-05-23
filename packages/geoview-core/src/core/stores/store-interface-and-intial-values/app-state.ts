import { useStore } from 'zustand';
import { TypeDisplayLanguage, TypeDisplayTheme, TypeGeoviewLayerTypeWithGeoCore } from '@/api/config/types/map-schema-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { NotificationDetailsType } from '@/core/components/notifications/notifications';
import { TypeHTMLElement, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { getScriptAndAssetURL } from '@/core/utils/utilities';
import { VALID_DISPLAY_LANGUAGE } from '@/api/config/types/config-constants';
import { SnackbarType } from '@/core/utils/notifications';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with AppEventProcessor vs AppState

// #region INTERFACES & TYPES

type AppActions = IAppState['actions'];

export interface IAppState {
  disabledLayerTypes: TypeGeoviewLayerTypeWithGeoCore[];
  displayLanguage: TypeDisplayLanguage;
  displayTheme: TypeDisplayTheme;
  guide: TypeGuideObject | undefined;
  geolocatorServiceURL: string | undefined;
  metadataServiceURL: string | undefined;
  geoviewHTMLElement: HTMLElement;
  height: number;
  geoviewAssetsURL: string;
  isCircularProgressActive: boolean;
  isCrosshairsActive: boolean;
  isFullscreenActive: boolean;
  notifications: Array<NotificationDetailsType>;
  showUnsymbolizedFeatures: boolean;

  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    addMessage: (type: SnackbarType, messageKey: string, param?: string[]) => void;
    addNotification: (notif: NotificationDetailsType) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => Promise<void>;
    setDisplayTheme: (theme: TypeDisplayTheme) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
    removeAllNotifications: () => void;
  };

  setterActions: {
    setCircularProgress: (active: boolean) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
    setDisplayTheme: (theme: TypeDisplayTheme) => void;
    setFullScreenActive: (active: boolean) => void;
    setGuide: (guide: TypeGuideObject) => void;
    setNotifications: (notifications: NotificationDetailsType[]) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes an App State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IAppState} - The initialized App State
 */
export function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState {
  return {
    disabledLayerTypes: [],
    displayLanguage: 'en' as TypeDisplayLanguage,
    displayTheme: 'geo.ca',
    guide: {},
    geolocatorServiceURL: '',
    metadataServiceURL: '',
    geoviewHTMLElement: document.createElement('div'), // create an empty div before real one is assigned
    height: 0,
    geoviewAssetsURL: getScriptAndAssetURL(),
    isCircularProgressActive: false,
    isCrosshairsActive: false,
    isFullscreenActive: false,
    notifications: [],
    showUnsymbolizedFeatures: false,

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      const lang = VALID_DISPLAY_LANGUAGE.includes(geoviewConfig.displayLanguage as TypeDisplayLanguage)
        ? geoviewConfig.displayLanguage
        : 'en';

      set({
        appState: {
          ...get().appState,
          disabledLayerTypes: geoviewConfig.globalSettings?.disabledLayerTypes || [],
          displayLanguage: lang as TypeDisplayLanguage,
          displayTheme: geoviewConfig.theme || 'geo.ca',
          geolocatorServiceURL: geoviewConfig.serviceUrls?.geolocatorUrl,
          metadataServiceURL: geoviewConfig.serviceUrls?.metadataUrl,
          geoviewHTMLElement: document.getElementById(get().mapId)!,
          height: document.getElementById(get().mapId)?.clientHeight || 600,
          showUnsymbolizedFeatures: geoviewConfig.globalSettings?.showUnsymbolizedFeatures || false,
        },
      });
    },

    // #region ACTIONS

    actions: {
      /**
       * Adds a snackbar message.
       * @param {SnackbarType} type - The type of message.
       * @param {string} messageKey - The message.
       * @param {string} param - Optional param to replace in the string if it is a key
       */
      addMessage: (type: SnackbarType, messageKey: string, param?: string[]): void => {
        // Redirect to processor
        AppEventProcessor.addMessage(get().mapId, type, messageKey, param);
      },

      /**
       * Adds a notification.
       * @param {NotificationDetailsType} notif - The notification to add.
       */
      addNotification: (notif: NotificationDetailsType): void => {
        // Redirect to processor
        AppEventProcessor.addNotification(get().mapId, notif).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('AppEventProcessor.addNotification in actions.addNotification in appState', error);
        });
      },

      /**
       * Sets the isCrosshairsActive state.
       * @param {boolean} active - The interaction type.
       */
      setCrosshairActive: (active: boolean) => {
        // Redirect to setter
        get().appState.setterActions.setCrosshairActive(active);
      },

      /**
       * Sets the display language.
       * @param {TypeDisplayLanguage} lang - The new display language.
       * @returns {Promise<void>}
       */
      setDisplayLanguage: (lang: TypeDisplayLanguage): Promise<void> => {
        // Redirect to processor
        return AppEventProcessor.setDisplayLanguage(get().mapId, lang);
      },

      /**
       * Sets the theme.
       * @param {TypeDisplayTheme} theme - The new theme.
       */
      setDisplayTheme: (theme: TypeDisplayTheme): void => {
        // Redirect to setter
        get().appState.setterActions.setDisplayTheme(theme);
      },

      /**
       * Set full screen state.
       * @param {boolean} active - New full screen state.
       * @param {TypeHTMLElement} element - The element to make full screen.
       */
      setFullScreenActive: (active: boolean, element?: TypeHTMLElement): void => {
        // Redirect to processor
        AppEventProcessor.setFullscreen(get().mapId, active, element);
      },

      /**
       * Remove a notification.
       * @param {string} key - The key of the notification to remove.
       */
      removeNotification: (key: string): void => {
        // Redirect to processor
        AppEventProcessor.removeNotification(get().mapId, key);
      },
      /**
       * Remove all notifications.
       */
      removeAllNotifications: (): void => {
        // Redirect to processor
        AppEventProcessor.removeAllNotifications(get().mapId);
      },
    },

    setterActions: {
      /**
       * Sets the circularProgress state.
       * @param {boolean} active - The new state.
       */
      setCircularProgress: (active: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCircularProgressActive: active,
          },
        });
      },

      /**
       * Sets the isCrosshairsActive state.
       * @param {boolean} active - The new state.
       */
      setCrosshairActive: (active: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCrosshairsActive: active,
          },
        });
      },

      /**
       * Sets the display language.
       * @param {TypeDisplayLanguage} lang - The new language.
       */
      setDisplayLanguage: (lang: TypeDisplayLanguage): void => {
        set({
          appState: {
            ...get().appState,
            displayLanguage: lang,
          },
        });
      },

      /**
       * Sets the display theme.
       * @param {TypeDisplayTheme} theme - The new theme.
       */
      setDisplayTheme: (theme: TypeDisplayTheme): void => {
        set({
          appState: {
            ...get().appState,
            displayTheme: theme,
          },
        });

        // also set the theme from original config for reloading purpose
        const config = get().mapConfig;
        config!.theme = theme;
        set({ mapConfig: config });
      },

      /**
       * Sets the isFullscreenActive state.
       * @param {boolean} active - The new state.
       */
      setFullScreenActive: (active: boolean): void => {
        set({
          appState: {
            ...get().appState,
            isFullscreenActive: active,
          },
        });
      },

      /**
       * Sets the guide.
       * @param {TypeGuideObject} guide - The new guide object.
       */
      setGuide: (guide: TypeGuideObject): void => {
        set({
          appState: {
            ...get().appState,
            guide,
          },
        });
      },

      /**
       * Sets the notifications.
       * @param {NotificationDetailsType[]} notifications - The new notifications.
       */
      setNotifications: (notifications: NotificationDetailsType[]): void => {
        set({
          appState: {
            ...get().appState,
            notifications: [...notifications],
          },
        });
      },
    },

    // #endregion ACTIONS
  } as IAppState;
}

export interface TypeGuideObject {
  [heading: string]: {
    content: string;
    heading: string;
    children?: TypeGuideObject;
  };
}

// **********************************************************
// App state selectors
// **********************************************************
export const useAppCircularProgressActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isCircularProgressActive);
export const useAppCrosshairsActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);
export const useAppDisabledLayerTypes = (): TypeGeoviewLayerTypeWithGeoCore[] =>
  useStore(useGeoViewStore(), (state) => state.appState.disabledLayerTypes);
export const useAppDisplayLanguage = (): TypeDisplayLanguage => useStore(useGeoViewStore(), (state) => state.appState.displayLanguage);
export const useAppDisplayTheme = (): TypeDisplayTheme => useStore(useGeoViewStore(), (state) => state.appState.displayTheme);
export const useAppFullscreenActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useAppGeolocatorServiceURL = (): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.appState.geolocatorServiceURL);
export const useAppMetadataServiceURL = (): string | undefined => useStore(useGeoViewStore(), (state) => state.appState.metadataServiceURL);
export const useAppGeoviewHTMLElement = (): HTMLElement => useStore(useGeoViewStore(), (state) => state.appState.geoviewHTMLElement);
export const useAppHeight = (): number => useStore(useGeoViewStore(), (state) => state.appState.height);
export const useAppGeoviewAssetsURL = (): string => useStore(useGeoViewStore(), (state) => state.appState.geoviewAssetsURL);
export const useAppGuide = (): TypeGuideObject | undefined => useStore(useGeoViewStore(), (state) => state.appState.guide);
export const useAppNotifications = (): NotificationDetailsType[] => useStore(useGeoViewStore(), (state) => state.appState.notifications);
export const useAppShowUnsymbolizedFeatures = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.appState.showUnsymbolizedFeatures);

// GV these 2 selectors are use in app-start.tsx before context is assigned to the map
// GV DO NOT USE this technique elsewhere, it is only to reload language and theme
export const useAppDisplayLanguageById = (mapId: string): TypeDisplayLanguage =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.displayLanguage);
export const useAppDisplayThemeById = (mapId: string): TypeDisplayTheme =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.displayTheme);

// Getter function for one-time access, there is no subcription to modification
export const getAppCrosshairsActive = (mapId: string): boolean => getGeoViewStore(mapId).getState().appState.isCrosshairsActive;

// Store Actions
export const useAppStoreActions = (): AppActions => useStore(useGeoViewStore(), (state) => state.appState.actions);
