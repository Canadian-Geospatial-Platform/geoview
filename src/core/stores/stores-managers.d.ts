import { GeoviewStoreType } from './geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
export interface StoresManagerState {
    stores: Record<string, GeoviewStoreType>;
}
export declare const useStoresManager: import("zustand").StoreApi<StoresManagerState>;
export declare const addGeoViewStore: (config: TypeMapFeaturesConfig) => void;
export declare const getGeoViewStore: (id: string) => GeoviewStoreType;
export declare const getGeoViewStoreAsync: (id: string) => Promise<GeoviewStoreType>;
export declare const removeGeoviewStore: (id: string) => void;
export declare const useGeoViewStore: () => GeoviewStoreType;
//# sourceMappingURL=stores-managers.d.ts.map