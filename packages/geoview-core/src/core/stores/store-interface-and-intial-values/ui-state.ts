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

/** Serializable metadata for a footer tab entry (no JSX \u2014 content lives in the FooterBarApi registry). */
export type TypeFooterTabEntry = {
  /** The unique tab identifier. */
  id: string;
  /** The tab label (translation key or display string). */
  label?: string;
};

/**
 * Represents the UI Zustand store slice.
 *
 * Manages state for the UI including app-bar, footer-bar, nav-bar, and focus-trap states.
 */
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

  /** Footer tab entries registered via the FooterBarApi (serializable metadata only — no JSX). */
  footerTabs: TypeFooterTabEntry[];

  /** App-bar panel identifiers registered via the AppBarApi (full objects live in the AppBarApi registry). */
  appBarPanelIds: string[];

  /** The list of nav-bar component identifiers. */
  navBarComponents: TypeValidNavBarProps[];

  /** Version counter that increments when nav-bar button panels are added or removed (triggers re-render). */
  navBarButtonPanelVersion: number;

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

    /** Adds a footer tab entry. */
    addFooterTab: (tab: TypeFooterTabEntry) => void;

    /** Removes a footer tab entry by id. */
    removeFooterTab: (id: string) => void;

    /** Adds an app-bar panel id. */
    addAppBarPanelId: (id: string) => void;

    /** Removes an app-bar panel id. */
    removeAppBarPanelId: (id: string) => void;

    /** Increments the nav-bar button panel version to trigger a re-render. */
    bumpNavBarButtonPanelVersion: () => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes an UI State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized UI State
 */
