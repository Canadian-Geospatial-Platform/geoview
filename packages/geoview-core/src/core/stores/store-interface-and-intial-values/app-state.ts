import { useStore } from 'zustand';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeDisplayLanguage, TypeDisplayTheme } from '@/geo/map/map-schema-types';
import { NotificationDetailsType } from '@/core/components/notifications/notifications';
import { TypeHTMLElement, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

export interface IAppState {
  displayLanguage: TypeDisplayLanguage;
  displayTheme: TypeDisplayTheme;
  guide: TypeGuideObject | undefined;
  isCircularProgressActive: boolean;
  isCrosshairsActive: boolean;
  isFullscreenActive: boolean;
  notifications: Array<NotificationDetailsType>;
  geolocatorServiceURL: string | undefined;
  suportedLanguages: TypeDisplayLanguage[];

  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    addNotification: (notif: NotificationDetailsType) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
    setDisplayTheme: (theme: TypeDisplayTheme) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
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

/**
 * Initializes an App State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns The initialized Map State
 */
export function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState {
  return {
    displayLanguage: 'en' as TypeDisplayLanguage,
    displayTheme: 'geo.ca',
    guide: {},
    isCircularProgressActive: false,
    isCrosshairsActive: false,
    isFullscreenActive: false,
    notifications: [],
    geolocatorServiceURL: '',
    suportedLanguages: [],

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        appState: {
          ...get().appState,
          displayLanguage: geoviewConfig.displayLanguage as TypeDisplayLanguage,
          displayTheme: geoviewConfig.theme || 'geo.ca',
          geolocatorServiceURL: geoviewConfig.serviceUrls?.geolocator,
          suportedLanguages: geoviewConfig.suportedLanguages,
        },
      });
    },

    // #region ACTIONS
    actions: {
      /**
       * Adds a notification.
       * @returns {NotificationDetailsType} notif The notification to add.
       */
      addNotification: (notif: NotificationDetailsType): void => {
        // Redirect to processor
        AppEventProcessor.addNotification(get().mapId, notif);
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
       */
      setDisplayLanguage: (lang: TypeDisplayLanguage) => {
        // Redirect to processor
        AppEventProcessor.setDisplayLanguage(get().mapId, lang);
      },

      /**
       * Sets the theme.
       * @param {TypeDisplayTheme} theme - The new theme.
       */
      setDisplayTheme: (theme: TypeDisplayTheme) => {
        // Redirect to setter
        get().appState.setterActions.setDisplayTheme(theme);
      },

      /**
       * Set full screen state.
       * @param {boolean} active - New full screen state.
       * @param {TypeHTMLElement} element - The element to make full screen.
       */
      setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => {
        // Redirect to processor
        AppEventProcessor.setFullscreen(get().mapId, active, element);
      },

      /**
       * Remove a notification.
       * @param {string} key - The key of the notification to remove.
       */
      removeNotification: (key: string) => {
        // Redirect to processor
        AppEventProcessor.removeNotification(get().mapId, key);
      },
    },
    // #endregion ACTIONS

    // #region SETTER ACTIONS
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
    // #endregion SETTER ACTIONS
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
export const useAppCircularProgressActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCircularProgressActive);
export const useAppCrosshairsActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);
export const useAppDisplayLanguage = () => useStore(useGeoViewStore(), (state) => state.appState.displayLanguage);
export const useAppDisplayTheme = () => useStore(useGeoViewStore(), (state) => state.appState.displayTheme);
export const useAppFullscreenActive = () => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useAppGeolocatorServiceURL = () => useStore(useGeoViewStore(), (state) => state.appState.geolocatorServiceURL);
export const useAppGuide = () => useStore(useGeoViewStore(), (state) => state.appState.guide);
export const useAppNotifications = () => useStore(useGeoViewStore(), (state) => state.appState.notifications);
export const useAppSuportedLanguages = () => useStore(useGeoViewStore(), (state) => state.appState.suportedLanguages);

// GV these 2 selector are use in app-start.tsx before context is assigned to the map
// GV DO NOT USE this technique elsewhere, it is only to reload language and theme
export const useAppDisplayLanguageById = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.appState.displayLanguage);
export const useAppDisplayThemeById = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.appState.displayTheme);

export const useAppStoreActions = () => useStore(useGeoViewStore(), (state) => state.appState.actions);
