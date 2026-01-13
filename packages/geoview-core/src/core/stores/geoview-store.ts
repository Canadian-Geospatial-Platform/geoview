import { useRef } from 'react';
import type { UseBoundStore, Mutate, StoreApi } from 'zustand';
import { useStore } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import type { IAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import { initializeAppState } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { IFeatureInfoState } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { initFeatureInfoState } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import type { ILayerState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { initializeLayerState } from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { IMapState } from '@/core/stores/store-interface-and-intial-values/map-state';
import { initializeMapState } from '@/core/stores/store-interface-and-intial-values/map-state';
import type { IDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { initialDataTableState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { ITimeSliderState } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { initializeTimeSliderState } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { IGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { initializeGeochartState } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import type { ISwiperState } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import { initializeSwiperState } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import type { IDrawerState } from './store-interface-and-intial-values/drawer-state';
import { initializeDrawerState } from './store-interface-and-intial-values/drawer-state';
import type { IUIState } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { initializeUIState } from '@/core/stores/store-interface-and-intial-values/ui-state';

import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { shallowObjectEqual } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { serializeTypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';

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

/** To be able to compare objects for hooks */
type EqualityFn<T> = (prev: T, next: T) => boolean;

/**
 * A React hook that wraps a Zustand store selector and preserves the previous reference
 * if the selected value is equal to the previous one, preventing unnecessary re-renders.
 * This is useful when the store returns a new object or array on every update,
 * but you want to avoid infinite render loops or excessive component updates.
 * @template T - The type of the selected state slice.
 * @param {GeoviewStoreType} store - The Zustand store instance to subscribe to.
 * @param {(state: IGeoviewState) => T} selector - A function that selects a piece of state from the store.
 * @param {(prev: T, next: T) => boolean} [isEqual] - A function that compares the previous and next selector results.
 *                                                    Should return true if they are equal and reference can be reused.
 * @returns {T} The selected state slice. Returns the previous reference if `isEqual(prev, next)` is true.
 * @example
 * const queryableLayers = useStableSelector(
 *   store,
 *   (state) => state.layers.reduce((acc, layer) => ({ ...acc, [layer.id]: layer.queryable }), {}),
 *   shallowObjectEqual
 * );
 */
export function useStableSelector<T>(
  store: GeoviewStoreType,
  selector: (state: IGeoviewState) => T,
  isEqual: EqualityFn<T> = shallowObjectEqual
): T {
  const previousRef = useRef<T | null>(null);

  // Hook
  return useStore(store, (state) => {
    const next = selector(state);

    if (previousRef.current !== null && isEqual(previousRef.current, next)) {
      return previousRef.current;
    }

    previousRef.current = next;
    return next;
  });
}
