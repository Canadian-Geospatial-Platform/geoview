import { useStore } from 'zustand';
import { getGeoViewStore } from './stores-managers';

export interface IAppState {
  isCrosshairsActive: boolean;
  isFullscreenActive: boolean;

  actions: {
    setCrosshairActive: (active: boolean) => void;
    setFullScreenActive: (active: boolean) => void;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeAppState(set: any, get: any) {
  const init = {
    isCrosshairsActive: false,
    isFullScreen: false,

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
    },
  };

  return init;
}

// **********************************************************
// UI state selectors
// **********************************************************
export const useAppCrosshairsActive = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.appState.isCrosshairsActive);
export const useFullscreenCrosshairsActive = (mapId: string) =>
  useStore(getGeoViewStore(mapId), (state) => state.appState.isFullscreenActive);

export const useAppStoreActions = (mapId: string) => useStore(getGeoViewStore(mapId), (state) => state.appState.actions);
