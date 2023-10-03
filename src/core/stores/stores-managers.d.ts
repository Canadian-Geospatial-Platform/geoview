import { TypeMapFeaturesConfig } from '../types/global-types';
import { IGeoViewState, GeoViewStoreType } from './geoview-store';
export interface StoresManagerState {
    stores: Record<string, GeoViewStoreType>;
}
export declare const useStoresManager: import("zustand").StoreApi<StoresManagerState>;
export declare const addGeoViewStore: (config: TypeMapFeaturesConfig) => void;
export declare const getGeoViewStore: (id: string | undefined) => import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<IGeoViewState>, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: IGeoViewState, previousSelectedState: IGeoViewState) => void): () => void;
        <U>(selector: (state: IGeoViewState) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean | undefined;
        } | undefined): () => void;
    };
}>;
