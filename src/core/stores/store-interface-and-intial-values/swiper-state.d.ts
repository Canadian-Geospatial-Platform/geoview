import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
export type SwipeOrientation = 'horizontal' | 'vertical';
type SwiperActions = ISwiperState['actions'];
export interface ISwiperState {
    layerPaths: string[];
    orientation: SwipeOrientation;
    actions: {
        setLayerPaths: (layerPaths: string[]) => void;
        setOrientation: (orientation: SwipeOrientation) => void;
    };
    setterActions: {
        setLayerPaths: (layerPaths: string[]) => void;
        setOrientation: (orientation: SwipeOrientation) => void;
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
export declare const useSwiperOrientation: () => string;
export declare const useSwiperStoreActions: () => SwiperActions;
export {};
//# sourceMappingURL=swiper-state.d.ts.map