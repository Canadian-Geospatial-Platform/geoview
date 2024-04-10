import { useStore } from 'zustand';
import { GeoChartConfig } from '@/core/utils/config/reader/uuid-config-reader';
import { TypeLayerData } from '@/geo/utils/layer-set';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';

export type GeoChartStoreByLayerPath = {
  [layerPath: string]: GeoChartConfig;
};

// #region INTERFACES

export interface IGeochartState {
  geochartChartsConfig: GeoChartStoreByLayerPath;
  layerDataArray: TypeLayerData[];
  layerDataArrayBatch: TypeLayerData[];
  layerDataArrayBatchLayerPathBypass: string;
  selectedLayerPath: string;

  actions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    setLayerDataArray: (layerDataArray: TypeLayerData[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeLayerData[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

// #endregion INTERFACES

/**
 * Initializes a Geochart state object.
 * @param {TypeSetStore} set The store set callback function
 * @param {TypeSetStore} get The store get callback function
 * @returns {IGeochartState} The Geochart state object
 */
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
      setLayerDataArray(layerDataArray: TypeLayerData[]) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArray,
          },
        });
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeLayerData[]) {
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
export const useGeochartLayerDataArray = () => useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArray);
export const useGeochartLayerDataArrayBatch = () => useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArrayBatch);
export const useGeochartSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.geochartState.selectedLayerPath);

export const useGeochartStoreActions = () => useStore(useGeoViewStore(), (state) => state.geochartState.actions);
