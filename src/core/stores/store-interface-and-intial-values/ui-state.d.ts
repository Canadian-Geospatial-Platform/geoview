import type { TypeValidAppBarCoreProps, TypeValidFooterBarTabsCoreProps, TypeValidMapCorePackageProps, TypeValidNavBarProps } from '@/api/types/map-schema-types';
import type { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
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
export declare const useUIActiveAppBarTab: () => ActiveAppBarTabType;
export declare const useUIActiveFooterBarTab: () => ActiveFooterBarTabType;
export declare const useUIActiveTrapGeoView: () => boolean;
export declare const useUIAppbarComponents: () => TypeValidAppBarCoreProps[];
export declare const useUIFooterBarComponents: () => TypeValidFooterBarTabsCoreProps[];
export declare const useUICorePackagesComponents: () => TypeValidMapCorePackageProps[];
export declare const useUIFooterPanelResizeValue: () => number;
export declare const useUIHiddenTabs: () => string[];
export declare const useUINavbarComponents: () => TypeValidNavBarProps[];
export declare const useUIStoreActions: () => UIActions;
export {};
//# sourceMappingURL=ui-state.d.ts.map