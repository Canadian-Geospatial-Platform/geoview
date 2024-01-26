import { useStore } from 'zustand';
import { useGeoViewStore } from '../stores-managers';
import { TypeGetStore, TypeSetStore } from '../geoview-store';

export type GeoChartStoreByLayerPath = {
  [layerPath: string]: ChartInfo;
};

export type ChartInfo = unknown; // unknown, because the definition is in the external package

// #region INTERFACES

export interface IGeochartState {
  geochartChartsConfig: GeoChartStoreByLayerPath;

  actions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
  };
}

// #endregion INTERFACES

export function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState {
  const init = {
    geochartChartsConfig: {},

    // #region ACTIONS

    actions: {
      setGeochartCharts(charts: GeoChartStoreByLayerPath): void {
        set({
          geochartState: {
            ...get().geochartState,
            geochartChartsConfig: charts,
          },
        });
      },
    },

    // #endregion ACTIONS
  } as IGeochartState;

  return init;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useGeochartConfigs = () => useStore(useGeoViewStore(), (state) => state.geochartState.geochartChartsConfig);
export const useGeochartStoreActions = () => useStore(useGeoViewStore(), (state) => state.geochartState.actions);
