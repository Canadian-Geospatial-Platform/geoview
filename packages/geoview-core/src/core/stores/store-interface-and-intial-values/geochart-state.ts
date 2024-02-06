import { useStore } from 'zustand';
import { useGeoViewStore } from '../stores-managers';
import { TypeGetStore, TypeSetStore } from '../geoview-store';
import { TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';

export type GeoChartStoreByLayerPath = {
  [layerPath: string]: ChartInfo;
};

export type ChartInfo = unknown; // unknown, because the definition is in the external package

// #region INTERFACES

export interface IGeochartState {
  geochartChartsConfig: GeoChartStoreByLayerPath;
  layerDataArray: TypeArrayOfLayerData;
  layerDataArrayBatch: TypeArrayOfLayerData;
  layerDataArrayBatchLayerPathBypass: string;
  selectedLayerPath: string;

  actions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeArrayOfLayerData) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

// #endregion INTERFACES

export function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState {
  const init = {
    geochartChartsConfig: {},
    layerDataArray: [],
    layerDataArrayBatch: [],
    layerDataArrayBatchLayerPathBypass: '',
    selectedLayerPath: '',

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
      setLayerDataArray(layerDataArray: TypeArrayOfLayerData) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArray,
          },
        });
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeArrayOfLayerData) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArrayBatch,
          },
        });
      },
      setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass: string) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArrayBatchLayerPathBypass,
          },
        });
      },
      setSelectedLayerPath(selectedLayerPath: string) {
        set({
          geochartState: {
            ...get().geochartState,
            selectedLayerPath,
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
export const useGeochartStoreLayerDataArray = () => useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArray);
export const useGeochartStoreLayerDataArrayBatch = () => useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArrayBatch);
export const useGeochartStoreSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.geochartState.selectedLayerPath);

export const useGeochartStoreActions = () => useStore(useGeoViewStore(), (state) => state.geochartState.actions);
