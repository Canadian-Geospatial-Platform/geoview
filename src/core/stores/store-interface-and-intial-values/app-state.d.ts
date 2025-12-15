import type { TypeDisplayLanguage, TypeDisplayTheme } from '@/api/types/map-schema-types';
import type { TypeInitialGeoviewLayerType } from '@/api/types/layer-schema-types';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { NotificationDetailsType } from '@/core/components/notifications/notifications';
import type { TypeHTMLElement, TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { SnackbarType } from '@/core/utils/notifications';
type AppActions = IAppState['actions'];
export interface IAppState {
    disabledLayerTypes: TypeInitialGeoviewLayerType[];
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
/**
 * Initializes an App State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IAppState} - The initialized App State
 */
export declare function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState;
export interface TypeGuideObject {
    [heading: string]: {
        content: string;
        heading: string;
        children?: TypeGuideObject;
    };
}
export declare const useAppCircularProgressActive: () => boolean;
export declare const useAppCrosshairsActive: () => boolean;
export declare const useAppDisabledLayerTypes: () => TypeInitialGeoviewLayerType[];
export declare const useAppDisplayLanguage: () => TypeDisplayLanguage;
export declare const useAppDisplayTheme: () => TypeDisplayTheme;
export declare const useAppFullscreenActive: () => boolean;
export declare const useAppGeolocatorServiceURL: () => string | undefined;
export declare const useAppMetadataServiceURL: () => string | undefined;
export declare const useAppGeoviewHTMLElement: () => HTMLElement;
export declare const useAppHeight: () => number;
export declare const useAppGeoviewAssetsURL: () => string;
export declare const useAppGuide: () => TypeGuideObject | undefined;
export declare const useAppNotifications: () => NotificationDetailsType[];
export declare const useAppShowUnsymbolizedFeatures: () => boolean;
export declare const useAppShellContainer: () => HTMLElement;
export declare const useAppDisplayLanguageById: (mapId: string) => TypeDisplayLanguage;
export declare const useAppDisplayThemeById: (mapId: string) => TypeDisplayTheme;
export declare const getAppCrosshairsActive: (mapId: string) => boolean;
export declare const useAppStoreActions: () => AppActions;
export {};
//# sourceMappingURL=app-state.d.ts.map