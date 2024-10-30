import { create, useStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import cloneDeep from 'lodash/cloneDeep';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { IAppState, initializeAppState } from './store-interface-and-intial-values/app-state';
import { IFeatureInfoState, initFeatureInfoState } from './store-interface-and-intial-values/feature-info-state';
import { ILayerState, initializeLayerState } from './store-interface-and-intial-values/layer-state';
import { IMapState, initializeMapState } from './store-interface-and-intial-values/map-state';
import { IDataTableState, initialDataTableState } from './store-interface-and-intial-values/data-table-state';
import { ITimeSliderState, initializeTimeSliderState } from './store-interface-and-intial-values/time-slider-state';
import { IGeochartState, initializeGeochartState } from './store-interface-and-intial-values/geochart-state';
import { ISwiperState, initializeSwiperState } from './store-interface-and-intial-values/swiper-state';
import { IUIState, initializeUIState } from './store-interface-and-intial-values/ui-state';

import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { serializeTypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';

export type TypeSetStore = (
  partial: IGeoviewState | Partial<IGeoviewState> | ((state: IGeoviewState) => IGeoviewState | Partial<IGeoviewState>),
  replace?: boolean | undefined,
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
}

export const geoviewStoreDefinition = (set: TypeSetStore, get: TypeGetStore): IGeoviewState => {
  // Log
  logger.logTraceCore('Initializing store core states...');

  // Return the initialized store definition
  return {
    mapConfig: undefined,
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      // Log (leaving the logDebug for now until more tests are done with the config 2024-02-28)
      logger.logDebug('Sending the map config to the store...', config.mapId);

      // GV this is a copy of the original map configuration, no modifications is allowed
      // ? this configuration is use to reload the map
      const clonedConfig = cloneDeep(config);

      // Serialize the configuration so that it goes in the store without any mutable class instances
      // TODO: Refactor - Remove class instances for configuration level objects.
      // TO.DOCONT: Indeed, using classes such as `OLLayer` in a low-level configuration class makes the configuration class hard to scale and port.
      // TO.DOCONT: Configurations should be as losely coupled as possible.
      for (let i = 0; i < (clonedConfig.map?.listOfGeoviewLayerConfig?.length || 0); i++) {
        // Serialize the GeoviewLayerConfig
        const serialized = serializeTypeGeoviewLayerConfig(clonedConfig.map!.listOfGeoviewLayerConfig![i]);

        // Reassign
        clonedConfig.map.listOfGeoviewLayerConfig![i] = serialized as never;
      }

      set({ mapConfig: clonedConfig, mapId: config.mapId });

      // initialize default stores section from config information
      get().appState.setDefaultConfigValues(config);
      get().mapState.setDefaultConfigValues(config);
      get().uiState.setDefaultConfigValues(config);

      // packages states, only create if needed
      // TODO: Change this check for something more generic that checks in appBar too
      if (config.footerBar?.tabs.core.includes('time-slider')) set({ timeSliderState: initializeTimeSliderState(set, get) });
      if (config.footerBar?.tabs.core.includes('geochart')) set({ geochartState: initializeGeochartState(set, get) });
      if (config.corePackages?.includes('swiper')) set({ swiperState: initializeSwiperState(set, get) });
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

export const geoviewStoreDefinitionWithSubscribeSelector = subscribeWithSelector(geoviewStoreDefinition);

// TODO: Refactor - Indicate why we need to use a fake store?
const fakeStore = create<IGeoviewState>()(geoviewStoreDefinitionWithSubscribeSelector);
export type GeoviewStoreType = typeof fakeStore;

// **********************************************************
// GeoView state selectors
// **********************************************************
export const useGeoViewMapId = (): string => useStore(useGeoViewStore(), (state) => state.mapId);
export const useGeoViewConfig = (): TypeMapFeaturesConfig | undefined => useStore(useGeoViewStore(), (state) => state.mapConfig);
