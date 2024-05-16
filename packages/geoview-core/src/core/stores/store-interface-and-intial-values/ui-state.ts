import { useStore } from 'zustand';
import { TypeMapCorePackages, TypeNavBarProps, TypeValidAppBarCoreProps } from '@config/types/map-schema-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

// #region INTERFACES & TYPES

type UIActions = IUIState['actions'];

type FocusItemProps = {
  activeElementId: string | false;
  callbackElementId: string | false;
};

export interface IUIState {
  activeFooterBarTabId: string;
  activeTrapGeoView: boolean;
  activeAppBarTabId: string;
  appBarComponents: TypeValidAppBarCoreProps;
  corePackagesComponents: TypeMapCorePackages;
  focusITem: FocusItemProps;
  geoLocatorActive: boolean;
  mapInfoExpanded: boolean;
  navBarComponents: TypeNavBarProps;
  footerPanelResizeValue: number;
  footerPanelResizeValues: number[];
  footerBarIsCollapsed: boolean;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    closeModal: () => void;
    openModal: (uiFocus: FocusItemProps) => void;
    setActiveFooterBarTab: (id: string) => void;
    setActiveAppBarTabId: (id: string) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setMapInfoExpanded: (expanded: boolean) => void;
    setFooterBarIsCollapsed: (collapsed: boolean) => void;
  };

  setterActions: {
    closeModal: () => void;
    openModal: (uiFocus: FocusItemProps) => void;
    setActiveFooterBarTab: (id: string) => void;
    setActiveAppBarTabId: (id: string) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setMapInfoExpanded: (expanded: boolean) => void;
    setFooterBarIsCollapsed: (collapsed: boolean) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes an UI State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IUIState} - The initialized UI State
 */
export function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState {
  const init = {
    appBarComponents: ['geolocator'],
    activeFooterBarTabId: 'legend',
    activeAppBarTabId: '',
    activeTrapGeoView: false,
    corePackagesComponents: [],
    focusITem: { activeElementId: false, callbackElementId: false },
    geoLocatorActive: false,
    mapInfoExpanded: false,
    navBarComponents: [],
    footerPanelResizeValue: 35,
    footerPanelResizeValues: [35, 50, 100],
    footerBarIsCollapsed: false,

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        uiState: {
          ...get().uiState,
          appBarComponents: geoviewConfig.appBar?.tabs.core || [],
          corePackagesComponents: geoviewConfig.corePackages || [],
          navBarComponents: geoviewConfig.navBar || [],
        },
      });
    },

    // #region ACTIONS

    actions: {
      closeModal: () => {
        // Redirect to setter
        get().uiState.setterActions.closeModal();
      },
      openModal: (uiFocus: FocusItemProps) => {
        // Redirect to setter
        get().uiState.setterActions.openModal(uiFocus);
      },
      setActiveFooterBarTab: (id: string) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveFooterBarTab(id);
      },
      setActiveAppBarTabId: (id: string) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveAppBarTabId(id);
      },
      setActiveTrapGeoView: (active: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveTrapGeoView(active);
      },
      setGeolocatorActive: (active: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setGeolocatorActive(active);
      },
      setFooterPanelResizeValue: (value) => {
        // Redirect to setter
        get().uiState.setterActions.setFooterPanelResizeValue(value);
      },
      setMapInfoExpanded: (expanded: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setMapInfoExpanded(expanded);
      },
      setFooterBarIsCollapsed: (collapsed: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setFooterBarIsCollapsed(collapsed);
      },
    },

    setterActions: {
      closeModal: () => {
        document.getElementById(get().uiState.focusITem.callbackElementId as string)?.focus();
        set({
          uiState: {
            ...get().uiState,
            focusITem: { activeElementId: false, callbackElementId: false },
          },
        });
      },
      openModal: (uiFocus: FocusItemProps) => {
        set({
          uiState: {
            ...get().uiState,
            focusITem: { activeElementId: uiFocus.activeElementId, callbackElementId: uiFocus.callbackElementId },
          },
        });
      },
      setActiveFooterBarTab: (id: string) => {
        set({
          uiState: {
            ...get().uiState,
            activeFooterBarTabId: id,
          },
        });
      },
      setActiveAppBarTabId: (id: string) => {
        set({
          uiState: {
            ...get().uiState,
            activeAppBarTabId: id,
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
      setMapInfoExpanded: (expanded: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            mapInfoExpanded: expanded,
          },
        });
      },
      setFooterBarIsCollapsed: (collapsed: boolean) => {
        // Redirect to setter
        set({
          uiState: {
            ...get().uiState,
            footerBarIsCollapsed: collapsed,
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
export const useUIActiveFocusItem = (): FocusItemProps => useStore(useGeoViewStore(), (state) => state.uiState.focusITem);
export const useUIActiveFooterBarTabId = (): string => useStore(useGeoViewStore(), (state) => state.uiState.activeFooterBarTabId);
export const useUIActiveAppBarTabId = (): string => useStore(useGeoViewStore(), (state) => state.uiState.activeAppBarTabId);
export const useUIActiveTrapGeoView = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.activeTrapGeoView);
export const useUIAppbarComponents = (): TypeValidAppBarCoreProps => useStore(useGeoViewStore(), (state) => state.uiState.appBarComponents);
export const useUIAppbarGeolocatorActive = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.geoLocatorActive);
export const useUICorePackagesComponents = (): TypeMapCorePackages =>
  useStore(useGeoViewStore(), (state) => state.uiState.corePackagesComponents);
export const useUIFooterPanelResizeValue = (): number => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValue);
export const useUIFooterPanelResizeValues = (): number[] => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValues);
export const useUIMapInfoExpanded = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.mapInfoExpanded);
export const useUINavbarComponents = (): TypeNavBarProps => useStore(useGeoViewStore(), (state) => state.uiState.navBarComponents);
export const useUIFooterBarIsCollapsed = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.footerBarIsCollapsed);

export const useUIStoreActions = (): UIActions => useStore(useGeoViewStore(), (state) => state.uiState.actions);
