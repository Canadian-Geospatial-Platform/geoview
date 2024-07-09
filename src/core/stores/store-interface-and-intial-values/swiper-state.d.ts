import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
type SwiperActions = ISwiperState['actions'];
export interface ISwiperState {
    layerPaths: string[];
    actions: {
        setLayerPaths: (layerPaths: string[]) => void;
    };
    setterActions: {
        setLayerPaths: (layerPaths: string[]) => void;
    };
}
/**
 * Initializes a Swiper state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {ISwiperState} - The Swiper state object
 */
export declare function initializeSwiperState(set: TypeSetStore, get: TypeGetStore): ISwiperState;
export declare const useSwiperLayerPaths: () => string[];
export declare const useSwiperStoreActions: () => SwiperActions;
export {};
