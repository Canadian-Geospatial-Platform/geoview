// src/store/index.ts
import { useContext } from 'react';
import { create, createStore } from 'zustand';
import { mountStoreDevtool } from 'simple-zustand-devtools';

import { initializeEventProcessors } from '@/api/event-processors';
import { TypeMapFeaturesConfig } from '../types/global-types';
import { IGeoViewState, GeoViewStoreType, geoViewStoreDefinitionWithSubscribeSelector } from './geoview-store';
import { MapContext } from '@/core/app-start';

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
      overviewMap: config.components!.indexOf('overview-map') > -1,
      overviewMapHideZoom: config.overviewMap !== undefined ? config.overviewMap.hideOnZoom : 0,
    },
  });
  initializeEventProcessors(geoViewStore);
  useStoresManager.setState((state) => ({
    stores: {
      ...state.stores,
      [config.mapId ?? 'unknown']: geoViewStore,
    },
  }));

  // TODO Revert back this code and delete line before. Issue #1559
  /*
  if (process.env.NODE_ENV === 'development') {
    mountStoreDevtool(`getViewStore-${config.mapId}`, geoViewStore);
  } */
  mountStoreDevtool(`getViewStore-${config.mapId}`, geoViewStore);
};
export const getGeoViewStore = (id: string | undefined) => {
  return useStoresManager.getState().stores[id ?? 'unknown'];
};

export const useGeoViewStore = () => {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  return useStoresManager.getState().stores[mapId ?? 'unknown'];
};
