import { subscribeWithSelector } from 'zustand/middleware';

import type { IGeoviewState, TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { initializeAppState } from '@/core/stores/states/app-state';
import { initFeatureInfoState } from '@/core/stores/states/feature-info-state';
import { initializeLayerState } from '@/core/stores/states/layer-state';
import { initializeMapState } from '@/core/stores/states/map-state';
import { initialDataTableState } from '@/core/stores/states/data-table-state';
import { initializeTimeSliderState } from '@/core/stores/states/time-slider-state';
import { initializeGeochartState } from '@/core/stores/states/geochart-state';
import { initializeSwiperState } from '@/core/stores/states/swiper-state';
import { initializeDrawerState } from '@/core/stores/states/drawer-state';
import { initializeFilterPanelState } from '@/core/stores/states/filter-panel-state';
import { initializeUIState } from '@/core/stores/states/ui-state';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';
import { serializeTypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';

// GV Kept apart from geoview-store.ts, which the state slices import: the definition imports every slice initializer

export const geoviewStoreDefinition = (set: TypeSetStore, get: TypeGetStore): IGeoviewState => {
  // Log
  logger.logTraceCore('Initializing store core states...');

  // Return the initialized store definition
  return {
    mapConfig: undefined,
    setMapConfig: (config: TypeMapFeaturesConfig) => {
      // GV this is a copy of the original map configuration, no modifications is allowed
      // ? this configuration is used to reload the map
      const clonedConfig = structuredClone(config);

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
      get().detailsState.setDefaultConfigValues(config);
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
      if (config.appBar?.tabs?.core?.includes('filter-panel')) {
        set({ filterPanelState: initializeFilterPanelState(set, get) });
        get().filterPanelState.setDefaultConfigValues(config);
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
