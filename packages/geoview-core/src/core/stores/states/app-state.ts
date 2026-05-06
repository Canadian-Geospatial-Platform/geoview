import { useStore } from 'zustand';

import type { DisplayDateMode, TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { VALID_DISPLAY_LANGUAGE } from '@/api/types/map-schema-types';
import type { TypeInitialGeoviewLayerType } from '@/api/types/layer-schema-types';
import { getGeoViewStore, getGeoViewStoreAsync, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { getScriptAndAssetURL } from '@/core/utils/utilities';
import type { TimeIANA, TypeDisplayDateDefaults } from '@/core/utils/date-mgt';
import { DateMgt } from '@/core/utils/date-mgt';

// #region INTERFACE DEFINITION

/**
 * Represents the application-level Zustand store slice.
 *
 * Holds global settings such as display language, theme, date formatting,
 * notification state, and various UI toggles.
 */
export interface IAppState {
  /** Layer types that are disabled and cannot be added to the map. */
  disabledLayerTypes: TypeInitialGeoviewLayerType[];

  /** The current display language of the viewer (e.g. 'en' or 'fr'). */
  displayLanguage: TypeDisplayLanguage;

  /** The date display mode controlling how dates are formatted (e.g. 'iso', 'default'). */
  displayDateMode: DisplayDateMode;

  /** The IANA timezone used when displaying dates (e.g. 'local', 'America/Toronto'). */
  displayDateTimezone: TimeIANA;

  /** The current UI theme applied to the viewer. */
  displayTheme: TypeDisplayTheme;

  /** The guide content object rendered in the guide panel. */
  guide: TypeGuideObject | undefined;

  /** The URL of the geolocator service used for address/location searches. */
  geolocatorServiceURL: string | undefined;

  /** The URL of the metadata service used for layer metadata lookups. */
  metadataServiceURL: string | undefined;

  /** The root HTML element that hosts the GeoView map instance. */
  geoviewHTMLElement: HTMLElement;

  /** The current height (in pixels) of the map container. */
  height: number;

  /** The base URL for GeoView static assets (scripts, images, etc.). */
  geoviewAssetsURL: string;

  /** Whether the circular progress indicator is currently displayed. */
  isCircularProgressActive: boolean;

  /** Whether the map crosshairs overlay is currently active. */
  isCrosshairsActive: boolean;

  /** Whether the viewer is currently in fullscreen mode. */
  isFullscreenActive: boolean;

  /** The list of active notification messages shown to the user. */
  notifications: Array<NotificationDetailsType>;

  /** Whether to display features that have no associated symbology. */
  showUnsymbolizedFeatures: boolean;

  /** Whether to display highlight bounding boxes around layer features. */
  showLayerHighlightLayerBbox: boolean;

  /**
   * Applies default configuration values from the map config to the store.
   *
   * @param geoviewConfig - The map features configuration to extract defaults from.
   */
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  /** Store actions callable from adaptors. */
  actions: {
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

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes an App State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized App State
 */
export function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState {
  return {
    // TODO: REFACTOR - DEFAULT VALUES - There's confusion on where the actual default values are coming from
    // TO.DOCONT: Some are coming from DEFAULT_MAP_FEATURE_CONFIG and some are hardcoded here and some are elsewhere.
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

    actions: {
      /**
       * Sets the circularProgress state.
       *
       * @param isCircularProgressActive - The new state.
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
       *
       * @param isCrosshairsActive - The new state.
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
       *
       * @param displayLanguage - The new language.
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
       *
       * @param displayDateMode - The display date mode.
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
       *
       * @param displayDateTimezone - The display date timezone.
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
       *
       * @param displayTheme - The new theme.
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
       *
       * @param isFullscreenActive - The new state.
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
       *
       * @param guide - The new guide object.
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
       *
       * @param notifications - The new notifications.
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
  };
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full app state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map id for the App State to read
 * @returns The App State for the given map.
 */
// GV No export for the main state!
const getStoreAppState = (mapId: string): IAppState => getGeoViewStore(mapId).getState().appState;

/**
 * Gets whether the circular progress indicator is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the progress indicator is active.
 */
export const getStoreAppIsCircularProgressActive = (mapId: string): boolean => getStoreAppState(mapId).isCircularProgressActive;

/** Hook that returns whether the circular progress indicator is active. */
export const useStoreAppIsCircularProgressActive = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.appState.isCircularProgressActive);

/**
 * Gets whether the crosshairs overlay is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if crosshairs are active.
 */
export const getStoreAppIsCrosshairsActive = (mapId: string): boolean => getStoreAppState(mapId).isCrosshairsActive;

/** Hook that returns whether the crosshairs overlay is active. */
export const useStoreAppIsCrosshairsActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);

/**
 * Gets the disabled layer types for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The list of disabled layer types.
 */
export const getStoreAppDisabledLayerTypes = (mapId: string): TypeInitialGeoviewLayerType[] => getStoreAppState(mapId).disabledLayerTypes;

/** Hook that returns the list of disabled layer types. */
export const useStoreAppDisabledLayerTypes = (): TypeInitialGeoviewLayerType[] =>
  useStore(useGeoViewStore(), (state) => state.appState.disabledLayerTypes);

/**
 * Gets the display language for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display language.
 */
export const getStoreAppDisplayLanguage = (mapId: string): TypeDisplayLanguage => getStoreAppState(mapId).displayLanguage;

/** Hook that returns the current display language. */
export const useStoreAppDisplayLanguage = (): TypeDisplayLanguage => useStore(useGeoViewStore(), (state) => state.appState.displayLanguage);

/**
 * Hook that returns the display language for a specific map by its id.
 *
 * Used in app-start.tsx before the GeoView context is assigned to the map.
 * Do not use this technique elsewhere; it is only intended for reloading language and theme.
 *
 * @param mapId - The map identifier.
 * @returns The display language for the given map.
 */
// GV This hook uses getGeoViewStore, because of the context not being ready at the time this hook is used in app-start.
export const useStoreAppDisplayLanguageById = (mapId: string): TypeDisplayLanguage =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.displayLanguage);

/**
 * Gets the display theme for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display theme.
 */
export const getStoreAppDisplayTheme = (mapId: string): TypeDisplayTheme => getStoreAppState(mapId).displayTheme;

/** Hook that returns the current display theme. */
export const useStoreAppDisplayTheme = (): TypeDisplayTheme => useStore(useGeoViewStore(), (state) => state.appState.displayTheme);

/**
 * Hook that returns the display theme for a specific map by its id.
 *
 * Used in app-start.tsx before the GeoView context is assigned to the map.
 * Do not use this technique elsewhere; it is only intended for reloading language and theme.
 *
 * @param mapId - The map identifier.
 * @returns The display theme for the given map.
 */
// GV This hook uses getGeoViewStore, because of the context not being ready at the time this hook is used in app-start.
export const useStoreAppDisplayThemeById = (mapId: string): TypeDisplayTheme =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.displayTheme);

/**
 * Gets the display date mode for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display date mode.
 */
export const getStoreAppDisplayDateMode = (mapId: string): DisplayDateMode => getStoreAppState(mapId).displayDateMode;

/** Hook that returns the current display date mode. */
export const useStoreAppDisplayDateMode = (): DisplayDateMode => useStore(useGeoViewStore(), (state) => state.appState.displayDateMode);

/**
 * Gets the display date timezone for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The IANA timezone string.
 */
export const getStoreAppDisplayDateTimezone = (mapId: string): TimeIANA => getStoreAppState(mapId).displayDateTimezone;

/** Hook that returns the current display date timezone. */
export const useStoreAppDisplayDateTimezone = (): TimeIANA => useStore(useGeoViewStore(), (state) => state.appState.displayDateTimezone);

/**
 * Gets whether fullscreen mode is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if fullscreen is active.
 */
export const getStoreAppIsFullscreenActive = (mapId: string): boolean => getStoreAppState(mapId).isFullscreenActive;

/** Hook that returns whether fullscreen mode is active. */
export const useStoreAppIsFullscreenActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);

/**
 * Gets the geolocator service URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The geolocator service URL, or undefined if not configured.
 */
export const getStoreAppGeolocatorServiceURL = (mapId: string): string | undefined => getStoreAppState(mapId).geolocatorServiceURL;

/** Hook that returns the geolocator service URL. */
export const useStoreAppGeolocatorServiceURL = (): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.appState.geolocatorServiceURL);

/**
 * Gets the metadata service URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The metadata service URL, or undefined if not configured.
 */
export const getStoreAppMetadataServiceURL = (mapId: string): string | undefined => getStoreAppState(mapId).metadataServiceURL;

/** Hook that returns the metadata service URL. */
export const useStoreAppMetadataServiceURL = (): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.appState.metadataServiceURL);

