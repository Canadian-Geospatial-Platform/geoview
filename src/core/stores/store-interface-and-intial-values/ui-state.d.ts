import { TypeMapCorePackages, TypeNavBarProps, TypeValidAppBarCoreProps } from '@config/types/map-schema-types';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
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
/**
 * Initializes an UI State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IUIState} - The initialized UI State
 */
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState;
type FocusItemProps = {
    activeElementId: string | false;
    callbackElementId: string | false;
};
export declare const useUIActiveFocusItem: () => FocusItemProps;
export declare const useUIActiveFooterBarTabId: () => string;
export declare const useActiveAppBarTab: () => ActiveAppBarTabType;
export declare const useUIActiveTrapGeoView: () => boolean;
export declare const useUIAppbarComponents: () => TypeValidAppBarCoreProps[];
export declare const useUICorePackagesComponents: () => TypeMapCorePackages;
export declare const useUIFooterPanelResizeValue: () => number;
export declare const useUIFooterPanelResizeValues: () => number[];
export declare const useUIHiddenTabs: () => string[];
export declare const useUIMapInfoExpanded: () => boolean;
export declare const useUINavbarComponents: () => TypeNavBarProps;
export declare const useUIFooterBarIsCollapsed: () => boolean;
export declare const useUIStoreActions: () => UIActions;
export {};
