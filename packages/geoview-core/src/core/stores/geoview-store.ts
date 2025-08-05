import { useStore, UseBoundStore, Mutate, StoreApi } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import cloneDeep from 'lodash/cloneDeep';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { IAppState, initializeAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import { IFeatureInfoState, initFeatureInfoState } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { ILayerState, initializeLayerState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { IMapState, initializeMapState } from '@/core/stores/store-interface-and-intial-values/map-state';
import { IDataTableState, initialDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { ITimeSliderState, initializeTimeSliderState } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { IGeochartState, initializeGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { ISwiperState, initializeSwiperState } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import { IDrawerState, initializeDrawerState } from './store-interface-and-intial-values/drawer-state';
import { IUIState, initializeUIState } from '@/core/stores/store-interface-and-intial-values/ui-state';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { serializeTypeGeoviewLayerConfig } from '@/api/config/types/map-schema-types';

export type TypeSetStore = (
  partial: IGeoviewState | Partial<IGeoviewState> | ((state: IGeoviewState) => IGeoviewState | Partial<IGeoviewState>),
  replace?: false | undefined
) => void;
export type TypeGetStore = () => IGeoviewState;

export interface IGeoviewState {
  mapConfig: TypeMapFeaturesConfig | undefined;
  mapId: string;
  setMapConfig: (config: TypeMapFeaturesConfig) => void;

  // core state interfaces
  appState: IAppState;
  detailsState: IFeatureInfoState;
  dataTableState: IDataTableState;
  layerState: ILayerState;
  mapState: IMapState;
  uiState: IUIState;

  // packages state interface
  geochartState: IGeochartState;
  timeSliderState: ITimeSliderState;
  swiperState: ISwiperState;
  drawerState: IDrawerState;
}

export const geoviewStoreDefinition = (set: TypeSetStore, get: TypeGetStore): IGeoviewState => {
  // Log
  logger.logTraceCore('Initializing store core states...');

  // Return the initialized store definition
  return {
    mapConfig: undefined,
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      // GV this is a copy of the original map configuration, no modifications is allowed
      // ? this configuration is used to reload the map
      const clonedConfig = cloneDeep(config);

      // Serialize the configuration so that it goes in the store without any mutable class instances
      for (let i = 0; i < (config.map?.listOfGeoviewLayerConfig?.length || 0); i++) {
        // Serialize the GeoviewLayerConfig
        const serialized = serializeTypeGeoviewLayerConfig(config.map.listOfGeoviewLayerConfig[i]);

        // Reassign
        clonedConfig.map.listOfGeoviewLayerConfig[i] = serialized;
      }

      set({ mapConfig: clonedConfig, mapId: config.mapId });

      // initialize default stores section from config information
      get().appState.setDefaultConfigValues(config);
      get().mapState.setDefaultConfigValues(config);
      get().uiState.setDefaultConfigValues(config);
      get().layerState.setDefaultConfigValues(config);
      get().dataTableState.setDefaultConfigValues(config);

      // packages states, only create if needed
      // TODO: Change this check for something more generic that checks in appBar too
      if (config.footerBar?.tabs.core.includes('time-slider')) {
        set({ timeSliderState: initializeTimeSliderState(set, get) });
        get().timeSliderState.setDefaultConfigValues(config);
      }
      if (config.footerBar?.tabs.core.includes('geochart')) set({ geochartState: initializeGeochartState(set, get) });

      if (config.corePackages?.includes('swiper')) set({ swiperState: initializeSwiperState(set, get) });
      if (config.navBar?.includes('drawer')) {
        set({ drawerState: initializeDrawerState(set, get) });
        get().drawerState.setDefaultConfigValues(config);
      }
    },

    // core states
    appState: initializeAppState(set, get),
    detailsState: initFeatureInfoState(set, get),
    dataTableState: initialDataTableState(set, get),
    layerState: initializeLayerState(set, get),
    mapState: initializeMapState(set, get),
    uiState: initializeUIState(set, get),
  } as IGeoviewState;
};

// Wrap the store definition with the subscribveWithSelector middleware
export const geoviewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoviewStoreDefinition);

// Define a type alias for the subscribeWithSelector middleware tuple to improve readability and facilitate usage below
type SubscribeWithSelectorMiddleware = [['zustand/subscribeWithSelector', never]];

// Define a type for the Geoview Store with the middleware to improve readability and facilitate usage in the code base
export type GeoviewStoreType = UseBoundStore<Mutate<StoreApi<IGeoviewState>, SubscribeWithSelectorMiddleware>>;

// **********************************************************
// GeoView state selectors
// **********************************************************
export const useGeoViewMapId = (): string => useStore(useGeoViewStore(), (state) => state.mapId);
export const useGeoViewConfig = (): TypeMapFeaturesConfig | undefined => useStore(useGeoViewStore(), (state) => state.mapConfig);
