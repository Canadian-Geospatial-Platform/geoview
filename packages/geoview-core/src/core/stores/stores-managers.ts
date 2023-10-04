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
  const geoViewStore = create<IGeoViewState>()(geoViewStoreDefinitionWithSubscribeSelector);
  geoViewStore.getState().setMapConfig(config);

  // initialize static initial value from config before the event processor (config has been validated already)
  geoViewStore.setState({
    mapState: {
      ...geoViewStore.getState().mapState,
      currentProjection: config.map.viewSettings.projection,
      interaction: config.map.interaction,
      northArrow: config.components!.indexOf('north-arrow') > -1,
      overviewMapHideZoom: config.overviewMap !== undefined ? config.overviewMap.hideOnZoom : 0,
    },
  });

  initializeEventProcessors(geoViewStore);

  console.log('store creation');
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
