import { useStore } from 'zustand';

import type { DisplayDateMode, TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import { VALID_DISPLAY_LANGUAGE } from '@/api/types/map-schema-types';
import type { TypeInitialGeoviewLayerType } from '@/api/types/layer-schema-types';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { getScriptAndAssetURL } from '@/core/utils/utilities';
import { DateMgt, type TimeIANA, type TypeDisplayDateDefaults } from '@/core/utils/date-mgt';

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
    /**
     * Sets the circular progress indicator visibility.
     *
     * @param active - Whether the progress indicator should be shown.
     */
    setCircularProgress: (active: boolean) => void;
    /**
     * Sets the crosshairs overlay visibility.
     *
     * @param active - Whether the crosshairs should be shown.
     */
    setCrosshairActive: (active: boolean) => void;
    /**
     * Sets the display language of the viewer.
     *
     * @param lang - The language to switch to.
     */
    setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
    /**
     * Sets the date display mode.
     *
     * @param displayDateMode - The date display mode to apply.
     */
    setDisplayDateMode: (displayDateMode: DisplayDateMode) => void;
    /**
     * Sets the display date timezone.
     *
     * @param displayDateTimezone - The IANA timezone to use for date display.
     */
    setDisplayDateTimezone: (displayDateTimezone: TimeIANA) => void;
    /**
     * Sets the display theme.
     *
     * @param theme - The theme to apply.
     */
    setDisplayTheme: (theme: TypeDisplayTheme) => void;
    /**
     * Sets the fullscreen mode state.
     *
     * @param active - Whether fullscreen mode should be active.
     */
    setFullScreenActive: (active: boolean) => void;
    /**
     * Sets the guide content object.
     *
     * @param guide - The guide object to store.
     */
    setGuide: (guide: TypeGuideObject) => void;
    /**
     * Replaces all current notifications with the provided list.
     *
     * @param notifications - The new set of notifications.
     */
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
  } as IAppState;
}

// #endregion STATE INITIALIZATION

// #region STATE HOOKS
// GV To be used by React components

/** Hook that returns whether the circular progress indicator is active. */
export const useAppCircularProgressActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isCircularProgressActive);

/** Hook that returns whether the crosshairs overlay is active. */
export const useAppCrosshairsActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);

/** Hook that returns the list of disabled layer types. */
export const useAppDisabledLayerTypes = (): TypeInitialGeoviewLayerType[] =>
  useStore(useGeoViewStore(), (state) => state.appState.disabledLayerTypes);

/** Hook that returns the current display language. */
export const useAppDisplayLanguage = (): TypeDisplayLanguage => useStore(useGeoViewStore(), (state) => state.appState.displayLanguage);

/** Hook that returns the current display date mode. */
export const useAppDisplayDateMode = (): DisplayDateMode => useStore(useGeoViewStore(), (state) => state.appState.displayDateMode);

/** Hook that returns the current display date timezone. */
export const useDisplayDateTimezone = (): TimeIANA => useStore(useGeoViewStore(), (state) => state.appState.displayDateTimezone);

/** Hook that returns the current display theme. */
export const useAppDisplayTheme = (): TypeDisplayTheme => useStore(useGeoViewStore(), (state) => state.appState.displayTheme);

/** Hook that returns whether fullscreen mode is active. */
export const useAppFullscreenActive = (): boolean => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);

/** Hook that returns the geolocator service URL. */
export const useAppGeolocatorServiceURL = (): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.appState.geolocatorServiceURL);

/** Hook that returns the metadata service URL. */
export const useAppMetadataServiceURL = (): string | undefined => useStore(useGeoViewStore(), (state) => state.appState.metadataServiceURL);

/** Hook that returns the root GeoView HTML element for the current map. */
export const useAppGeoviewHTMLElement = (): HTMLElement => useStore(useGeoViewStore(), (state) => state.appState.geoviewHTMLElement);

/** Hook that returns the current map container height in pixels. */
export const useAppHeight = (): number => useStore(useGeoViewStore(), (state) => state.appState.height);

/** Hook that returns the base URL for GeoView static assets. */
export const useAppGeoviewAssetsURL = (): string => useStore(useGeoViewStore(), (state) => state.appState.geoviewAssetsURL);

/** Hook that returns the guide content object. */
export const useAppGuide = (): TypeGuideObject | undefined => useStore(useGeoViewStore(), (state) => state.appState.guide);

/** Hook that returns the list of active notifications. */
export const useAppNotifications = (): NotificationDetailsType[] => useStore(useGeoViewStore(), (state) => state.appState.notifications);

/** Hook that returns whether unsymbolized features should be displayed. */
export const useAppShowUnsymbolizedFeatures = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.appState.showUnsymbolizedFeatures);

/**
 * Hook that returns the shell container HTML element for the current map.
 *
 * Queries the DOM for the element whose id starts with `shell-{mapId}`.
 *
 * @returns The shell container element.
 */
