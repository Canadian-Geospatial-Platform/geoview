import { useStore } from 'zustand';

import type { DisplayDateMode, TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { VALID_DISPLAY_LANGUAGE } from '@/api/types/map-schema-types';
import type { TypeInitialGeoviewLayerType } from '@/api/types/layer-schema-types';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { TypeHTMLElement, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { getScriptAndAssetURL } from '@/core/utils/utilities';
import { type TimeIANA } from '@/core/utils/date-mgt';
import type { SnackbarType } from '@/core/utils/notifications';
import { logger } from '@/core/utils/logger';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with AppEventProcessor vs AppState

// #region INTERFACES & TYPES

type AppActions = IAppState['actions'];

export interface IAppState {
  disabledLayerTypes: TypeInitialGeoviewLayerType[];
  displayLanguage: TypeDisplayLanguage;
  displayDateMode: DisplayDateMode;
  displayDateTimezone: TimeIANA;
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
  showLayerHighlightLayerBbox: boolean;

  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    addMessage: (type: SnackbarType, messageKey: string, param?: string[], notification?: boolean) => void;
    addNotification: (notif: NotificationDetailsType) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => Promise<void>;
    setDisplayDateTimezone: (displayDateTimezone: TimeIANA) => void;
    setDisplayTheme: (theme: TypeDisplayTheme) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
    removeAllNotifications: () => void;
  };

  setterActions: {
    setCircularProgress: (active: boolean) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
    setDisplayDateMode: (displayDateMode: DisplayDateMode) => void;
    setDisplayDateTimezone: (displayDateTimezone: TimeIANA) => void;
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
    // TODO: REFACTOR - There's confusion on where the actual default values are coming from, some are coming from DEFAULT_MAP_FEATURE_CONFIG and some are hardcoded here and some are elsewhere.
    // TO.DOCONT: We should standardize this so that all default values are coming from the same source of truth.
    disabledLayerTypes: [], // GV This value is irrelevant, because the real default value is coming from DEFAULT_MAP_FEATURE_CONFIG
    displayLanguage: 'en', // GV This value is irrelevant, because it's being defaulted to 'en' in multiple places throughout the code base, including in 'app.tsx.getMapConfig()' and app.tsx.renderMap() where in some cases the default is taken from
    displayDateMode: 'iso', // GV This value is irrelevant, because the real default value is coming from DEFAULT_MAP_FEATURE_CONFIG
    displayDateTimezone: 'local', // GV This is the actual default value
    displayTheme: 'geo.ca', // GV This value is irrelevant, because the real default value is coming somewhere, NOT in DEFAULT_MAP_FEATURE_CONFIG !?
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
    showLayerHighlightLayerBbox: true,

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      const lang = VALID_DISPLAY_LANGUAGE.includes(geoviewConfig.displayLanguage!) ? geoviewConfig.displayLanguage! : 'en';
      const geoviewHTMLElement = document.getElementById(get().mapId)!;
      set({
        appState: {
          ...get().appState,
          disabledLayerTypes: geoviewConfig.globalSettings?.disabledLayerTypes!, // Was defaulted so can use '!'
          displayLanguage: lang,
          displayDateMode: geoviewConfig.globalSettings?.displayDateMode!, // Was defaulted so can use '!'
          displayTheme: geoviewConfig.theme!, // Was defaulted so can use '!'
          geolocatorServiceURL: geoviewConfig.serviceUrls?.geolocatorUrl,
          metadataServiceURL: geoviewConfig.serviceUrls?.metadataUrl,
          geoviewHTMLElement,
          height: geoviewHTMLElement?.clientHeight || 600,
          showUnsymbolizedFeatures: geoviewConfig.globalSettings?.showUnsymbolizedFeatures!, // Was defaulted so can use '!'
          showLayerHighlightLayerBbox: geoviewConfig.globalSettings?.showLayerHighlightLayerBbox ?? true,
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
       * @param {boolean} [notification] - Optional param to indicate if the message should be added to notification panel
       * @returns {void}
       */
      addMessage: (type: SnackbarType, messageKey: string, param?: string[], notification?: boolean): void => {
        // Redirect to processor
        AppEventProcessor.addMessage(get().mapId, type, messageKey, param, notification);
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
       * @param {TypeDisplayLanguage} displayLanguage - The display language.
       * @returns {Promise<void>}
       */
      setDisplayLanguage: (displayLanguage: TypeDisplayLanguage): Promise<void> => {
        // Redirect to processor
        return AppEventProcessor.setDisplayLanguage(get().mapId, displayLanguage);
      },

      /**
       * Sets the display date timezone.
       * @param {TimeIANA} displayDateTimezone - The display date timezone.
       * @returns {void}
       */
      setDisplayDateTimezone: (displayDateTimezone: TimeIANA): void => {
        // Redirect to processor
        return AppEventProcessor.setDisplayDateTimezone(get().mapId, displayDateTimezone);
      },

      /**
       * Sets the theme.
       * @param {TypeDisplayTheme} displayTheme - The theme.
       */
      setDisplayTheme: (displayTheme: TypeDisplayTheme): void => {
        // Redirect to setter
        get().appState.setterActions.setDisplayTheme(displayTheme);
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
       * @param {boolean} isCircularProgressActive - The new state.
       */
      setCircularProgress: (isCircularProgressActive: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCircularProgressActive,
          },
        });
      },

      /**
       * Sets the isCrosshairsActive state.
       * @param {boolean} isCrosshairsActive - The new state.
       */
      setCrosshairActive: (isCrosshairsActive: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCrosshairsActive,
          },
        });
      },

      /**
       * Sets the display language.
       * @param {TypeDisplayLanguage} displayLanguage - The new language.
       */
      setDisplayLanguage: (displayLanguage: TypeDisplayLanguage): void => {
        set({
          appState: {
            ...get().appState,
            displayLanguage,
          },
        });
      },

      /**
       * Sets the display date mode.
       * @param {DisplayDateMode} displayDateMode - The display date mode.
       */
      setDisplayDateMode: (displayDateMode: DisplayDateMode): void => {
        set({
          appState: {
            ...get().appState,
            displayDateMode,
          },
        });
      },

      /**
       * Sets the display date timezone.
       * @param {TimeIANA} displayDateTimezone - The display date timezone.
       */
      setDisplayDateTimezone: (displayDateTimezone: TimeIANA): void => {
        set({
          appState: {
            ...get().appState,
            displayDateTimezone,
          },
        });
      },

      /**
       * Sets the display theme.
       * @param {TypeDisplayTheme} displayTheme - The new theme.
       */
      setDisplayTheme: (displayTheme: TypeDisplayTheme): void => {
        set({
          appState: {
            ...get().appState,
            displayTheme,
          },
        });

        // also set the theme from original config for reloading purpose
        const config = get().mapConfig;
        config!.theme = displayTheme;
        set({ mapConfig: config });
      },

      /**
       * Sets the isFullscreenActive state.
       * @param {boolean} isFullscreenActive - The new state.
       */
      setFullScreenActive: (isFullscreenActive: boolean): void => {
        set({
          appState: {
            ...get().appState,
            isFullscreenActive,
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
export const useAppDisabledLayerTypes = (): TypeInitialGeoviewLayerType[] =>
  useStore(useGeoViewStore(), (state) => state.appState.disabledLayerTypes);
export const useAppDisplayLanguage = (): TypeDisplayLanguage => useStore(useGeoViewStore(), (state) => state.appState.displayLanguage);
export const useAppDisplayDateMode = (): DisplayDateMode => useStore(useGeoViewStore(), (state) => state.appState.displayDateMode);
export const useDisplayDateTimezone = (): TimeIANA => useStore(useGeoViewStore(), (state) => state.appState.displayDateTimezone);
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

export const useAppShellContainer = (): HTMLElement => {
  const geoviewElement = useAppGeoviewHTMLElement();
  const mapId = useStore(useGeoViewStore(), (state) => state.mapId);
  return geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;
};

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
