import { IAppState } from './store-interface-and-intial-values/app-state';
import { IDetailsState } from './store-interface-and-intial-values/details-state';
import { ILayerState } from './store-interface-and-intial-values/layer-state';
import { IMapState } from './store-interface-and-intial-values/map-state';
import { IMapDataTableState } from './store-interface-and-intial-values/data-table-state';
import { IUIState } from './store-interface-and-intial-values/ui-state';
import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
import { TypeLegendResultSets } from '@/api/events/payloads/get-legends-payload';
import { TypeFeatureInfoResultSets } from '@/api/events/payloads/get-feature-info-payload';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
export type TypeSetStore = (partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>), replace?: boolean | undefined) => void;
export type TypeGetStore = () => IGeoViewState;
export interface IGeoViewState {
    displayLanguage: TypeDisplayLanguage;
    mapId: string;
    mapConfig: TypeMapFeaturesConfig | undefined;
    setMapConfig: (config: TypeMapFeaturesConfig) => void;
    appState: IAppState;
    detailsState: IDetailsState;
    dataTableState: IMapDataTableState;
    legendState: ILayerState;
    mapState: IMapState;
    uiState: IUIState;
    featureInfoResultSets: TypeFeatureInfoResultSets;
    legendResultSets: TypeLegendResultSets;
}
export declare const geoViewStoreDefinition: (set: TypeSetStore, get: TypeGetStore) => IGeoViewState;
export declare const geoViewStoreDefinitionWithSubscribeSelector: import("zustand").StateCreator<IGeoViewState, [], [["zustand/subscribeWithSelector", never]], IGeoViewState>;
declare const fakeStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<IGeoViewState>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: IGeoViewState, previousSelectedState: IGeoViewState) => void): () => void;
        <U>(selector: (state: IGeoViewState) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean | undefined;
        } | undefined): () => void;
    };
}>;
export type GeoViewStoreType = typeof fakeStore;
export {};
