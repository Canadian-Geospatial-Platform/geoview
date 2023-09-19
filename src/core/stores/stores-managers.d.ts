import { TypeMapFeaturesConfig } from '../types/global-types';
import { GeoViewStoreType } from './geoview-store';
export interface StoresManagerState {
    stores: Record<string, GeoViewStoreType>;
}
export declare const useStoresManager: import("zustand").StoreApi<StoresManagerState>;
export declare const addGeoViewStore: (config: TypeMapFeaturesConfig) => void;
export declare const getGeoViewStore: (id: string | undefined) => GeoViewStoreType;
