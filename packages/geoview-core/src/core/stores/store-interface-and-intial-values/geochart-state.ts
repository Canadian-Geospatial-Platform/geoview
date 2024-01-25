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
  // geochartLayers: TypeJsonObject[];
  // visibleGeochartLayers: string[];

  actions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    // setGeochartLayers: (layers: TypeJsonObject) => void;
  };
}
// #endregion INTERFACES

export function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState {
  const init = {
    geochartChartsConfig: {},
    // geochartLayers: {},
    // geochartChartsConfig: [],
    // visibleGeochartLayers: [],

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
      // #endregion ACTIONS
    },
  } as IGeochartState;

  return init;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useGeochartConfigs = () => useStore(useGeoViewStore(), (state) => state.geochartState.geochartChartsConfig);
// export const useGeochartLayers = () => useStore(useGeoViewStore(), (state) => state.geochartState.geochartLayers);
// export const useVisibleGeochartLayers = () => useStore(useGeoViewStore(), (state) => state.geochartState.visibleGeochartLayers);

export const useGeochartStoreActions = () => useStore(useGeoViewStore(), (state) => state.geochartState.actions);
