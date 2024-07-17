import { useStore } from 'zustand';
import { TypeMapCorePackages, TypeNavBarProps, TypeValidAppBarCoreProps } from '@config/types/map-schema-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

// #region INTERFACES & TYPES

type UIActions = IUIState['actions'];

export type ActiveAppBarTabType = {
  tabId: string;
  tabGroup: string;
  isOpen: boolean;
};

export interface IUIState {
  activeFooterBarTabId: string;
  activeTrapGeoView: boolean;
  activeAppBarTab: ActiveAppBarTabType;
  appBarComponents: TypeValidAppBarCoreProps[];
  corePackagesComponents: TypeMapCorePackages;
  focusITem: FocusItemProps;
  hiddenTabs: string[];
  mapInfoExpanded: boolean;
  navBarComponents: TypeNavBarProps;
  footerPanelResizeValue: number;
  footerPanelResizeValues: number[];
  footerBarIsCollapsed: boolean;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    hideTab: (tab: string) => void;
    closeModal: () => void;
    openModal: (uiFocus: FocusItemProps) => void;
    showTab: (tab: string) => void;
    setActiveFooterBarTab: (id: string) => void;
    setActiveAppBarTab: (tabId: string, tabGroup: string, isOpen: boolean) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setMapInfoExpanded: (expanded: boolean) => void;
    setFooterBarIsCollapsed: (collapsed: boolean) => void;
  };

  setterActions: {
    closeModal: () => void;
    openModal: (uiFocus: FocusItemProps) => void;
    setActiveFooterBarTab: (id: string) => void;
    setActiveAppBarTab: (tabId: string, tabGroup: string, isOpen: boolean) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setHiddenTabs: (hiddenTabs: string[]) => void;
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
    activeFooterBarTabId: '',
    activeAppBarTab: { tabId: '', tabGroup: '', isOpen: false },
    activeTrapGeoView: false,
    corePackagesComponents: [],
    focusITem: { activeElementId: false, callbackElementId: false },
    hiddenTabs: ['time-slider', 'geochart'],
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
      hideTab: (tab: string): void => {
        // Redirect to event processor
        UIEventProcessor.hideTab(get().mapId, tab);
      },
      closeModal: () => {
        // Redirect to setter
        get().uiState.setterActions.closeModal();
      },
      openModal: (uiFocus: FocusItemProps) => {
        // Redirect to setter
        get().uiState.setterActions.openModal(uiFocus);
      },
      showTab: (tab: string): void => {
        // Redirect to event processor
        UIEventProcessor.showTab(get().mapId, tab);
      },
      setActiveFooterBarTab: (id: string) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveFooterBarTab(id);
      },
      setActiveTrapGeoView: (active: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveTrapGeoView(active);
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
      setActiveAppBarTab: (tabId: string, tabGroup: string, isOpen: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveAppBarTab(tabId, tabGroup, isOpen);
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
      setActiveTrapGeoView: (active: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            activeTrapGeoView: active,
          },
        });
      },
      setHiddenTabs: (hiddenTabs: string[]) => {
        set({
          uiState: {
            ...get().uiState,
            hiddenTabs: [...hiddenTabs],
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
        set({
          uiState: {
            ...get().uiState,
            footerBarIsCollapsed: collapsed,
          },
        });
      },
      setActiveAppBarTab: (tabId: string, tabGroup: string, isOpen: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            activeAppBarTab: {
              tabId,
              tabGroup,
              isOpen,
            },
          },
        });
      },
    },

    // #endregion ACTIONS
  } as IUIState;

  return init;
}

type FocusItemProps = {
  activeElementId: string | false;
  callbackElementId: string | false;
};

// **********************************************************
// UI state selectors
// **********************************************************
export const useUIActiveFocusItem = (): FocusItemProps => useStore(useGeoViewStore(), (state) => state.uiState.focusITem);
export const useUIActiveFooterBarTabId = (): string => useStore(useGeoViewStore(), (state) => state.uiState.activeFooterBarTabId);
export const useActiveAppBarTab = (): ActiveAppBarTabType => useStore(useGeoViewStore(), (state) => state.uiState.activeAppBarTab);
export const useUIActiveTrapGeoView = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.activeTrapGeoView);
export const useUIAppbarComponents = (): TypeValidAppBarCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.appBarComponents);
export const useUICorePackagesComponents = (): TypeMapCorePackages =>
  useStore(useGeoViewStore(), (state) => state.uiState.corePackagesComponents);
export const useUIFooterPanelResizeValue = (): number => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValue);
export const useUIFooterPanelResizeValues = (): number[] => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValues);
export const useUIHiddenTabs = (): string[] => useStore(useGeoViewStore(), (state) => state.uiState.hiddenTabs);
export const useUIMapInfoExpanded = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.mapInfoExpanded);
export const useUINavbarComponents = (): TypeNavBarProps => useStore(useGeoViewStore(), (state) => state.uiState.navBarComponents);
export const useUIFooterBarIsCollapsed = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.footerBarIsCollapsed);

export const useUIStoreActions = (): UIActions => useStore(useGeoViewStore(), (state) => state.uiState.actions);