/**
 * Gets the root GeoView HTML element for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The HTML element hosting the map.
 */
export const getStoreAppGeoviewHTMLElement = (mapId: string): HTMLElement => getStoreAppState(mapId).geoviewHTMLElement;

/** Hook that returns the root GeoView HTML element for the current map. */
export const useStoreAppGeoviewHTMLElement = (): HTMLElement => useStore(useGeoViewStore(), (state) => state.appState.geoviewHTMLElement);

/**
 * Gets the map container height for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The height in pixels.
 */
export const getStoreAppHeight = (mapId: string): number => getStoreAppState(mapId).height;

/** Hook that returns the current map container height in pixels. */
export const useStoreAppHeight = (): number => useStore(useGeoViewStore(), (state) => state.appState.height);

/**
 * Gets the GeoView assets base URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The assets base URL.
 */
export const getStoreAppGeoviewAssetsURL = (mapId: string): string => getStoreAppState(mapId).geoviewAssetsURL;

/** Hook that returns the base URL for GeoView static assets. */
export const useStoreAppGeoviewAssetsURL = (): string => useStore(useGeoViewStore(), (state) => state.appState.geoviewAssetsURL);

/**
 * Gets the guide content object for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The guide object, or undefined if not set.
 */
export const getStoreAppGuide = (mapId: string): TypeGuideObject | undefined => getStoreAppState(mapId).guide;

