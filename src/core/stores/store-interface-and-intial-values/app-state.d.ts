import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { NotificationDetailsType } from '@/core/types/cgpv-types';
export interface IAppState {
    isCrosshairsActive: boolean;
    isFullscreenActive: boolean;
    notifications: Array<NotificationDetailsType>;
    actions: {
        setCrosshairActive: (active: boolean) => void;
        setFullScreenActive: (active: boolean) => void;
        addNotification: (notif: NotificationDetailsType) => void;
        removeNotification: (key: string) => void;
    };
}
export declare function initializeAppState(set: TypeSetStore, get: TypeGetStore): {
    isCrosshairsActive: boolean;
    isFullScreen: boolean;
    notifications: never[];
    actions: {
        setCrosshairActive: (isCrosshairsActive: boolean) => void;
        setFullScreenActive: (isFullscreenActive: boolean) => void;
        addNotification: (notif: NotificationDetailsType) => void;
        removeNotification: (key: string) => void;
    };
};
export declare const useAppCrosshairsActive: () => boolean;
export declare const useFullscreenActive: () => boolean;
export declare const useAppNotifications: () => NotificationDetailsType[];
export declare const useAppStoreActions: () => {
    setCrosshairActive: (active: boolean) => void;
    setFullScreenActive: (active: boolean) => void;
    addNotification: (notif: NotificationDetailsType) => void;
    removeNotification: (key: string) => void;
};
