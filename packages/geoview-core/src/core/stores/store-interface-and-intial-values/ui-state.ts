import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

export interface IUIState {
  footerBarExpanded: boolean;
  geoLocatorActive: boolean;

  actions: {
    setFooterBarExpanded: (expanded: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
  };
}

export function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState {
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
export const useUIAppbarGeolocatorActive = () => useStore(useGeoViewStore(), (state) => state.uiState.geoLocatorActive);
export const useUIFooterBarExpanded = () => useStore(useGeoViewStore(), (state) => state.uiState.footerBarExpanded);

export const useUIStoreActions = () => useStore(useGeoViewStore(), (state) => state.uiState.actions);
