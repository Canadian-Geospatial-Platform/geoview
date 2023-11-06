import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TypeArrayOfLayerData } from '@/core/components/details/details';
import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
import { ILayerState } from './store-interface-and-intial-values/layer-state';
import { IMapState } from './store-interface-and-intial-values/map-state';
import { IUIState } from './store-interface-and-intial-values/ui-state';
import { IAppState } from './store-interface-and-intial-values/app-state';
export type TypeSetStore = (partial: IGeoViewState | Partial<IGeoViewState> | ((state: IGeoViewState) => IGeoViewState | Partial<IGeoViewState>), replace?: boolean | undefined) => void;
export type TypeGetStore = () => IGeoViewState;
export interface IMapDataTableState {
    selectedLayerIndex: number;
    isEnlargeDataTable: boolean;
    FILTER_MAP_DELAY: number;
    toolbarRowSelectedMessage: Record<string, string>;
    columnFiltersMap: Record<string, MRTColumnFiltersState>;
    rowSelectionsMap: Record<string, Record<number, boolean>>;
    mapFilteredMap: Record<string, boolean>;
    rowsFilteredMap: Record<string, number>;
    setRowsFilteredMap: (rows: number, layerKey: string) => void;
    setMapFilteredMap: (mapFiltered: boolean, layerKey: string) => void;
    setRowSelectionsMap: (rowSelection: Record<number, boolean>, layerKey: string) => void;
    setColumnFiltersMap: (filtered: MRTColumnFiltersState, layerKey: string) => void;
    setIsEnlargeDataTable: (isEnlarge: boolean) => void;
    setSelectedLayerIndex: (idx: number) => void;
    setToolbarRowSelectedMessage: (message: string, layerKey: string) => void;
}
export interface IDetailsState {
    layerDataArray: TypeArrayOfLayerData;
    selectedLayerPath: string;
}
export interface IGeoViewState {
    displayLanguage: TypeDisplayLanguage;
    mapId: string;
    mapConfig: TypeMapFeaturesConfig | undefined;
    setMapConfig: (config: TypeMapFeaturesConfig) => void;
    appState: IAppState;
    legendState: ILayerState;
    mapState: IMapState;
    uiState: IUIState;
    detailsState: IDetailsState;
    dataTableState: IMapDataTableState;
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
