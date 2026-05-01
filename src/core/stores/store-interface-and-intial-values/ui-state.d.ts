import type { TypeValidAppBarCoreProps, TypeValidFooterBarTabsCoreProps, TypeValidMapCorePackageProps, TypeValidNavBarProps } from '@/api/types/map-schema-types';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
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
/**
 * Initializes an UI State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized UI State
 */
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState;
/**
 * Gets the active footer-bar tab from the store.
 *
 * @param mapId - The map id.
 * @returns The active footer-bar tab state.
 */
export declare const getStoreUIActiveFooterBarTab: (mapId: string) => ActiveFooterBarTabType;
/** Hooks the active footer-bar tab state. */
export declare const useStoreUIActiveFooterBarTab: () => ActiveFooterBarTabType;
/**
 * Gets the active app-bar tab from the store.
 *
 * @param mapId - The map id.
 * @returns The active app-bar tab state.
 */
export declare const getStoreUIActiveAppBarTab: (mapId: string) => ActiveAppBarTabType;
/** Hooks the active app-bar tab state. */
export declare const useStoreUIActiveAppBarTab: () => ActiveAppBarTabType;
/**
 * Gets the footer-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of footer-bar component props.
 */
export declare const getStoreUIFooterBarComponents: (mapId: string) => TypeValidFooterBarTabsCoreProps[];
/** Hooks the footer-bar component identifiers. */
export declare const useStoreUIFooterBarComponents: () => TypeValidFooterBarTabsCoreProps[];
/**
 * Gets the app-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of app-bar component props.
 */
export declare const getStoreUIAppBarComponents: (mapId: string) => TypeValidAppBarCoreProps[];
/** Hooks the app-bar component identifiers. */
export declare const useStoreUIAppbarComponents: () => TypeValidAppBarCoreProps[];
/**
 * Gets the nav-bar component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of nav-bar component props.
 */
export declare const getStoreUINavBarComponents: (mapId: string) => TypeValidNavBarProps[];
/** Hooks the nav-bar component identifiers. */
export declare const useStoreUINavbarComponents: () => TypeValidNavBarProps[];
/**
 * Gets the core package component identifiers from the store.
 *
 * @param mapId - The map id.
 * @returns The array of core package component props.
 */
export declare const getStoreUICorePackageComponents: (mapId: string) => TypeValidMapCorePackageProps[];
/** Hooks the core package component identifiers. */
export declare const useStoreUICorePackagesComponents: () => TypeValidMapCorePackageProps[];
/**
 * Gets the footer tab entries from the store.
 *
 * @param mapId - The map identifier
 * @returns The array of footer tab entries
 */
export declare const getStoreUIFooterTabs: (mapId: string) => TypeFooterTabEntry[];
/** Hooks the footer tab entries registered via the FooterBarApi. */
export declare const useStoreUIFooterTabs: () => TypeFooterTabEntry[];
/**
 * Gets the app-bar panel ids from the store.
 *
 * @param mapId - The map identifier
 * @returns The array of app-bar panel ids
 */
export declare const getStoreUIAppBarPanelIds: (mapId: string) => string[];
/** Hooks the app-bar panel ids registered via the AppBarApi. */
export declare const useStoreUIAppBarPanelIds: () => string[];
/** Hooks the nav-bar button panel version counter (triggers re-render on change). */
export declare const useStoreUINavBarButtonPanelVersion: () => number;
/** Hooks the current focus-trap item from the UI state. */
export declare const useStoreUIActiveFocusItem: () => FocusItemProps;
/** Hooks whether the GeoView-level keyboard focus trap is active. */
export declare const useStoreUIActiveTrapGeoView: () => boolean;
/** Hooks the footer panel resize value. */
export declare const useStoreUIFooterPanelResizeValue: () => number;
/** Hooks the list of hidden tab identifiers. */
export declare const useStoreUIHiddenTabs: () => string[];
/**
 * Sets the active footer bar tab.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier, or undefined to deactivate
 */
export declare const setStoreUIActiveFooterBarTab: (mapId: string, tab: string | undefined) => void;
/**
 * Sets the active app bar tab with its open and focus trap state.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier, or undefined to deactivate
 * @param isOpen - Whether the tab is open
 * @param isFocusTrapped - Whether focus is trapped on the tab
 */
export declare const setStoreUIActiveAppBarTab: (mapId: string, tab: string | undefined, isOpen: boolean, isFocusTrapped: boolean) => void;
/**
 * Sets the footer bar open state.
 *
 * @param mapId - The map identifier
 * @param isOpen - Whether the footer bar is open
 */
export declare const setStoreUIFooterBarIsOpen: (mapId: string, isOpen: boolean) => void;
/**
 * Enables the focus trap on a specific UI element.
 *
 * @param mapId - The map identifier
 * @param uiFocus - The focus item containing active and callback element identifiers
 */
export declare const enableStoreUIFocusTrap: (mapId: string, uiFocus: FocusItemProps) => void;
/**
 * Disables the focus trap and restores focus to a callback element.
 *
 * Uses requestAnimationFrame to ensure DOM updates complete before focus restoration.
 *
 * @param mapId - The map identifier
 * @param callbackElementId - Optional element identifier to restore focus to. If 'no-focus' is passed, focus is not restored
 */
export declare const disableStoreUIFocusTrap: (mapId: string, callbackElementId?: string) => void;
/**
 * Toggles the GeoView-level keyboard focus trap.
 *
 * @param mapId - The map identifier
 * @param active - Whether the focus trap is active
 */
export declare const setStoreUIActiveTrapGeoView: (mapId: string, active: boolean) => void;
/**
 * Sets the footer panel resize value (percentage).
 *
 * @param mapId - The map identifier
 * @param value - The resize percentage value
 */
export declare const setStoreUIFooterPanelResizeValue: (mapId: string, value: number) => void;
/**
 * Shows a tab button by removing it from the hidden tabs list.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier to show
 */
export declare const showStoreUITabButton: (mapId: string, tab: string) => void;
/**
 * Hides a tab button by adding it to the hidden tabs list.
 *
 * @param mapId - The map identifier
 * @param tab - The tab identifier to hide
 */
export declare const hideStoreUITabButton: (mapId: string, tab: string) => void;
/**
 * Adds a footer tab entry to the store.
 *
 * @param mapId - The map identifier
 * @param tab - The footer tab entry to add
 */
export declare const addStoreUIFooterTab: (mapId: string, tab: TypeFooterTabEntry) => void;
/**
 * Removes a footer tab entry from the store by id.
 *
 * @param mapId - The map identifier
 * @param id - The tab id to remove
 */
export declare const removeStoreUIFooterTab: (mapId: string, id: string) => void;
/**
 * Adds an app-bar panel id to the store.
 *
 * @param mapId - The map identifier
 * @param id - The panel id to add
 */
export declare const addStoreUIAppBarPanelId: (mapId: string, id: string) => void;
/**
 * Removes an app-bar panel id from the store.
 *
 * @param mapId - The map identifier
 * @param id - The panel id to remove
 */
export declare const removeStoreUIAppBarPanelId: (mapId: string, id: string) => void;
/**
 * Bumps the nav-bar button panel version to trigger a re-render.
 *
 * @param mapId - The map identifier
 */
export declare const bumpStoreUINavBarButtonPanelVersion: (mapId: string) => void;
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
//# sourceMappingURL=ui-state.d.ts.map