import { create, useStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import cloneDeep from 'lodash/cloneDeep';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { IAppState, initializeAppState } from './store-interface-and-intial-values/app-state';
import { IDetailsState, initialDetailsState } from './store-interface-and-intial-values/details-state';
import { ILayerState, initializeLayerState } from './store-interface-and-intial-values/layer-state';
import { IMapState, initializeMapState } from './store-interface-and-intial-values/map-state';
import { IMapDataTableState, initialDataTableState } from './store-interface-and-intial-values/data-table-state';
import { ITimeSliderState, initializeTimeSliderState } from './store-interface-and-intial-values/time-slider-state';
import { IUIState, initializeUIState } from './store-interface-and-intial-values/ui-state';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';

export type TypeSetStore = (
  partial: IGeoviewState | Partial<IGeoviewState> | ((state: IGeoviewState) => IGeoviewState | Partial<IGeoviewState>),
  replace?: boolean | undefined
) => void;
export type TypeGetStore = () => IGeoviewState;

export interface IGeoviewState {
  mapConfig: TypeMapFeaturesConfig | undefined;
  mapId: string;
  setMapConfig: (config: TypeMapFeaturesConfig) => void;

  // state interfaces
  appState: IAppState;
  detailsState: IDetailsState;
  dataTableState: IMapDataTableState;
  layerState: ILayerState;
  mapState: IMapState;
  timeSliderState: ITimeSliderState;
  uiState: IUIState;
}

export const geoviewStoreDefinition = (set: TypeSetStore, get: TypeGetStore) =>
  ({
    mapConfig: undefined,
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      set({ mapConfig: cloneDeep(config), mapId: config.mapId });

      // initialize default stores section from config information
      get().appState.setDefaultConfigValues(config);
      get().mapState.setDefaultConfigValues(config);
      get().uiState.setDefaultConfigValues(config);

      // packages states, only create if needed
      if (config.corePackages?.includes('time-slider')) set({ timeSliderState: initializeTimeSliderState(set, get) })
    },

    // core states
    appState: initializeAppState(set, get),
    detailsState: initialDetailsState(set, get),
    dataTableState: initialDataTableState(set, get),
    layerState: initializeLayerState(set, get),
    mapState: initializeMapState(set, get),
    uiState: initializeUIState(set, get),
  } as IGeoviewState);

export const geoviewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoviewStoreDefinition);

const fakeStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
export type GeoviewStoreType = typeof fakeStore;

// **********************************************************
// GeoView state selectors
// **********************************************************
export const useGeoViewMapId = () => useStore(useGeoViewStore(), (state) => state.mapId);
export const useGeoViewConfig = () => useStore(useGeoViewStore(), (state) => state.mapConfig);
