import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeValidAppBarCoreProps, TypeMapCorePackages, TypeNavBarProps } from '@/geo';
import { TypeMapFeaturesConfig } from '@/core/types/cgpv-types';
type focusItemProps = {
    activeElementId: string | false;
    callbackElementId: string | false;
};
export interface IUIState {
    activeFooterBarTabId: string;
    activeTrapGeoView: boolean;
    appBarComponents: TypeValidAppBarCoreProps;
    corePackagesComponents: TypeMapCorePackages;
    focusITem: focusItemProps;
    geoLocatorActive: boolean;
    mapInfoExpanded: boolean;
    navBarComponents: TypeNavBarProps;
    footerPanelResizeValue: number;
    footerPanelResizeValues: number[];
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        closeModal: () => void;
        openModal: (uiFocus: focusItemProps) => void;
        setActiveFooterBarTab: (id: string) => void;
        setActiveTrapGeoView: (active: boolean) => void;
        setGeolocatorActive: (active: boolean) => void;
        setFooterPanelResizeValue: (value: number) => void;
        setMapInfoExpanded: (expanded: boolean) => void;
    };
}
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState;
export declare const useUIActiveFocusItem: () => focusItemProps;
export declare const useUIActiveFooterBarTabId: () => string;
export declare const useUIActiveTrapGeoView: () => boolean;
export declare const useUIAppbarComponents: () => TypeValidAppBarCoreProps;
export declare const useUIAppbarGeolocatorActive: () => boolean;
export declare const useUICorePackagesComponents: () => TypeMapCorePackages;
export declare const useUIFooterPanelResizeValue: () => number;
export declare const useUIFooterPanelResizeValues: () => number[];
export declare const useUIMapInfoExpanded: () => boolean;
export declare const useUINavbarComponents: () => TypeNavBarProps;
export declare const useUIStoreActions: () => {
    closeModal: () => void;
    openModal: (uiFocus: focusItemProps) => void;
    setActiveFooterBarTab: (id: string) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
    setFooterPanelResizeValue: (value: number) => void;
    setMapInfoExpanded: (expanded: boolean) => void;
};
export {};
