import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeAppBarProps, TypeMapCorePackages, TypeNavBarProps } from '@/geo';
import { TypeMapFeaturesConfig } from '@/core/types/cgpv-types';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';

type focusItemProps = {
  activeElementId: string | false;
  callbackElementId: string | false;
};

export interface IUIState {
  activefooterTabId: string;
  activeTrapGeoView: boolean;
  appBarComponents: TypeAppBarProps;
  corePackagesComponents: TypeMapCorePackages;
  focusITem: focusItemProps;
  footerBarExpanded: boolean;
  geoLocatorActive: boolean;
  navBarComponents: TypeNavBarProps;
  footerPanelResizeValue: number;
  footerPanelResizeValues: number[];
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    closeModal: () => void;
    openModal: (uiFocus: focusItemProps) => void;
    setActiveFooterTab: (id: string) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterBarExpanded: (expanded: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
  };
}

export function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState {
  const init = {
    appBarComponents: ['geolocator', 'export'],
    activefooterTabId: 'legend',
    activeTrapGeoView: false,
    corePackagesComponents: [],
    focusITem: { activeElementId: false, callbackElementId: false },
    footerBarExpanded: false,
    geoLocatorActive: false,
    navBarComponents: [],
    footerPanelResizeValue: 35,
    footerPanelResizeValues: [35, 50, 100],

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        uiState: {
          ...get().uiState,
          appBarComponents: geoviewConfig.appBar || [],
          corePackagesComponents: geoviewConfig.corePackages || [],
          navBarComponents: geoviewConfig.navBar || [],
        },
      });
    },

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
      setActiveFooterTab: (id: string) => {
        set({
          uiState: {
            ...get().uiState,
            activefooterTabId: id,
          },
        });

        UIEventProcessor.setActiveFooterTab(get().mapId, id);
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
      setFooterPanelResizeValue: (value) => {
        set({
          uiState: {
            ...get().uiState,
            footerPanelResizeValue: value,
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
export const useUIAppbarComponents = () => useStore(useGeoViewStore(), (state) => state.uiState.appBarComponents);
export const useUIAppbarGeolocatorActive = () => useStore(useGeoViewStore(), (state) => state.uiState.geoLocatorActive);
export const useUICorePackagesComponents = () => useStore(useGeoViewStore(), (state) => state.uiState.corePackagesComponents);
export const useUIFooterBarExpanded = () => useStore(useGeoViewStore(), (state) => state.uiState.footerBarExpanded);
export const useUINavbarComponents = () => useStore(useGeoViewStore(), (state) => state.uiState.navBarComponents);
export const useUIFooterPanelResizeValue = () => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValue);
export const useUIFooterPanelResizeValues = () => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValues);
export const useUIActiveFooterTabId = () => useStore(useGeoViewStore(), (state) => state.uiState.activefooterTabId);

export const useUIStoreActions = () => useStore(useGeoViewStore(), (state) => state.uiState.actions);
