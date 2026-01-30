import { useStore } from 'zustand';

import type {
  TypeValidAppBarCoreProps,
  TypeValidFooterBarTabsCoreProps,
  TypeValidMapCorePackageProps,
  TypeValidNavBarProps,
} from '@/api/types/map-schema-types';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with UIEventProcessor vs UIState

// #region INTERFACES & TYPES

type UIActions = IUIState['actions'];

export type ActiveAppBarTabType = {
  tabId: string;
  isOpen: boolean;
  isFocusTrapped?: boolean;
};

export type ActiveFooterBarTabType = {
  tabId: string;
  isOpen: boolean;
  isFocusTrapped?: boolean;
};
export interface IUIState {
  activeTrapGeoView: boolean;
  appBarComponents: TypeValidAppBarCoreProps[];
  activeAppBarTab: ActiveAppBarTabType;
  footerBarComponents: TypeValidFooterBarTabsCoreProps[];
  activeFooterBarTab: ActiveFooterBarTabType;
  corePackagesComponents: TypeValidMapCorePackageProps[];
  focusItem: FocusItemProps;
  hiddenTabs: string[];
  navBarComponents: TypeValidNavBarProps[];
  footerPanelResizeValue: number;
  selectedFooterLayerListItemId: string;
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  actions: {
    hideTabButton: (tab: string) => void;
    enableFocusTrap: (uiFocus: FocusItemProps) => void;
    disableFocusTrap: (callbackElementId?: string) => void;
    showTabButton: (tab: string) => void;
    setActiveFooterBarTab: (id: string | undefined) => void;
    setActiveAppBarTab: (tabId: string, isOpen: boolean, isFocusTrapped: boolean) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setFooterBarIsOpen: (open: boolean) => void;
    setSelectedFooterLayerListItemId: (layerListItemId: string) => void;
  };

  setterActions: {
    enableFocusTrap: (uiFocus: FocusItemProps) => void;
    disableFocusTrap: (callbackElementId?: string) => void;
    setActiveFooterBarTab: (id: string | undefined) => void;
    setActiveAppBarTab: (tabId: string, isOpen: boolean, isFocusTrapped: boolean) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setHiddenTabs: (hiddenTabs: string[]) => void;
    setFooterBarIsOpen: (open: boolean) => void;
    setSelectedFooterLayerListItemId: (layerListItemId: string) => void;
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
    activeAppBarTab: { tabId: '', isOpen: false, isFocusTrapped: false },
    footerBarComponents: [],
    activeFooterBarTab: { tabId: '', isOpen: false, isFocusTrapped: false },
    navBarComponents: [],
    activeTrapGeoView: false,
    corePackagesComponents: [],
    focusItem: { activeElementId: false, callbackElementId: false },
    hiddenTabs: ['data-table', 'time-slider', 'geochart'],
    footerPanelResizeValue: 35,
    selectedFooterLayerListItemId: '',
    selectedAppBarLayerListItemId: '',

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      // App bar and footer bar state rules:
      // - selectedTab set → open
      // - selectedTab unset → close
      const isAppBarOpen = !!geoviewConfig.appBar?.selectedTab;
      const isFooterBarOpen = !!geoviewConfig.footerBar?.selectedTab;

      set({
        uiState: {
          ...get().uiState,
          appBarComponents: geoviewConfig.appBar?.tabs.core || [],
          activeAppBarTab: {
            tabId: geoviewConfig.appBar?.selectedTab || '',
            isOpen: isAppBarOpen,
            isFocusTrapped: false,
          },
          footerBarComponents: geoviewConfig.footerBar?.tabs.core || [],
          activeFooterBarTab: {
            tabId: geoviewConfig.footerBar?.selectedTab || '',
            isOpen: isFooterBarOpen,
            isFocusTrapped: false,
          },
          corePackagesComponents: geoviewConfig.corePackages || [],
          navBarComponents: geoviewConfig.navBar || [],
          selectedFooterLayerListItemId:
            geoviewConfig.footerBar?.selectedLayersLayerPath || geoviewConfig.appBar?.selectedLayersLayerPath
              ? `${get().mapId}-${geoviewConfig.footerBar?.selectedTab || geoviewConfig.appBar?.selectedTab}-${geoviewConfig.footerBar?.selectedLayersLayerPath || geoviewConfig.appBar?.selectedLayersLayerPath}`
              : '',
        },
      });
    },

    // #region ACTIONS

