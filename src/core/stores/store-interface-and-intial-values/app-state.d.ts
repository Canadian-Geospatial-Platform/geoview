import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement, TypeMapFeaturesConfig, TypeDisplayTheme } from '@/core/types/cgpv-types';
export interface IAppState {
    displayLanguage: TypeDisplayLanguage;
    displayTheme: TypeDisplayTheme;
    isCircularProgressActive: boolean;
    isCrosshairsActive: boolean;
    isFullscreenActive: boolean;
    notifications: Array<NotificationDetailsType>;
    geolocatorServiceURL: string | undefined;
    suportedLanguages: TypeDisplayLanguage[];
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        addNotification: (notif: NotificationDetailsType) => void;
        setCircularProgress: (active: boolean) => void;
        setCrosshairActive: (active: boolean) => void;
        setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
        setDisplayTheme: (theme: TypeDisplayTheme) => void;
        setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
        removeNotification: (key: string) => void;
    };
}
export declare function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState;
export declare const useAppCircularProgressActive: () => boolean;
export declare const useAppCrosshairsActive: () => boolean;
export declare const useAppDisplayLanguage: () => TypeDisplayLanguage;
export declare const useAppDisplayTheme: () => TypeDisplayTheme;
export declare const useAppFullscreenActive: () => boolean;
export declare const useAppGeolocatorServiceURL: () => string | undefined;
export declare const useAppNotifications: () => NotificationDetailsType[];
export declare const useAppSuportedLanguages: () => TypeDisplayLanguage[];
export declare const useAppDisplayLanguageById: (mapId: string) => TypeDisplayLanguage;
export declare const useAppDisplayThemeById: (mapId: string) => TypeDisplayTheme;
export declare const useAppStoreActions: () => {
    addNotification: (notif: NotificationDetailsType) => void;
    setCircularProgress: (active: boolean) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
    setDisplayTheme: (theme: TypeDisplayTheme) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
};
