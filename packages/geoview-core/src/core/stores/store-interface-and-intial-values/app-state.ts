import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

import { NotificationDetailsType, TypeHTMLElement, TypeMapFeaturesConfig } from '@/core/types/cgpv-types';
import { api } from '@/app';

export interface IAppState {
  isCrosshairsActive: boolean;
  isFullscreenActive: boolean;
  notifications: Array<NotificationDetailsType>;
  geolocatorServiceURL: string | undefined;

  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    addNotification: (notif: NotificationDetailsType) => void;
    setCrosshairActive: (active: boolean) => void;
    setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => void;
    removeNotification: (key: string) => void;
  };
}

export function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState {
  return {
    isCrosshairsActive: false,
    isFullscreenActive: false,
    notifications: [],
    geolocatorServiceURL: '',

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        appState: {
          ...get().appState,
          geolocatorServiceURL: geoviewConfig.serviceUrls?.geolocator,
        },
      });
    },

    actions: {
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
export const useAppNotifications = () => useStore(useGeoViewStore(), (state) => state.appState.notifications);
export const useFullscreenActive = () => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useGeolocatorServiceURL = () => useStore(useGeoViewStore(), (state) => state.appState.geolocatorServiceURL);

export const useAppStoreActions = () => useStore(useGeoViewStore(), (state) => state.appState.actions);
