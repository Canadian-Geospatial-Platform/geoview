import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

import { NotificationDetailsType, TypeHTMLElement } from '@/core/types/cgpv-types';
import { api } from '@/app';

export interface IAppState {
  isCrosshairsActive: boolean;
  isFullscreenActive: boolean;
  notifications: Array<NotificationDetailsType>;

  actions: {
    setCrosshairActive: (active: boolean) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    addNotification: (notif: NotificationDetailsType) => void;
    removeNotification: (key: string) => void;
  };
}

export function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState {
  return {
    isCrosshairsActive: false,
    isFullscreenActive: false,
    notifications: [],

    actions: {
      setCrosshairActive: (active: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCrosshairsActive: active,
          },
        });
      },
      setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => {
        set({
          appState: {
            ...get().appState,
            isFullscreenActive: active,
          },
        });

        // TODO: keep reference to geoview map instance in the store or keep accessing with api - discussion
        if (element !== undefined) api.maps[get().mapId].toggleFullscreen(active, element);
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
  } as IAppState;
}

// **********************************************************
// App state selectors
// **********************************************************
export const useAppCrosshairsActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);
export const useFullscreenActive = () => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useAppNotifications = () => useStore(useGeoViewStore(), (state) => state.appState.notifications);

export const useAppStoreActions = () => useStore(useGeoViewStore(), (state) => state.appState.actions);
