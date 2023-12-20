// src/store/index.ts
import { useContext } from 'react';
import { create, createStore } from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import { destroyEventProcessors } from '@/api/event-processors';
import { initializeEventProcessors } from '@/api/event-processors';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { IGeoviewState, GeoviewStoreType, geoviewStoreDefinitionWithSubscribeSelector } from './geoview-store';
import { MapContext } from '@/core/app-start';

export interface StoresManagerState {
  stores: Record<string, GeoviewStoreType>;
}

export const useStoresManager = createStore<StoresManagerState>(() => ({
  stores: {},
}));

export const addGeoViewStore = (config: TypeMapFeaturesConfig): void => {
  if (!config.mapId) {
    return;
  }
  const geoviewStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
  geoviewStore.getState().setMapConfig(config);

  // intialize event processor to make links between ui/store and back end/api
  initializeEventProcessors(geoviewStore);
  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId ?? 'unknown']: geoviewStore,
    },
  }));

  // TODO Revert back this code and delete line before. Issue #1559
  /*
  if (process.env.NODE_ENV === 'development') {
    mountStoreDevtool(`getViewStore-${config.mapId}`, geoviewStore);
  } */
  mountStoreDevtool(`getViewStore-${config.mapId}`, geoviewStore);
};

export const removeGeoviewStore = (id: string): void => {
  // delete the event processor, unsubscribe and remove the store for the manager
  destroyEventProcessors(getGeoViewStore(id));
  delete useStoresManager.getState().stores[id];
}

export const getGeoViewStore = (id: string | undefined): GeoviewStoreType => {
  return useStoresManager.getState().stores[id ?? 'unknown'];
};

export const useGeoViewStore = (): GeoviewStoreType => {
  const { mapId } = useContext(MapContext);

  return useStoresManager.getState().stores[mapId ?? 'unknown'];
};
