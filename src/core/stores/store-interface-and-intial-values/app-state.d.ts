import type { DisplayDateMode, TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import type { TypeInitialGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TimeIANA, TypeDisplayDateDefaults } from '@/core/utils/date-mgt';
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
/**
 * Initializes an App State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized App State
 */
export declare function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState;
/**
 * Gets whether the circular progress indicator is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if the progress indicator is active.
 */
export declare const getStoreAppIsCircularProgressActive: (mapId: string) => boolean;
/** Hook that returns whether the circular progress indicator is active. */
export declare const useStoreAppIsCircularProgressActive: () => boolean;
/**
 * Gets whether the crosshairs overlay is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if crosshairs are active.
 */
export declare const getStoreAppIsCrosshairsActive: (mapId: string) => boolean;
/** Hook that returns whether the crosshairs overlay is active. */
export declare const useStoreAppIsCrosshairsActive: () => boolean;
/**
 * Gets the disabled layer types for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The list of disabled layer types.
 */
export declare const getStoreAppDisabledLayerTypes: (mapId: string) => TypeInitialGeoviewLayerType[];
/** Hook that returns the list of disabled layer types. */
export declare const useStoreAppDisabledLayerTypes: () => TypeInitialGeoviewLayerType[];
/**
 * Gets the display language for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display language.
 */
export declare const getStoreAppDisplayLanguage: (mapId: string) => TypeDisplayLanguage;
/** Hook that returns the current display language. */
export declare const useStoreAppDisplayLanguage: () => TypeDisplayLanguage;
/**
 * Hook that returns the display language for a specific map by its id.
 *
 * Used in app-start.tsx before the GeoView context is assigned to the map.
 * Do not use this technique elsewhere; it is only intended for reloading language and theme.
 *
 * @param mapId - The map identifier.
 * @returns The display language for the given map.
 */
export declare const useStoreAppDisplayLanguageById: (mapId: string) => TypeDisplayLanguage;
/**
 * Gets the display theme for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display theme.
 */
export declare const getStoreAppDisplayTheme: (mapId: string) => TypeDisplayTheme;
/** Hook that returns the current display theme. */
export declare const useStoreAppDisplayTheme: () => TypeDisplayTheme;
/**
 * Hook that returns the display theme for a specific map by its id.
 *
 * Used in app-start.tsx before the GeoView context is assigned to the map.
 * Do not use this technique elsewhere; it is only intended for reloading language and theme.
 *
 * @param mapId - The map identifier.
 * @returns The display theme for the given map.
 */
export declare const useStoreAppDisplayThemeById: (mapId: string) => TypeDisplayTheme;
/**
 * Gets the display date mode for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The display date mode.
 */
export declare const getStoreAppDisplayDateMode: (mapId: string) => DisplayDateMode;
/** Hook that returns the current display date mode. */
export declare const useStoreAppDisplayDateMode: () => DisplayDateMode;
/**
 * Gets the display date timezone for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The IANA timezone string.
 */
export declare const getStoreDisplayDateTimezone: (mapId: string) => TimeIANA;
/** Hook that returns the current display date timezone. */
export declare const useStoreDisplayDateTimezone: () => TimeIANA;
/**
 * Gets whether fullscreen mode is active for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if fullscreen is active.
 */
export declare const getStoreAppIsFullscreenActive: (mapId: string) => boolean;
/** Hook that returns whether fullscreen mode is active. */
export declare const useStoreAppIsFullscreenActive: () => boolean;
/**
 * Gets the geolocator service URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The geolocator service URL, or undefined if not configured.
 */
export declare const getStoreAppGeolocatorServiceURL: (mapId: string) => string | undefined;
/** Hook that returns the geolocator service URL. */
export declare const useStoreAppGeolocatorServiceURL: () => string | undefined;
/**
 * Gets the metadata service URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The metadata service URL, or undefined if not configured.
 */
export declare const getStoreAppMetadataServiceURL: (mapId: string) => string | undefined;
/** Hook that returns the metadata service URL. */
export declare const useStoreAppMetadataServiceURL: () => string | undefined;
/**
 * Gets the root GeoView HTML element for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The HTML element hosting the map.
 */
export declare const getStoreAppGeoviewHTMLElement: (mapId: string) => HTMLElement;
/** Hook that returns the root GeoView HTML element for the current map. */
export declare const useStoreAppGeoviewHTMLElement: () => HTMLElement;
/**
 * Gets the map container height for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The height in pixels.
 */
export declare const getStoreAppHeight: (mapId: string) => number;
/** Hook that returns the current map container height in pixels. */
export declare const useStoreAppHeight: () => number;
/**
 * Gets the GeoView assets base URL for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The assets base URL.
 */
export declare const getStoreAppGeoviewAssetsURL: (mapId: string) => string;
/** Hook that returns the base URL for GeoView static assets. */
export declare const useStoreAppGeoviewAssetsURL: () => string;
/**
 * Gets the guide content object for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The guide object, or undefined if not set.
 */
export declare const getStoreAppGuide: (mapId: string) => TypeGuideObject | undefined;
/** Hook that returns the guide content object. */
export declare const useStoreAppGuide: () => TypeGuideObject | undefined;
/**
 * Gets the list of active notifications for the given map.
 *
 * @param mapId - The map identifier.
 * @returns The array of notifications.
 */
export declare const getStoreAppNotifications: (mapId: string) => NotificationDetailsType[];
/** Hook that returns the list of active notifications. */
export declare const useStoreAppNotifications: () => NotificationDetailsType[];
/**
 * Gets whether unsymbolized features should be displayed for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if unsymbolized features should be shown.
 */
export declare const getStoreAppShowUnsymbolizedFeatures: (mapId: string) => boolean;
/** Hook that returns whether unsymbolized features should be displayed. */
export declare const useStoreAppShowUnsymbolizedFeatures: () => boolean;
/**
 * Hook that returns the shell container HTML element for the current map.
 *
 * Queries the DOM for the element whose id starts with `shell-{mapId}`.
 *
 * @returns The shell container element.
 */
export declare const useStoreAppShellContainer: () => HTMLElement;
/**
 * Gets whether to show highlight bounding boxes around layer features for the given map.
 *
 * @param mapId - The map identifier.
 * @returns True if layer highlight bboxes should be shown.
 */
export declare const getStoreShowLayerHighlightLayerBbox: (mapId: string) => boolean;
/**
 * Gets the default date format settings derived from the current display date mode.
 *
 * @param mapId - The map identifier.
 * @returns The default date display settings.
 */
export declare const getStoreDisplayDateFormatDefault: (mapId: string) => TypeDisplayDateDefaults;
/**
 * Sets the circular progress indicator active state.
 *
 * @param mapId - The map identifier
 * @param active - Whether the circular progress is active
 */
export declare const setStoreCircularProgress: (mapId: string, active: boolean) => void;
/**
 * Sets the display language for the viewer.
 *
 * @param mapId - The map identifier
 * @param lang - The language code (e.g. 'en' or 'fr')
 */
export declare const setStoreDisplayLanguage: (mapId: string, lang: TypeDisplayLanguage) => void;
/**
 * Sets the display theme for the viewer.
 *
 * @param mapId - The map identifier
 * @param theme - The theme identifier
 */
export declare const setStoreDisplayTheme: (mapId: string, theme: TypeDisplayTheme) => void;
/**
 * Sets the timezone for date display.
 *
 * @param mapId - The map identifier
 * @param displayDateTimezone - The IANA timezone identifier
 */
export declare const setStoreDisplayDateTimezone: (mapId: string, displayDateTimezone: TimeIANA) => void;
/**
 * Sets the crosshair overlay active state.
 *
 * @param mapId - The map identifier
 * @param active - Whether the crosshairs are active
 */
export declare const setStoreCrosshairActive: (mapId: string, active: boolean) => void;
/**
 * Sets the fullscreen mode active state.
 *
 * @param mapId - The map identifier
 * @param active - Whether fullscreen mode is active
 */
export declare const setStoreFullScreenActive: (mapId: string, active: boolean) => void;
/**
 * Adds a notification to the store or increments the count if it already exists.
 *
 * Uses async store retrieval because notifications may be called before the map is created.
 *
 * @param mapId - The map identifier
 * @param notification - The notification details to add
 * @returns A promise that resolves when the notification has been added
 */
export declare const addStoreNotification: (mapId: string, notification: NotificationDetailsType) => Promise<void>;
/**
 * Removes a notification from the store by key.
 *
 * Uses async store retrieval because notifications may be called before the map is created.
 *
 * @param mapId - The map identifier
 * @param key - The unique key of the notification to remove
 * @returns A promise that resolves when the notification has been removed
 */
export declare const removeStoreNotification: (mapId: string, key: string) => Promise<void>;
/**
 * Removes all notifications from the store.
 *
 * @param mapId - The map identifier
 */
export declare const removeStoreAllNotifications: (mapId: string) => void;
/**
 * Sets the guide content object to be rendered in the guide panel.
 *
 * @param mapId - The map identifier
 * @param guide - The guide object to display
 */
export declare const setStoreGuide: (mapId: string, guide: TypeGuideObject) => void;
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
//# sourceMappingURL=app-state.d.ts.map