export function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState {
  const init = {
    appBarComponents: ['geolocator'],
    activeAppBarTab: { tabId: '', isOpen: false, isFocusTrapped: false },
    footerBarComponents: [],
    activeFooterBarTab: { tabId: '', isOpen: false, isFocusTrapped: false },
    navBarComponents: [],
    navBarButtonPanelVersion: 0,
    activeTrapGeoView: false,
    corePackagesComponents: [],
    focusItem: { activeElementId: false, callbackElementId: false },
    hiddenTabs: ['data-table', 'time-slider', 'geochart'],
    footerTabs: [],
    appBarPanelIds: [],
    footerPanelResizeValue: 35,

    // initialize default stores section from config information when store receive configuration file
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig): void => {
      // App bar and footer bar state rules:
      // - selectedTab set → open
      // - selectedTab unset → close
      const isAppBarOpen = !!geoviewConfig.appBar?.selectedTab;
      const isFooterBarOpen = !!geoviewConfig.footerBar?.selectedTab;

      // Seed footer tabs from config so they are available on the very first render
      const coreTabs = geoviewConfig.footerBar?.tabs?.core || [];
      const footerTabEntries: TypeFooterTabEntry[] = coreTabs.map((id) => ({ id }));

      // If no selectedTab in config, default to the first core tab so the tab content renders
      const footerSelectedTab = geoviewConfig.footerBar?.selectedTab || coreTabs[0] || '';

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
          footerTabs: footerTabEntries,
          activeFooterBarTab: {
            tabId: footerSelectedTab,
            isOpen: isFooterBarOpen,
            isFocusTrapped: false,
          },
          corePackagesComponents: geoviewConfig.corePackages || [],
          navBarComponents: geoviewConfig.navBar || [],
        },
      });
    },

    actions: {
      /**
       * Enables the focus trap for the given UI element.
       *
       * @param uiFocus - The focus item properties
       */
      enableFocusTrap: (uiFocus: FocusItemProps): void => {
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
      /**
       * Disables the focus trap and restores focus to the callback element.
       *
       * @param callBackElementId - The element ID to restore focus to
       */
      disableFocusTrap: (callBackElementId: string): void => {
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

      /**
       * Sets the active footer bar tab.
       *
       * @param tabId - The tab ID to activate, or undefined to clear
       */
      setActiveFooterBarTab: (tabId: string | undefined): void => {
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

      /**
       * Sets whether the GeoView trap is active.
       *
       * @param active - Whether the trap is active
       */
      setActiveTrapGeoView: (active: boolean): void => {
        set({
          uiState: {
            ...get().uiState,
            activeTrapGeoView: active,
          },
        });
      },

      /**
       * Sets the hidden tabs list.
       *
       * @param hiddenTabs - The array of tab IDs to hide
       */
      setHiddenTabs: (hiddenTabs: string[]): void => {
        set({
          uiState: {
            ...get().uiState,
            hiddenTabs: [...hiddenTabs],
          },
        });
      },

      /**
       * Sets the footer panel resize value.
       *
       * @param value - The resize value
       */
      setFooterPanelResizeValue: (value): void => {
        set({
          uiState: {
            ...get().uiState,
            footerPanelResizeValue: value,
          },
        });
      },

      // TODO: the setter for footer bar is still split in 2 instead of following app bar. Ken, can you set it up correclty with your PR for footer....
      /**
       * Sets whether the footer bar is open.
       *
       * @param open - Whether the footer bar should be open
       */
      setFooterBarIsOpen: (open: boolean): void => {
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

      /**
       * Adds a footer tab entry to the store.
       *
       * @param tab - The footer tab entry to add
       */
      addFooterTab: (tab: TypeFooterTabEntry): void => {
        const existing = get().uiState.footerTabs;
        const index = existing.findIndex((t) => t.id === tab.id);
        if (index === -1) {
          // Add new entry
          set({
            uiState: {
              ...get().uiState,
              footerTabs: [...existing, tab],
            },
          });
        } else {
          // Upsert existing entry to trigger re-render (e.g. when plugin registers content after seeding)
          const updated = [...existing];
          updated[index] = tab;
          set({
            uiState: {
              ...get().uiState,
              footerTabs: updated,
            },
          });
        }
      },

      /**
       * Removes a footer tab entry from the store by id.
       *
       * @param id - The tab id to remove
       */
      removeFooterTab: (id: string): void => {
        set({
          uiState: {
            ...get().uiState,
            footerTabs: get().uiState.footerTabs.filter((t) => t.id !== id),
          },
        });
      },

      /**
       * Adds an app-bar panel id to the store.
       *
       * @param id - The panel id to add
       */
      addAppBarPanelId: (id: string): void => {
        const existing = get().uiState.appBarPanelIds;
        if (!existing.includes(id)) {
          set({
            uiState: {
              ...get().uiState,
              appBarPanelIds: [...existing, id],
            },
          });
        }
      },

      /**
       * Removes an app-bar panel id from the store.
       *
       * @param id - The panel id to remove
       */
      removeAppBarPanelId: (id: string): void => {
        set({
          uiState: {
            ...get().uiState,
            appBarPanelIds: get().uiState.appBarPanelIds.filter((panelId) => panelId !== id),
          },
        });
      },

      /**
       * Increments the nav-bar button panel version to trigger a re-render.
       */
      bumpNavBarButtonPanelVersion: (): void => {
        set({
          uiState: {
            ...get().uiState,
            navBarButtonPanelVersion: get().uiState.navBarButtonPanelVersion + 1,
          },
        });
      },

      /**
       * Sets the active app bar tab.
       *
       * @param tabId - The tab ID to activate, or undefined to clear
       * @param isOpen - Whether the app bar panel should be open
       * @param isFocusTrapped - Optional whether focus should be trapped in the panel
       */
      setActiveAppBarTab: (tabId: string | undefined, isOpen: boolean, isFocusTrapped: boolean = false): void => {
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

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full UI state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
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
export const getStoreUIActiveFooterBarTab = (mapId: string): ActiveFooterBarTabType => getStoreUIState(mapId).activeFooterBarTab;

/** Hooks the active footer-bar tab state. */
export const useStoreUIActiveFooterBarTab = (): ActiveFooterBarTabType =>
  useStore(useGeoViewStore(), (state) => state.uiState.activeFooterBarTab);

/**
 * Gets the active app-bar tab from the store.
 *
 * @param mapId - The map id.
 * @returns The active app-bar tab state.
 */
export const getStoreUIActiveAppBarTab = (mapId: string): ActiveAppBarTabType => getStoreUIState(mapId).activeAppBarTab;

/** Hooks the active app-bar tab state. */
export const useStoreUIActiveAppBarTab = (): ActiveAppBarTabType => useStore(useGeoViewStore(), (state) => state.uiState.activeAppBarTab);

/**
 * Gets the footer-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of footer-bar component props.
 */
export const getStoreUIFooterBarComponents = (mapId: string): TypeValidFooterBarTabsCoreProps[] =>
  getStoreUIState(mapId).footerBarComponents;

/** Hooks the footer-bar component identifiers. */
export const useStoreUIFooterBarComponents = (): TypeValidFooterBarTabsCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.footerBarComponents);

/**
 * Gets the app-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of app-bar component props.
 */
export const getStoreUIAppBarComponents = (mapId: string): TypeValidAppBarCoreProps[] => getStoreUIState(mapId).appBarComponents;

/** Hooks the app-bar component identifiers. */
export const useStoreUIAppbarComponents = (): TypeValidAppBarCoreProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.appBarComponents);

/**
 * Gets the nav-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of nav-bar component props.
 */
export const getStoreUINavBarComponents = (mapId: string): TypeValidNavBarProps[] => getStoreUIState(mapId).navBarComponents;

/** Hooks the nav-bar component identifiers. */
export const useStoreUINavbarComponents = (): TypeValidNavBarProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.navBarComponents);

/**
 * Gets the core package component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of core package component props.
 */
export const getStoreUICorePackageComponents = (mapId: string): TypeValidMapCorePackageProps[] =>
  getStoreUIState(mapId).corePackagesComponents;

/** Hooks the core package component identifiers. */
export const useStoreUICorePackagesComponents = (): TypeValidMapCorePackageProps[] =>
  useStore(useGeoViewStore(), (state) => state.uiState.corePackagesComponents);

/**
 * Gets the footer tab entries from the store.
 *
 * @param mapId - The map identifier
 * @returns The array of footer tab entries
 */
export const getStoreUIFooterTabs = (mapId: string): TypeFooterTabEntry[] => getStoreUIState(mapId).footerTabs;

/** Hooks the footer tab entries registered via the FooterBarApi. */
export const useStoreUIFooterTabs = (): TypeFooterTabEntry[] => useStore(useGeoViewStore(), (state) => state.uiState.footerTabs);

/**
 * Gets the app-bar panel ids from the store.
 *
 * @param mapId - The map identifier
 * @returns The array of app-bar panel ids
 */
export const getStoreUIAppBarPanelIds = (mapId: string): string[] => getStoreUIState(mapId).appBarPanelIds;

/** Hooks the app-bar panel ids registered via the AppBarApi. */
export const useStoreUIAppBarPanelIds = (): string[] => useStore(useGeoViewStore(), (state) => state.uiState.appBarPanelIds);

/** Hooks the nav-bar button panel version counter (triggers re-render on change). */
export const useStoreUINavBarButtonPanelVersion = (): number =>
  useStore(useGeoViewStore(), (state) => state.uiState.navBarButtonPanelVersion);

/** Hooks the current focus-trap item from the UI state. */
export const useStoreUIActiveFocusItem = (): FocusItemProps => useStore(useGeoViewStore(), (state) => state.uiState.focusItem);

/** Hooks whether the GeoView-level keyboard focus trap is active. */
export const useStoreUIActiveTrapGeoView = (): boolean => useStore(useGeoViewStore(), (state) => state.uiState.activeTrapGeoView);

/** Hooks the footer panel resize value. */
export const useStoreUIFooterPanelResizeValue = (): number => useStore(useGeoViewStore(), (state) => state.uiState.footerPanelResizeValue);

/** Hooks the list of hidden tab identifiers. */
export const useStoreUIHiddenTabs = (): string[] => useStore(useGeoViewStore(), (state) => state.uiState.hiddenTabs);

// #endregion STATE GETTERS & HOOKS

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the active footer bar tab.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier, or undefined to deactivate
 */
export const setStoreUIActiveFooterBarTab = (mapId: string, tab: string | undefined): void => {
  getStoreUIState(mapId).actions.setActiveFooterBarTab(tab);
};

/**
 * Sets the active app bar tab with its open and focus trap state.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier, or undefined to deactivate
 * @param isOpen - Whether the tab is open
 * @param isFocusTrapped - Whether focus is trapped on the tab
 */
export const setStoreUIActiveAppBarTab = (mapId: string, tab: string | undefined, isOpen: boolean, isFocusTrapped: boolean): void => {
  getStoreUIState(mapId).actions.setActiveAppBarTab(tab, isOpen, isFocusTrapped);
};

/**
 * Sets the footer bar open state.
 *
 * @param mapId - The map identifier
 * @param isOpen - Whether the footer bar is open
 */
export const setStoreUIFooterBarIsOpen = (mapId: string, isOpen: boolean): void => {
  getStoreUIState(mapId).actions.setFooterBarIsOpen(isOpen);
};

/**
 * Enables the focus trap on a specific UI element.
 *
 * @param mapId - The map identifier
 * @param uiFocus - The focus item containing active and callback element identifiers
 */
export const enableStoreUIFocusTrap = (mapId: string, uiFocus: FocusItemProps): void => {
  getStoreUIState(mapId).actions.enableFocusTrap(uiFocus);
};

/**
 * Disables the focus trap and restores focus to a callback element.
 *
 * Uses requestAnimationFrame to ensure DOM updates complete before focus restoration.
 *
 * @param mapId - The map identifier
 * @param callbackElementId - Optional element identifier to restore focus to. If 'no-focus' is passed, focus is not restored
 */
export const disableStoreUIFocusTrap = (mapId: string, callbackElementId?: string): void => {
  getStoreUIState(mapId).actions.disableFocusTrap(callbackElementId);
};

/**
 * Toggles the GeoView-level keyboard focus trap.
 *
 * @param mapId - The map identifier
 * @param active - Whether the focus trap is active
 */
export const setStoreUIActiveTrapGeoView = (mapId: string, active: boolean): void => {
  getStoreUIState(mapId).actions.setActiveTrapGeoView(active);
};

/**
 * Sets the footer panel resize value (percentage).
 *
 * @param mapId - The map identifier
 * @param value - The resize percentage value
 */
export const setStoreUIFooterPanelResizeValue = (mapId: string, value: number): void => {
  getStoreUIState(mapId).actions.setFooterPanelResizeValue(value);
};

/**
 * Shows a tab button by removing it from the hidden tabs list.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier to show
 */
export const showStoreUITabButton = (mapId: string, tab: string): void => {
  const uiState = getStoreUIState(mapId);
  const { hiddenTabs } = uiState;

  // Find it
  const tabIndex = hiddenTabs.indexOf(tab);
  if (tabIndex !== -1) {
    hiddenTabs.splice(tabIndex, 1);
    uiState.actions.setHiddenTabs([...hiddenTabs]);
  }
};

/**
 * Hides a tab button by adding it to the hidden tabs list.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier to hide
 */
export const hideStoreUITabButton = (mapId: string, tab: string): void => {
  const uiState = getStoreUIState(mapId);
  const { hiddenTabs } = uiState;

  // Only add if not already hidden
  if (!hiddenTabs.includes(tab)) {
    uiState.actions.setHiddenTabs([...hiddenTabs, tab]);
  }
};

/**
 * Adds a footer tab entry to the store.
 *
 * @param mapId - The map identifier
 * @param tab - The footer tab entry to add
 */
export const addStoreUIFooterTab = (mapId: string, tab: TypeFooterTabEntry): void => {
  getStoreUIState(mapId).actions.addFooterTab(tab);
};

/**
 * Removes a footer tab entry from the store by id.
 *
 * @param mapId - The map identifier
 * @param id - The tab id to remove
 */
export const removeStoreUIFooterTab = (mapId: string, id: string): void => {
  getStoreUIState(mapId).actions.removeFooterTab(id);
};

/**
 * Adds an app-bar panel id to the store.
 *
 * @param mapId - The map identifier
 * @param id - The panel id to add
 */
export const addStoreUIAppBarPanelId = (mapId: string, id: string): void => {
  getStoreUIState(mapId).actions.addAppBarPanelId(id);
};

/**
 * Removes an app-bar panel id from the store.
 *
 * @param mapId - The map identifier
 * @param id - The panel id to remove
 */
export const removeStoreUIAppBarPanelId = (mapId: string, id: string): void => {
  getStoreUIState(mapId).actions.removeAppBarPanelId(id);
};

/**
 * Bumps the nav-bar button panel version to trigger a re-render.
 *
 * @param mapId - The map identifier
 */
export const bumpStoreUINavBarButtonPanelVersion = (mapId: string): void => {
  getStoreUIState(mapId).actions.bumpNavBarButtonPanelVersion();
};

// #endregion STATE ADAPTORS

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
