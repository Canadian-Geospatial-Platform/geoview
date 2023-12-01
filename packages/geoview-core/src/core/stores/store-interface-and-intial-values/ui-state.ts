import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';

type focusItemProps = {
  activeElementId: string | false;
  callbackElementId: string | false;
};

export interface IUIState {
  activeTrapGeoView: boolean;
  focusITem: focusItemProps;
  footerBarExpanded: boolean;
  geoLocatorActive: boolean;

  actions: {
    closeModal: () => void;
    openModal: (uiFocus: focusItemProps) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterBarExpanded: (expanded: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
  };
}

export function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState {
  const init = {
    activeTrapGeoView: false,
    focusITem: { activeElementId: false, callbackElementId: false },
    footerBarExpanded: false,
    geoLocatorActive: false,

    // #region ACTIONS
    actions: {
      closeModal: () => {
        document.getElementById(get().uiState.focusITem.callbackElementId as string)?.focus();
        set({
          uiState: {
            ...get().uiState,
            focusITem: { activeElementId: false, callbackElementId: false },
          },
        });
      },
      openModal: (uiFocus: focusItemProps) => {
        set({
          uiState: {
            ...get().uiState,
            focusITem: { activeElementId: uiFocus.activeElementId, callbackElementId: uiFocus.callbackElementId },
          },
        });
      },
      setActiveTrapGeoView: (active: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            activeTrapGeoView: active,
          },
        });
      },
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
    // #endregion ACTIONS
  } as IUIState;

  return init;
}

// **********************************************************
// UI state selectors
// **********************************************************
export const useUIActiveFocusItem = () => useStore(useGeoViewStore(), (state) => state.uiState.focusITem);
export const useUIActiveTrapGeoView = () => useStore(useGeoViewStore(), (state) => state.uiState.activeTrapGeoView);
export const useUIAppbarGeolocatorActive = () => useStore(useGeoViewStore(), (state) => state.uiState.geoLocatorActive);
export const useUIFooterBarExpanded = () => useStore(useGeoViewStore(), (state) => state.uiState.footerBarExpanded);

export const useUIStoreActions = () => useStore(useGeoViewStore(), (state) => state.uiState.actions);