    actions: {
      hideTabButton: (tab: string): void => {
        // Redirect to event processor
        UIEventProcessor.hideTabButton(get().mapId, tab);
      },
      enableFocusTrap: (uiFocus: FocusItemProps) => {
        // Redirect to setter
        get().uiState.setterActions.enableFocusTrap(uiFocus);
      },
      disableFocusTrap: (callbackElementId: string) => {
        // Redirect to setter
        get().uiState.setterActions.disableFocusTrap(callbackElementId);
      },
      showTabButton: (tab: string): void => {
        // Redirect to event processor
        UIEventProcessor.showTabButton(get().mapId, tab);
      },
      setActiveFooterBarTab: (id: string | undefined) => {
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
      setFooterBarIsOpen: (open: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setFooterBarIsOpen(open);
      },
      setActiveAppBarTab: (tabId: string, isOpen: boolean, isFocusTrapped: boolean) => {
        // Redirect to setter
        get().uiState.setterActions.setActiveAppBarTab(tabId, isOpen, isFocusTrapped);
      },
      setSelectedFooterLayerListItemId: (layerListItemId: string) => {
        // Redirect to setter
        get().uiState.setterActions.setSelectedFooterLayerListItemId(layerListItemId);
      },
    },

    setterActions: {
      enableFocusTrap: (uiFocus: FocusItemProps) => {
        set({
          uiState: {
            ...get().uiState,
            focusItem: { activeElementId: uiFocus.activeElementId, callbackElementId: uiFocus.callbackElementId },
          },
        });
      },
      // TODO: WCAG Issue #3222 RAF seems to be working well for timing purposes
      // (RAF ensures that modal transitions, focal trap releases, and DOM updates, are completed before focus restoration takes place)
      // Try removing setTimeout from all instances of disableFocusTrap as that might now be redundant
      // See issue #3222 for more detail.
      disableFocusTrap: (callBackElementId: string) => {
        const id = callBackElementId ?? (get().uiState.focusItem.callbackElementId as string);
        requestAnimationFrame(() => {
          // Don't focus if 'no-focus' is passed
          if (id !== 'no-focus') {
            const element = document.getElementById(id);
            if (element) {
              element.focus();
            }
          }
        });
        set({
          uiState: {
            ...get().uiState,
            focusItem: { activeElementId: false, callbackElementId: false },
          },
        });
      },
      setActiveFooterBarTab: (id: string | undefined) => {
        set({
          uiState: {
            ...get().uiState,
            activeFooterBarTab: {
              ...get().uiState.activeFooterBarTab,
              tabId: id || '',
            },
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
      setFooterBarIsOpen: (open: boolean) => {
        set({
          uiState: {
            ...get().uiState,
            activeFooterBarTab: {
              ...get().uiState.activeFooterBarTab,
              isOpen: open,
            },
          },
        });
      },
      setActiveAppBarTab: (tabId: string, isOpen: boolean, isFocusTrapped: boolean = false) => {
        // Gv Side effect with focus trap and side panel app bar open
        // We need to check if the viewer is in keyboard navigation mode. If not, we don't apply the focus trap.
        // Focus trap has side effect when a app bar panel is open. It does not let user use their mouse
        // to pan the map. Even scroll is difficult, user needs to click outside the browser then come back for
        // the mouse wheel to work
        const isFocusTrappedAndKeyboardNavigation = get().uiState.activeTrapGeoView ? isFocusTrapped : false;
        set({
          uiState: {
            ...get().uiState,
            activeAppBarTab: {
              tabId,
              isOpen,
              isFocusTrapped: isFocusTrappedAndKeyboardNavigation,
            },
          },
        });
      },
      setSelectedFooterLayerListItemId: (layerListItemId: string) => {
        set({
          uiState: {
            ...get().uiState,
            selectedFooterLayerListItemId: layerListItemId,
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
export const useUIActiveFocusItem = (): FocusItemProps => useStore(useGeoViewStore(), (state) => state.uiState.focusItem);
export const useUIActiveAppBarTab = (): ActiveAppBarTabType => useStore(useGeoViewStore(), (state) => state.uiState.activeAppBarTab);
export const useUIActiveFooterBarTab = (): ActiveFooterBarTabType =>
  useStore(useGeoViewStore(), (state) => state.uiState.activeFooterBarTab);
export const useUIActiveTrapGeoView = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.activeTrapGeoView);
export const useUIAppbarComponents = (): TypeValidAppBarCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.appBarComponents);
export const useUIFooterBarComponents = (): TypeValidFooterBarTabsCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.footerBarComponents);
export const useUICorePackagesComponents = (): TypeValidMapCorePackageProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.corePackagesComponents);
export const useUIFooterPanelResizeValue = (): number => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValue);
export const useUIHiddenTabs = (): string[] => useStore(useGeoViewStore(), (state) => state.uiState.hiddenTabs);
export const useUINavbarComponents = (): TypeValidNavBarProps[] => useStore(useGeoViewStore(), (state) => state.uiState.navBarComponents);
export const useUISelectedFooterLayerListItemId = (): string =>
  useStore(useGeoViewStore(), (state) => state.uiState.selectedFooterLayerListItemId);

// Store Actions
export const useUIStoreActions = (): UIActions => useStore(useGeoViewStore(), (state) => state.uiState.actions);
