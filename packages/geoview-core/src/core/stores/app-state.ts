import { useStore } from 'zustand';
import { useGeoViewStore } from './stores-managers';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeAppState(set: any, get: any) {
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
// UI state selectors
// **********************************************************
export const useAppCrosshairsActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);
export const useFullscreenActive = () => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useAppNotifications = () => useStore(useGeoViewStore(), (state) => state.appState.notifications);

export const useAppStoreActions = () => useStore(useGeoViewStore(), (state) => state.appState.actions);
