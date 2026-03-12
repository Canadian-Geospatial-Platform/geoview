import { useStore } from 'zustand';

import type {
  TypeValidAppBarCoreProps,
  TypeValidFooterBarTabsCoreProps,
  TypeValidMapCorePackageProps,
  TypeValidNavBarProps,
} from '@/api/types/map-schema-types';
import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';

// #region INTERFACE DEFINITION

/** Represents the UI state managed by the Zustand store. */
export interface IUIState {
  /** Whether the GeoView-level keyboard focus trap is active. */
  activeTrapGeoView: boolean;

  /** The list of app-bar component identifiers rendered in the app bar. */
  appBarComponents: TypeValidAppBarCoreProps[];

  /** The currently active app-bar tab and its open / focus-trap state. */
  activeAppBarTab: ActiveAppBarTabType;

  /** The list of footer-bar tab component identifiers. */
  footerBarComponents: TypeValidFooterBarTabsCoreProps[];

  /** The currently active footer-bar tab and its open / focus-trap state. */
  activeFooterBarTab: ActiveFooterBarTabType;

  /** The list of core package component identifiers. */
  corePackagesComponents: TypeValidMapCorePackageProps[];

  /** Identifies which element currently holds focus-trap control. */
  focusItem: FocusItemProps;

  /** Tab identifiers that are hidden from the footer bar. */
  hiddenTabs: string[];

  /** The list of nav-bar component identifiers. */
  navBarComponents: TypeValidNavBarProps[];

  /** The current resize value (percentage) for the footer panel. */
  footerPanelResizeValue: number;

  /** Sets default UI configuration values from the map features config. */
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  /** Actions to mutate the UI state. */
  actions: {
    /** Enables the focus trap on a specific UI element. */
    enableFocusTrap: (uiFocus: FocusItemProps) => void;

    /** Disables the focus trap and optionally restores focus to a callback element. */
    disableFocusTrap: (callbackElementId?: string) => void;

    /** Sets the active footer-bar tab by id. */
    setActiveFooterBarTab: (id: string | undefined) => void;

    /** Sets the active app-bar tab, its open state, and whether focus is trapped. */
    setActiveAppBarTab: (tabId: string | undefined, isOpen: boolean, isFocusTrapped: boolean) => void;

    /** Toggles the GeoView-level keyboard focus trap. */
    setActiveTrapGeoView: (active: boolean) => void;

    /** Sets the footer panel resize value. */
    setFooterPanelResizeValue: (value: number) => void;

    /** Sets the list of hidden tab identifiers. */
    setHiddenTabs: (hiddenTabs: string[]) => void;

    /** Sets the footer bar open state. */
    setFooterBarIsOpen: (open: boolean) => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes an UI State and provide functions which use the get/set Zustand mechanisms.
 *
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
        },
      });
    },

    actions: {
      enableFocusTrap: (uiFocus: FocusItemProps) => {
        set({
          uiState: {
            ...get().uiState,
            focusItem: { activeElementId: uiFocus.activeElementId, callbackElementId: uiFocus.callbackElementId },
          },
        });
      },
      // TODO: WCAG Issue #3222 RAF seems to be working well for timing purposes
      // (RAF ensures that modal transitions, focus trap releases, and DOM updates, are completed before focus restoration takes place)
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
      setActiveFooterBarTab: (tabId: string | undefined) => {
        set({
          uiState: {
            ...get().uiState,
            activeFooterBarTab: {
              ...get().uiState.activeFooterBarTab,
              tabId: tabId || '',
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
      // TODO: the setter for footer bar is still split in 2 instead of following app bar. Ken, can you set it up correclty with your PR for footer....
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
      setActiveAppBarTab: (tabId: string | undefined, isOpen: boolean, isFocusTrapped: boolean = false) => {
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
              tabId: tabId || '',
              isOpen,
              isFocusTrapped: isFocusTrappedAndKeyboardNavigation,
            },
          },
        });
      },
    },
  } as IUIState;

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE HOOKS
// GV To be used by React components

/** Hooks the current focus-trap item from the UI state. */
export const useUIActiveFocusItem = (): FocusItemProps => useStore(useGeoViewStore(), (state) => state.uiState.focusItem);

/** Hooks the active app-bar tab state. */
export const useUIActiveAppBarTab = (): ActiveAppBarTabType => useStore(useGeoViewStore(), (state) => state.uiState.activeAppBarTab);

