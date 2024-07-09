import { IAppState } from './store-interface-and-intial-values/app-state';
import { IFeatureInfoState } from './store-interface-and-intial-values/feature-info-state';
import { ILayerState } from './store-interface-and-intial-values/layer-state';
import { IMapState } from './store-interface-and-intial-values/map-state';
import { IDataTableState } from './store-interface-and-intial-values/data-table-state';
import { ITimeSliderState } from './store-interface-and-intial-values/time-slider-state';
import { IGeochartState } from './store-interface-and-intial-values/geochart-state';
import { ISwiperState } from './store-interface-and-intial-values/swiper-state';
import { IUIState } from './store-interface-and-intial-values/ui-state';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
export type TypeSetStore = (partial: IGeoviewState | Partial<IGeoviewState> | ((state: IGeoviewState) => IGeoviewState | Partial<IGeoviewState>), replace?: boolean | undefined) => void;
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
}
export declare const geoviewStoreDefinition: (set: TypeSetStore, get: TypeGetStore) => IGeoviewState;
export declare const geoviewStoreDefinitionWithSubscribeSelector: import("zustand").StateCreator<IGeoviewState, [], [["zustand/subscribeWithSelector", never]], IGeoviewState>;
declare const fakeStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<IGeoviewState>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: IGeoviewState, previousSelectedState: IGeoviewState) => void): () => void;
        <U>(selector: (state: IGeoviewState) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean | undefined;
        } | undefined): () => void;
    };
}>;
export type GeoviewStoreType = typeof fakeStore;
export declare const useGeoViewMapId: () => string;
export declare const useGeoViewConfig: () => TypeMapFeaturesConfig | undefined;
export {};
