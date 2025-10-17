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
export {};
//# sourceMappingURL=geoview-store.d.ts.map