export const useAppShellContainer = (): HTMLElement => {
  const geoviewElement = useAppGeoviewHTMLElement();
  const mapId = useStore(useGeoViewStore(), (state) => state.mapId);
  return geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;
};

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
export const useAppDisplayLanguageById = (mapId: string): TypeDisplayLanguage =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.displayLanguage);

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
export const useAppDisplayThemeById = (mapId: string): TypeDisplayTheme =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.displayTheme);

// #endregion STATE HOOKS

// #region STATE SELECTORS
// GV Should only be used specifically to access the Store.
// GV Use sparingly and only if you are sure of what you are doing.
// GV DO NOT USE this technique in React components, use the hooks above instead.

/**
 * Returns the full app state slice for the given map.
 *
 * Internal-only selector — not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map id for the App State to read
 * @returns The App State for the given map.
 */
// GV No export for the main state!
const getStoreAppState = (mapId: string): IAppState => getGeoViewStore(mapId).getState().appState;

/**
 * Gets the disabled layer types for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The list of disabled layer types.
 */
export const getStoreDisabledLayerTypes = (mapId: string): TypeInitialGeoviewLayerType[] => getStoreAppState(mapId).disabledLayerTypes;

/**
 * Gets the display date mode for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display date mode.
 */
export const getStoreDisplayDateMode = (mapId: string): DisplayDateMode => getStoreAppState(mapId).displayDateMode;

/**
 * Gets the display date timezone for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The IANA timezone string.
 */
export const getStoreDisplayDateTimezone = (mapId: string): TimeIANA => getStoreAppState(mapId).displayDateTimezone;

/**
 * Gets the display language for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display language.
 */
export const getStoreDisplayLanguage = (mapId: string): TypeDisplayLanguage => getStoreAppState(mapId).displayLanguage;

/**
 * Gets the display theme for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display theme.
 */
export const getStoreDisplayTheme = (mapId: string): TypeDisplayTheme => getStoreAppState(mapId).displayTheme;

/**
 * Gets the default date format settings derived from the current display date mode.
 *
 * @param mapId - The map identifier.
 * @returns The default date display settings.
 */
export const getStoreDisplayDateFormatDefault = (mapId: string): TypeDisplayDateDefaults =>
  DateMgt.getDisplayDateDefaults(getStoreDisplayDateMode(mapId));

/**
 * Gets the geolocator service URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The geolocator service URL, or undefined if not configured.
 */
export const getStoreGeolocatorServiceURL = (mapId: string): string | undefined => getStoreAppState(mapId).geolocatorServiceURL;

/**
 * Gets the GeoView assets base URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The assets base URL.
 */
export const getStoreGeoviewAssetsURL = (mapId: string): string => getStoreAppState(mapId).geoviewAssetsURL;

/**
 * Gets the root GeoView HTML element for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The HTML element hosting the map.
 */
export const getStoreGeoviewHTMLElement = (mapId: string): HTMLElement => getStoreAppState(mapId).geoviewHTMLElement;

/**
 * Gets the guide content object for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The guide object, or undefined if not set.
 */
export const getStoreGuide = (mapId: string): TypeGuideObject | undefined => getStoreAppState(mapId).guide;

/**
 * Gets the map container height for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The height in pixels.
 */
export const getStoreHeight = (mapId: string): number => getStoreAppState(mapId).height;

/**
 * Gets whether the circular progress indicator is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the progress indicator is active.
 */
export const getStoreIsCircularProgressActive = (mapId: string): boolean => getStoreAppState(mapId).isCircularProgressActive;

/**
 * Gets whether the crosshairs overlay is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if crosshairs are active.
 */
export const getStoreIsCrosshairsActive = (mapId: string): boolean => getStoreAppState(mapId).isCrosshairsActive;

/**
 * Gets whether fullscreen mode is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if fullscreen is active.
 */
export const getStoreIsFullscreenActive = (mapId: string): boolean => getStoreAppState(mapId).isFullscreenActive;

/**
 * Gets the metadata service URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The metadata service URL, or undefined if not configured.
 */
export const getStoreMetadataServiceURL = (mapId: string): string | undefined => getStoreAppState(mapId).metadataServiceURL;

/**
 * Gets the list of active notifications for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The array of notifications.
 */
export const getStoreNotifications = (mapId: string): NotificationDetailsType[] => getStoreAppState(mapId).notifications;

/**
 * Gets whether to show highlight bounding boxes around layer features for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if layer highlight bboxes should be shown.
 */
export const getStoreShowLayerHighlightLayerBbox = (mapId: string): boolean => getStoreAppState(mapId).showLayerHighlightLayerBbox;

/**
 * Gets whether unsymbolized features should be displayed for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if unsymbolized features should be shown.
 */
export const getStoreShowUnsymbolizedFeatures = (mapId: string): boolean => getStoreAppState(mapId).showUnsymbolizedFeatures;

// #endregion STATE SELECTORS

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
