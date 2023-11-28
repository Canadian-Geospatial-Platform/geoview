import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
type focusItemProps = {
    activeElementId: string | false;
    callbackElementId: string | false;
};
export interface IUIState {
    activeTrapGeoView: boolean;
    focusITem: focusItemProps;
    footerBarExpanded: boolean;
    geoLocatorActive: boolean;
    actions: {
        closeModal: () => void;
        openModal: (uiFocus: focusItemProps) => void;
        setActiveTrapGeoView: (active: boolean) => void;
        setFooterBarExpanded: (expanded: boolean) => void;
        setGeolocatorActive: (active: boolean) => void;
    };
}
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState;
export declare const useUIActiveFocusItem: () => focusItemProps;
export declare const useUIActiveTrapGeoView: () => boolean;
export declare const useUIAppbarGeolocatorActive: () => boolean;
export declare const useUIFooterBarExpanded: () => boolean;
export declare const useUIStoreActions: () => {
    closeModal: () => void;
    openModal: (uiFocus: focusItemProps) => void;
    setActiveTrapGeoView: (active: boolean) => void;
    setFooterBarExpanded: (expanded: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
};
export {};
