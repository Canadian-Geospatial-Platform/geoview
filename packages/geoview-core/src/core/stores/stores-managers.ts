// src/store/index.ts
import { createStore } from 'zustand';
import { initializeEventProcessors } from '@/api/eventProcessors';
import { TypeMapFeaturesConfig } from '../types/global-types';
import { GeoViewState, geoViewStoreDefinition, GeoViewStoreType } from './geoview-store';

interface StoresManagerState {
  stores: Record<string, GeoViewStoreType>;
}

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

export const addGeoViewStore = (config: TypeMapFeaturesConfig) => {
  if (!config.mapId) {
    return;
  }
  const geoViewStore = createStore<GeoViewState>(geoViewStoreDefinition);
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
