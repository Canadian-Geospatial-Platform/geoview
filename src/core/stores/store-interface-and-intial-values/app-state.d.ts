import { TypeDisplayLanguage, TypeDisplayTheme } from '@config/types/map-schema-types';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { NotificationDetailsType } from '@/core/components/notifications/notifications';
import { TypeHTMLElement, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { SnackbarType } from '@/core/utils/notifications';
type AppActions = IAppState['actions'];
export interface IAppState {
    displayLanguage: TypeDisplayLanguage;
    displayTheme: TypeDisplayTheme;
    guide: TypeGuideObject | undefined;
    geolocatorServiceURL: string | undefined;
    geoviewHTMLElement: HTMLElement;
    geoviewAssetsURL: string;
    isCircularProgressActive: boolean;
    isCrosshairsActive: boolean;
    isFullscreenActive: boolean;
    notifications: Array<NotificationDetailsType>;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        addMessage: (type: SnackbarType, message: string, param?: string[]) => void;
        addNotification: (notif: NotificationDetailsType) => void;
        setCrosshairActive: (active: boolean) => void;
        setDisplayLanguage: (lang: TypeDisplayLanguage) => Promise<[void, void]>;
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
export declare const useAppDisplayLanguage: () => TypeDisplayLanguage;
export declare const useAppDisplayTheme: () => TypeDisplayTheme;
export declare const useAppFullscreenActive: () => boolean;
export declare const useAppGeolocatorServiceURL: () => string | undefined;
export declare const useAppGeoviewHTMLElement: () => HTMLElement;
export declare const useAppGeoviewAssetsURL: () => string;
export declare const useAppGuide: () => TypeGuideObject | undefined;
export declare const useAppNotifications: () => NotificationDetailsType[];
export declare const useAppDisplayLanguageById: (mapId: string) => TypeDisplayLanguage;
export declare const useAppDisplayThemeById: (mapId: string) => TypeDisplayTheme;
export declare const useAppStoreActions: () => AppActions;
export {};