/** Hook that returns the guide content object. */
export const useStoreAppGuide = (): TypeGuideObject | undefined => useStore(useGeoViewStore(), (state) => state.appState.guide);

/**
 * Gets the list of active notifications for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The array of notifications.
 */
export const getStoreAppNotifications = (mapId: string): NotificationDetailsType[] => getStoreAppState(mapId).notifications;

/** Hook that returns the list of active notifications. */
export const useStoreAppNotifications = (): NotificationDetailsType[] =>
  useStore(useGeoViewStore(), (state) => state.appState.notifications);

/**
 * Gets whether unsymbolized features should be displayed for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if unsymbolized features should be shown.
 */
export const getStoreAppShowUnsymbolizedFeatures = (mapId: string): boolean => getStoreAppState(mapId).showUnsymbolizedFeatures;

/** Hook that returns whether unsymbolized features should be displayed. */
export const useStoreAppShowUnsymbolizedFeatures = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.appState.showUnsymbolizedFeatures);

// #endregion STATE GETTERS & HOOKS

// #region STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

/**
 * Hook that returns the shell container HTML element for the current map.
 *
 * Queries the DOM for the element whose id starts with `shell-{mapId}`.
 *
 * @returns The shell container element.
 */
export const useStoreAppShellContainer = (): HTMLElement => {
  const geoviewElement = useStoreAppGeoviewHTMLElement();
  const mapId = useStore(useGeoViewStore(), (state) => state.mapId);
  return geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;
};

/**
 * Gets whether to show highlight bounding boxes around layer features for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if layer highlight bboxes should be shown.
 */
export const getStoreAppShowLayerHighlightLayerBbox = (mapId: string): boolean => getStoreAppState(mapId).showLayerHighlightLayerBbox;

/**
 * Gets the default date format settings derived from the current display date mode.
 *
 * @param mapId - The map identifier.
 * @returns The default date display settings.
 */
export const getStoreAppDisplayDateFormatDefault = (mapId: string): TypeDisplayDateDefaults =>
  DateMgt.getDisplayDateDefaults(getStoreAppDisplayDateMode(mapId));

// #endregion STATE GETTERS & HOOKS - OTHERS (no match between getter-hook)

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the circular progress indicator active state.
 *
 * @param mapId - The map identifier
 * @param active - Whether the circular progress is active
 */
