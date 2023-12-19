import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeAppBarProps, TypeMapCorePackages, TypeNavBarProps } from '@/geo';
import { TypeMapFeaturesConfig } from '@/core/types/cgpv-types';
type focusItemProps = {
    activeElementId: string | false;
    callbackElementId: string | false;
};
export interface IUIState {
    activefoorterTabId: string;
    activeTrapGeoView: boolean;
    appBarComponents: TypeAppBarProps;
    corePackagesComponents: TypeMapCorePackages;
    focusITem: focusItemProps;
    footerBarExpanded: boolean;
    geoLocatorActive: boolean;
    navBarComponents: TypeNavBarProps;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        closeModal: () => void;
        openModal: (uiFocus: focusItemProps) => void;
        setActiveFooterTab: (id: string) => void;
        setActiveTrapGeoView: (active: boolean) => void;
        setFooterBarExpanded: (expanded: boolean) => void;
        setGeolocatorActive: (active: boolean) => void;
    };
}
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState;
export declare const useUIActiveFocusItem: () => focusItemProps;
export declare const useUIActiveTrapGeoView: () => boolean;
export declare const useUIAppbarComponents: () => TypeAppBarProps;
export declare const useUIAppbarGeolocatorActive: () => boolean;
export declare const useUICorePackagesComponents: () => TypeMapCorePackages;
export declare const useUIFooterBarExpanded: () => boolean;
export declare const useUINavbarComponents: () => TypeNavBarProps;
export declare const useUIStoreActions: () => {
    closeModal: () => void;
    openModal: (uiFocus: focusItemProps) => void;
    setActiveFooterTab: (id: string) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterBarExpanded: (expanded: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
};
export {};
