import type { UseBoundStore, Mutate, StoreApi } from 'zustand';
import type { IAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { IFeatureInfoState } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import type { ILayerState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { IMapState } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { IDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { ITimeSliderState } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { IGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import type { ISwiperState } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import type { IDrawerState } from './store-interface-and-intial-values/drawer-state';
import type { IUIState } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
export type TypeSetStore = (partial: IGeoviewState | Partial<IGeoviewState> | ((state: IGeoviewState) => IGeoviewState | Partial<IGeoviewState>), replace?: false | undefined) => void;
export type TypeGetStore = () => IGeoviewState;
export interface IGeoviewState {
    mapConfig: TypeMapFeaturesConfig | undefined;
    mapId: string;
    setMapConfig: (config: TypeMapFeaturesConfig) => void;
    appState: IAppState;
    detailsState: IFeatureInfoState;
    dataTableState: IDataTableState;
    layerState: ILayerState;
    mapState: IMapState;
    uiState: IUIState;
    geochartState: IGeochartState;
    timeSliderState: ITimeSliderState;
    swiperState: ISwiperState;
    drawerState: IDrawerState;
}
export declare const geoviewStoreDefinition: (set: TypeSetStore, get: TypeGetStore) => IGeoviewState;
export declare const geoviewStoreDefinitionWithSubscribeSelector: import("zustand").StateCreator<IGeoviewState, [], [["zustand/subscribeWithSelector", never]]>;
type SubscribeWithSelectorMiddleware = [['zustand/subscribeWithSelector', never]];
export type GeoviewStoreType = UseBoundStore<Mutate<StoreApi<IGeoviewState>, SubscribeWithSelectorMiddleware>>;
export declare const useGeoViewMapId: () => string;
export declare const useGeoViewConfig: () => TypeMapFeaturesConfig | undefined;
/** To be able to compare objects for hooks */
type EqualityFn<T> = (prev: T, next: T) => boolean;
/**
 * A React hook that wraps a Zustand store selector and preserves the previous reference
 * if the selected value is equal to the previous one, preventing unnecessary re-renders.
 * This is useful when the store returns a new object or array on every update,
 * but you want to avoid infinite render loops or excessive component updates.
 * @template T - The type of the selected state slice.
 * @param {GeoviewStoreType} store - The Zustand store instance to subscribe to.
 * @param {(state: IGeoviewState) => T} selector - A function that selects a piece of state from the store.
 * @param {(prev: T, next: T) => boolean} [isEqual] - A function that compares the previous and next selector results.
 *                                                    Should return true if they are equal and reference can be reused.
 * @returns {T} The selected state slice. Returns the previous reference if `isEqual(prev, next)` is true.
 * @example
 * const queryableLayers = useStableSelector(
 *   store,
 *   (state) => state.layers.reduce((acc, layer) => ({ ...acc, [layer.id]: layer.queryable }), {}),
 *   shallowObjectEqual
 * );
 */
export declare function useStableSelector<T>(store: GeoviewStoreType, selector: (state: IGeoviewState) => T, isEqual?: EqualityFn<T>): T;
export {};
//# sourceMappingURL=geoview-store.d.ts.map