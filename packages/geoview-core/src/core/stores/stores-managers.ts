// src/store/index.ts
import { create, createStore } from 'zustand';
import { initializeEventProcessors } from '@/api/eventProcessors';
import { TypeMapFeaturesConfig } from '../types/global-types';
import { IGeoViewState, GeoViewStoreType, geoViewStoreDefinitionWithSubscribeSelector } from './geoview-store';

export interface StoresManagerState {
  stores: Record<string, GeoViewStoreType>;
}

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

export const addGeoViewStore = (config: TypeMapFeaturesConfig) => {
  if (!config.mapId) {
    return;
  }
  // const geoViewStore2 = createStore<IGeoViewState>(geoViewStoreDefinition);
  const geoViewStore = create<IGeoViewState>()(geoViewStoreDefinitionWithSubscribeSelector);
  geoViewStore.getState().setMapConfig(config);
  initializeEventProcessors(geoViewStore);

  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId ?? 'unknown']: geoViewStore,
    },
  }));
};

export const getGeoViewStore = (id: string | undefined) => {
  return useStoresManager.getState().stores[id ?? 'unknown'];
};