export const setStoreAppCircularProgress = (mapId: string, active: boolean): void => {
  getStoreAppState(mapId).actions.setCircularProgress(active);
};

/**
 * Sets the display language for the viewer.
 *
 * @param mapId - The map identifier
 * @param lang - The language code (e.g. 'en' or 'fr')
 */
export const setStoreAppDisplayLanguage = (mapId: string, lang: TypeDisplayLanguage): void => {
  getStoreAppState(mapId).actions.setDisplayLanguage(lang);
};

/**
 * Sets the display theme for the viewer.
 *
 * @param mapId - The map identifier
 * @param theme - The theme identifier
 */
export const setStoreAppDisplayTheme = (mapId: string, theme: TypeDisplayTheme): void => {
  getStoreAppState(mapId).actions.setDisplayTheme(theme);
};

/**
 * Sets the timezone for date display.
 *
 * @param mapId - The map identifier
 * @param displayDateTimezone - The IANA timezone identifier
 */
export const setStoreAppDisplayDateTimezone = (mapId: string, displayDateTimezone: TimeIANA): void => {
  getStoreAppState(mapId).actions.setDisplayDateTimezone(displayDateTimezone);
};

/**
 * Sets the crosshair overlay active state.
 *
 * @param mapId - The map identifier
 * @param active - Whether the crosshairs are active
 */
export const setStoreAppCrosshairActive = (mapId: string, active: boolean): void => {
  getStoreAppState(mapId).actions.setCrosshairActive(active);
};

/**
 * Sets the fullscreen mode active state.
 *
 * @param mapId - The map identifier
 * @param active - Whether fullscreen mode is active
 */
export const setStoreAppFullScreenActive = (mapId: string, active: boolean): void => {
  getStoreAppState(mapId).actions.setFullScreenActive(active);
};

/**
 * Adds a notification to the store or increments the count if it already exists.
 *
 * Uses async store retrieval because notifications may be called before the map is created.
 *
 * @param mapId - The map identifier
 * @param notification - The notification details to add
 * @returns A promise that resolves when the notification has been added
 */
export const addStoreAppNotification = async (mapId: string, notification: NotificationDetailsType): Promise<void> => {
  // Because notification is called before map is created, we use the async
  // version of getAppStateAsync
  const appState = await getGeoViewStoreAsync(mapId).then((store) => store.getState().appState);
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
};

/**
 * Removes a notification from the store by key.
 *
 * Uses async store retrieval because notifications may be called before the map is created.
 *
 * @param mapId - The map identifier
 * @param key - The unique key of the notification to remove
 * @returns A promise that resolves when the notification has been removed
 */
export const removeStoreAppNotification = async (mapId: string, key: string): Promise<void> => {
  // Because notification is called before map is created, we use the async
  // version of getAppStateAsync
  const appState = await getGeoViewStoreAsync(mapId).then((store) => store.getState().appState);

  // Filter out notification
  const notifications = appState.notifications.filter((item: NotificationDetailsType) => item.key !== key);
  appState.actions.setNotifications(notifications);
};

/**
 * Removes all notifications from the store.
 *
 * @param mapId - The map identifier
 */
export const removeStoreAppAllNotifications = (mapId: string): void => {
  getStoreAppState(mapId).actions.setNotifications([]);
};

/**
 * Sets the guide content object to be rendered in the guide panel.
 *
 * @param mapId - The map identifier
 * @param guide - The guide object to display
 */
export const setStoreAppGuide = (mapId: string, guide: TypeGuideObject): void => {
  getStoreAppState(mapId).actions.setGuide(guide);
};

// #endregion STATE ADAPTORS

/**
 * Represents a hierarchical guide content structure.
 *
 * Each key is a heading identifier mapping to an object containing
 * the heading text, content body, and optional nested children.
 */
export interface TypeGuideObject {
  [heading: string]: {
    /** The HTML or Markdown content body for this guide section. */
    content: string;

    /** The display heading text for this guide section. */
    heading: string;

    /** Optional nested child guide sections. */
    children?: TypeGuideObject;
  };
}
