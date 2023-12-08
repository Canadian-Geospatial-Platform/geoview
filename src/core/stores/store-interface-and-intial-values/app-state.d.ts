import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { NotificationDetailsType, TypeDisplayLanguage, TypeHTMLElement, TypeMapFeaturesConfig, TypeSupportedTheme } from '@/core/types/cgpv-types';
export interface IAppState {
    displayLanguage: TypeDisplayLanguage;
    isCrosshairsActive: boolean;
    isFullscreenActive: boolean;
    notifications: Array<NotificationDetailsType>;
    geolocatorServiceURL: string | undefined;
    suportedLanguages: TypeDisplayLanguage[];
    theme: TypeSupportedTheme;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        addNotification: (notif: NotificationDetailsType) => void;
        setCrosshairActive: (active: boolean) => void;
        setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
        setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
        removeNotification: (key: string) => void;
    };
}
export declare function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState;
export declare const useAppCrosshairsActive: () => boolean;
export declare const useAppDisplayLanguage: () => TypeDisplayLanguage;
export declare const useAppFullscreenActive: () => boolean;
export declare const useAppGeolocatorServiceURL: () => string | undefined;
export declare const useAppNotifications: () => NotificationDetailsType[];
export declare const useAppSuportedLanguages: () => TypeDisplayLanguage[];
export declare const useAppTheme: () => TypeSupportedTheme;
export declare const useAppStoreActions: () => {
    addNotification: (notif: NotificationDetailsType) => void;
    setCrosshairActive: (active: boolean) => void;
    setDisplayLanguage: (lang: TypeDisplayLanguage) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
};
