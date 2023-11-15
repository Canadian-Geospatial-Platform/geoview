import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { NotificationDetailsType, TypeHTMLElement } from '@/core/types/cgpv-types';
export interface IAppState {
    isCrosshairsActive: boolean;
    isFullscreenActive: boolean;
    notifications: Array<NotificationDetailsType>;
    actions: {
        addNotification: (notif: NotificationDetailsType) => void;
        setCrosshairActive: (active: boolean) => void;
        setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
        removeNotification: (key: string) => void;
    };
}
export declare function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState;
export declare const useAppCrosshairsActive: () => boolean;
export declare const useAppNotifications: () => NotificationDetailsType[];
export declare const useFullscreenActive: () => boolean;
export declare const useAppStoreActions: () => {
    addNotification: (notif: NotificationDetailsType) => void;
    setCrosshairActive: (active: boolean) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
};
