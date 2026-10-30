import { useRef } from 'react';
import type { UseBoundStore, Mutate, StoreApi } from 'zustand';
import { useStore } from 'zustand';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import type { IAppState } from '@/core/stores/states/app-state';
import type { IFeatureInfoState } from '@/core/stores/states/feature-info-state';
import type { ILayerState } from '@/core/stores/states/layer-state';
import type { IMapState } from '@/core/stores/states/map-state';
import type { IDataTableState } from '@/core/stores/states/data-table-state';
import type { ITimeSliderState } from '@/core/stores/states/time-slider-state';
import type { IGeochartState } from '@/core/stores/states/geochart-state';
import type { ISwiperState } from '@/core/stores/states/swiper-state';
import type { IDrawerState } from './states/drawer-state';
import type { IFilterPanelState } from '@/core/stores/states/filter-panel-state';
import type { IUIState } from '@/core/stores/states/ui-state';

import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { shallowObjectEqual } from '@/core/utils/utilities';

// GV Store shouldn't import DomHelper

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
  // TODO: REFACTOR OPTIONAL STATES - Since those states are optional they should be typed with '| undefined' (lots of impacts)
  geochartState: IGeochartState;
  timeSliderState: ITimeSliderState;
  swiperState: ISwiperState;
  drawerState: IDrawerState;
  filterPanelState: IFilterPanelState;
}

// Define a type alias for the subscribeWithSelector middleware tuple to improve readability and facilitate usage below
type SubscribeWithSelectorMiddleware = [['zustand/subscribeWithSelector', never]];

// Define a type for the Geoview Store with the middleware to improve readability and facilitate usage in the code base
export type GeoviewStoreType = UseBoundStore<Mutate<StoreApi<IGeoviewState>, SubscribeWithSelectorMiddleware>>;

// **********************************************************
// GeoView state selectors
// **********************************************************
export const useStoreGeoViewMapId = (): string => useStore(useGeoViewStore(), (state) => state.mapId);
export const useStoreGeoViewConfig = (): TypeMapFeaturesConfig | undefined => useStore(useGeoViewStore(), (state) => state.mapConfig);
export const useStoreGeoViewSharedMode = (): boolean | undefined => useStore(useGeoViewStore(), (state) => state.mapConfig?.sharedMode);

/** To be able to compare objects for hooks */
type EqualityFn<T> = (prev: T, next: T) => boolean;

/**
 * A React hook that wraps a Zustand store selector and preserves the previous reference
 * if the selected value is equal to the previous one, preventing unnecessary re-renders.
 * This is useful when the store returns a new object or array on every update,
 * but you want to avoid infinite render loops or excessive component updates.
 * @template T - The type of the selected state slice.
 * @param store - The Zustand store instance to subscribe to.
 * @param selector - A function that selects a piece of state from the store.
 * @param isEqual - A function that compares the previous and next selector results.
 *                                                    Should return true if they are equal and reference can be reused.
 * @returns The selected state slice. Returns the previous reference if `isEqual(prev, next)` is true.
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
