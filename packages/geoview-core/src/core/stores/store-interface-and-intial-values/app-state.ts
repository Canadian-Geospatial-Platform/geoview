import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
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

export function initializeAppState(set: TypeSetStore, get: TypeGetStore) {
  const init = {
    isCrosshairsActive: false,
    isFullScreen: false,
    notifications: [],

    actions: {
      setCrosshairActive: (isCrosshairsActive: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCrosshairsActive,
          },
        });
      },
      setFullScreenActive: (isFullscreenActive: boolean) => {
        set({
          appState: {
            ...get().appState,
            isFullscreenActive,
          },
        });
      },
      addNotification: (notif: NotificationDetailsType) => {
        set({
          appState: {
            ...get().appState,
            notifications: [
              ...get().appState.notifications,
              { key: notif.key, notificationType: notif.notificationType, message: notif.message },
            ],
          },
        });
      },
      removeNotification: (key: string) => {
        set({
          appState: {
            ...get().appState,
            notifications: get().appState.notifications.filter((item: NotificationDetailsType) => item.key !== key),
          },
        });
      },
    },
  };

  return init;
}

// **********************************************************
// App state selectors
// **********************************************************
export const useAppCrosshairsActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);
export const useFullscreenActive = () => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useAppNotifications = () => useStore(useGeoViewStore(), (state) => state.appState.notifications);

export const useAppStoreActions = () => useStore(useGeoViewStore(), (state) => state.appState.actions);