/** Hooks the active footer-bar tab state. */
export const useUIActiveFooterBarTab = (): ActiveFooterBarTabType =>
  useStore(useGeoViewStore(), (state) => state.uiState.activeFooterBarTab);

/** Hooks whether the GeoView-level keyboard focus trap is active. */
export const useUIActiveTrapGeoView = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.activeTrapGeoView);

/** Hooks the app-bar component identifiers. */
export const useUIAppbarComponents = (): TypeValidAppBarCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.appBarComponents);

/** Hooks the footer-bar component identifiers. */
export const useUIFooterBarComponents = (): TypeValidFooterBarTabsCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.footerBarComponents);

/** Hooks the core package component identifiers. */
export const useUICorePackagesComponents = (): TypeValidMapCorePackageProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.corePackagesComponents);

/** Hooks the footer panel resize value. */
export const useUIFooterPanelResizeValue = (): number => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValue);

/** Hooks the list of hidden tab identifiers. */
export const useUIHiddenTabs = (): string[] => useStore(useGeoViewStore(), (state) => state.uiState.hiddenTabs);

/** Hooks the nav-bar component identifiers. */
export const useUINavbarComponents = (): TypeValidNavBarProps[] => useStore(useGeoViewStore(), (state) => state.uiState.navBarComponents);

// #endregion STATE HOOKS

// #region STATE SELECTORS
// GV Should only be used specifically to access the Store.
// GV Use sparingly and only if you are sure of what you are doing.
// GV DO NOT USE this technique in React components, use the hooks above instead.

/**
 * Returns the full UI state slice for the given map.
 *
 * Internal-only selector — not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The IUIState for the given map.
 */
// GV No export for the main state!
const getStoreUIState = (mapId: string): IUIState => getGeoViewStore(mapId).getState().uiState;

/**
 * Gets the active footer-bar tab from the store.
 *
 * @param mapId - The map id.
 * @returns The active footer-bar tab state.
 */
export const getStoreActiveFooterBarTab = (mapId: string): ActiveFooterBarTabType => getStoreUIState(mapId).activeFooterBarTab;

/**
 * Gets the active app-bar tab from the store.
 *
 * @param mapId - The map id.
 * @returns The active app-bar tab state.
 */
export const getStoreActiveAppBarTab = (mapId: string): ActiveAppBarTabType => getStoreUIState(mapId).activeAppBarTab;

/**
 * Gets the footer-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of footer-bar component props.
 */
export const getStoreFooterBarComponents = (mapId: string): TypeValidFooterBarTabsCoreProps[] => getStoreUIState(mapId).footerBarComponents;

/**
 * Gets the app-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of app-bar component props.
 */
export const getStoreAppBarComponents = (mapId: string): TypeValidAppBarCoreProps[] => getStoreUIState(mapId).appBarComponents;

/**
 * Gets the nav-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of nav-bar component props.
 */
export const getStoreNavBarComponents = (mapId: string): TypeValidNavBarProps[] => getStoreUIState(mapId).navBarComponents;

/**
 * Gets the core package component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of core package component props.
 */
export const getStoreCorePackageComponents = (mapId: string): TypeValidMapCorePackageProps[] =>
  getStoreUIState(mapId).corePackagesComponents;

// #endregion STATE SELECTORS

/** Describes which element holds the focus trap and where to restore focus on release. */
export type FocusItemProps = {
  /** The id of the element that currently has focus, or false if no focus trap is active. */
  activeElementId: string | false;

  /** The id of the element to restore focus to when the trap is released, or false. */
  callbackElementId: string | false;
};

/** Describes the active app-bar tab state. */
export type ActiveAppBarTabType = {
  /** The identifier of the active tab. */
  tabId: string;

  /** Whether the app-bar panel is open. */
  isOpen: boolean;

  /** Optional flag indicating whether focus is trapped inside the panel. */
  isFocusTrapped?: boolean;
};

/** Describes the active footer-bar tab state. */
export type ActiveFooterBarTabType = {
  /** The identifier of the active tab. */
  tabId: string;

  /** Whether the footer-bar panel is open. */
  isOpen: boolean;

  /** Optional flag indicating whether focus is trapped inside the panel. */
  isFocusTrapped?: boolean;
};
