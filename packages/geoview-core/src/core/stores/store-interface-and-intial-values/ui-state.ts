import { useStore } from 'zustand';
import { useGeoViewStore } from '../stores-managers';

export interface IUIState {
  footerBarExpanded: boolean;
  geoLocatorActive: boolean;

  actions: {
    setGeolocatorActive: (active: boolean) => void;
    setFooterBarExpanded: (expanded: boolean) => void;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initializeUIState(set: any, get: any) {
  const init = {
    footerBarExpanded: false,
    geoLocatorActive: false,

    actions: {
      setFooterBarExpanded: (expanded: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            footerBarExpanded: expanded,
          },
        });
      },
      setGeolocatorActive: (active: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            geoLocatorActive: active,
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
export const useUIFooterBarExpanded = () => useStore(useGeoViewStore(), (state) => state.uiState.footerBarExpanded);
export const useUIappbarGeolocatorActive = () => useStore(useGeoViewStore(), (state) => state.uiState.geoLocatorActive);

export const useUIStoreActions = () => useStore(useGeoViewStore(), (state) => state.uiState.actions);
