import { useStore } from 'zustand';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

import {
  NotificationDetailsType,
  TypeDisplayLanguage,
  TypeHTMLElement,
  TypeMapFeaturesConfig,
  TypeDisplayTheme,
} from '@/core/types/cgpv-types';
import { api } from '@/app';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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

export function initializeAppState(set: TypeSetStore, get: TypeGetStore): IAppState {
  return {
    displayLanguage: 'en' as TypeDisplayLanguage,
    displayTheme: 'geo.ca',
    isCircularProgressActive: false,
    isCrosshairsActive: false,
    isFullscreenActive: false,
    notifications: [],
    geolocatorServiceURL: '',
    suportedLanguages: [],

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        appState: {
          ...get().appState,
          displayLanguage: geoviewConfig.displayLanguage as TypeDisplayLanguage,
          displayTheme: geoviewConfig.theme || 'geo.ca',
          geolocatorServiceURL: geoviewConfig.serviceUrls?.geolocator,
          suportedLanguages: geoviewConfig.suportedLanguages,
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
      setCircularProgress: (active: boolean) => {
        set({
          appState: {
            ...get().appState,
            isCircularProgressActive: active,
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
      setDisplayLanguage: (lang: TypeDisplayLanguage) => {
        set({
          appState: {
            ...get().appState,
            displayLanguage: lang,
          },
        });

        // reload the basemap from new language
        MapEventProcessor.resetBasemap(get().mapId);
      },
      setDisplayTheme: (theme: TypeDisplayTheme) => {
        set({
          appState: {
            ...get().appState,
            displayTheme: theme,
          },
        });

        // also set the theme from original config for reloading purpose
        const config = get().mapConfig;
        config!.theme = theme;
        set({ mapConfig: config });
      },
      setFullScreenActive: (active: boolean, element?: TypeHTMLElement) => {
        set({
          appState: {
            ...get().appState,
            isFullscreenActive: active,
          },
        });

        //! we need to keep the call to the api map object because there is a state involve
        if (element !== undefined) api.maps[get().mapId].setFullscreen(active, element);
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
export const useAppCircularProgressActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCircularProgressActive);
export const useAppCrosshairsActive = () => useStore(useGeoViewStore(), (state) => state.appState.isCrosshairsActive);
export const useAppDisplayLanguage = () => useStore(useGeoViewStore(), (state) => state.appState.displayLanguage);
export const useAppDisplayTheme = () => useStore(useGeoViewStore(), (state) => state.appState.displayTheme);
export const useAppFullscreenActive = () => useStore(useGeoViewStore(), (state) => state.appState.isFullscreenActive);
export const useAppGeolocatorServiceURL = () => useStore(useGeoViewStore(), (state) => state.appState.geolocatorServiceURL);
export const useAppNotifications = () => useStore(useGeoViewStore(), (state) => state.appState.notifications);
export const useAppSuportedLanguages = () => useStore(useGeoViewStore(), (state) => state.appState.suportedLanguages);

//! these 2 selector are use in app-start.tsx before context is assigned to the map
//! DO NOT USE this technique elsewhere, it is only to reload language and theme
export const useAppDisplayLanguageById = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.appState.displayLanguage);
export const useAppDisplayThemeById = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.appState.displayTheme);

export const useAppStoreActions = () => useStore(useGeoViewStore(), (state) => state.appState.actions);
