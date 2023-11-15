import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
export interface IUIState {
    footerBarExpanded: boolean;
    geoLocatorActive: boolean;
    actions: {
        setFooterBarExpanded: (expanded: boolean) => void;
        setGeolocatorActive: (active: boolean) => void;
    };
}
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): IUIState;
export declare const useUIAppbarGeolocatorActive: () => boolean;
export declare const useUIFooterBarExpanded: () => boolean;
export declare const useUIStoreActions: () => {
    setFooterBarExpanded: (expanded: boolean) => void;
    setGeolocatorActive: (active: boolean) => void;
};
