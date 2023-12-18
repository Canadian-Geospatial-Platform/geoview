import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { GeoviewStoreType } from './geoview-store';
export interface StoresManagerState {
    stores: Record<string, GeoviewStoreType>;
}
export declare const useStoresManager: import("zustand").StoreApi<StoresManagerState>;
export declare const addGeoViewStore: (config: TypeMapFeaturesConfig) => void;
export declare const getGeoViewStore: (id: string | undefined) => GeoviewStoreType;
export declare const useGeoViewStore: () => GeoviewStoreType;
