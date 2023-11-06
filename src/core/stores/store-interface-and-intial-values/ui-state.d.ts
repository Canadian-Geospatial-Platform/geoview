import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
export interface IUIState {
    footerBarExpanded: boolean;
    geoLocatorActive: boolean;
    actions: {
        setGeolocatorActive: (active: boolean) => void;
        setFooterBarExpanded: (expanded: boolean) => void;
    };
}
export declare function initializeUIState(set: TypeSetStore, get: TypeGetStore): {
    footerBarExpanded: boolean;
    geoLocatorActive: boolean;
    actions: {
        setFooterBarExpanded: (expanded: boolean) => void;
        setGeolocatorActive: (active: boolean) => void;
    };
};
export declare const useUIFooterBarExpanded: () => boolean;
export declare const useUIappbarGeolocatorActive: () => boolean;
export declare const useUIStoreActions: () => {
    setGeolocatorActive: (active: boolean) => void;
    setFooterBarExpanded: (expanded: boolean) => void;
};
