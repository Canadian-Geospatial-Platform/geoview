import { TypeMapCorePackages, TypeNavBarProps, TypeValidAppBarCoreProps } from '@config/types/map-schema-types';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
type UIActions = IUIState['actions'];
export type ActiveAppBarTabType = {
    tabId: string;
    tabGroup: string;
    isOpen: boolean;
    isFocusTrapped?: boolean;
};
export interface IUIState {
    activeFooterBarTabId: string;
    activeTrapGeoView: boolean;
    activeAppBarTab: ActiveAppBarTabType;
    appBarComponents: TypeValidAppBarCoreProps[];
    corePackagesComponents: TypeMapCorePackages;
    focusItem: FocusItemProps;
    hiddenTabs: string[];
    navBarComponents: TypeNavBarProps;
    footerPanelResizeValue: number;
    footerBarIsCollapsed: boolean;
    selectedFooterLayerListItemId: string;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        hideTab: (tab: string) => void;
        enableFocusTrap: (uiFocus: FocusItemProps) => void;
        disableFocusTrap: (callbackElementId?: string) => void;
        showTab: (tab: string) => void;
        setActiveFooterBarTab: (id: string) => void;
        setActiveAppBarTab: (tabId: string, tabGroup: string, isOpen: boolean, isFocusTrapped: boolean) => void;
        setActiveTrapGeoView: (active: boolean) => void;
        setFooterPanelResizeValue: (value: number) => void;
        setFooterBarIsCollapsed: (collapsed: boolean) => void;
        setSelectedFooterLayerListItemId: (layerListItemId: string) => void;
    };
    setterActions: {
        enableFocusTrap: (uiFocus: FocusItemProps) => void;
        disableFocusTrap: (callbackElementId?: string) => void;
        setActiveFooterBarTab: (id: string) => void;
        setActiveAppBarTab: (tabId: string, tabGroup: string, isOpen: boolean, isFocusTrapped: boolean) => void;
        setActiveTrapGeoView: (active: boolean) => void;
        setFooterPanelResizeValue: (value: number) => void;
        setHiddenTabs: (hiddenTabs: string[]) => void;
        setFooterBarIsCollapsed: (collapsed: boolean) => void;
        setSelectedFooterLayerListItemId: (layerListItemId: string) => void;
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
export declare const useUIActiveAppBarTab: () => ActiveAppBarTabType;
export declare const useUIActiveTrapGeoView: () => boolean;
export declare const useUIAppbarComponents: () => TypeValidAppBarCoreProps[];
export declare const useUICorePackagesComponents: () => TypeMapCorePackages;
export declare const useUIFooterPanelResizeValue: () => number;
export declare const useUIHiddenTabs: () => string[];
export declare const useUINavbarComponents: () => TypeNavBarProps;
export declare const useUIFooterBarIsCollapsed: () => boolean;
export declare const useUISelectedFooterLayerListItemId: () => string;
export declare const useUIStoreActions: () => UIActions;
export {};
