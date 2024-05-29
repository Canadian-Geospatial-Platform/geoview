import { useStore } from 'zustand';
import { GeoChartConfig } from '@/core/utils/config/reader/uuid-config-reader';
import { TypeLayerData, TypeResultSet, TypeResultSetEntry } from '@/geo/map/map-schema-types';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with GeochartEventProcessor vs GeochartState

// #region INTERFACES & TYPES

type GeochartActions = IGeochartState['actions'];

export type TypeGeochartResultSetEntry = TypeResultSetEntry & TypeLayerData;

export type TypeGeochartResultSet = TypeResultSet<TypeGeochartResultSetEntry>;

export type GeoChartStoreByLayerPath = {
  [layerPath: string]: GeoChartConfig;
};

export interface IGeochartState {
  geochartChartsConfig: GeoChartStoreByLayerPath;
  layerDataArray: TypeGeochartResultSetEntry[];
  layerDataArrayBatch: TypeGeochartResultSetEntry[];
  layerDataArrayBatchLayerPathBypass: string;
  selectedLayerPath: string;

  actions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    setLayerDataArray: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };

  setterActions: {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    setLayerDataArray: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes a Geochart state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {IGeochartState} - The Geochart state object
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
        // Redirect to setter
        get().geochartState.setterActions.setGeochartCharts(charts);
      },
      setLayerDataArray(layerDataArray: TypeGeochartResultSetEntry[]) {
        // Redirect to setter
        get().geochartState.setterActions.setLayerDataArray(layerDataArray);
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeGeochartResultSetEntry[]) {
        // Redirect to setter
        get().geochartState.setterActions.setLayerDataArrayBatch(layerDataArrayBatch);
      },
      setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass: string): void {
        // Redirect to setter
        get().geochartState.setterActions.setLayerDataArrayBatchLayerPathBypass(layerDataArrayBatchLayerPathBypass);
      },
      setSelectedLayerPath(selectedLayerPath: string): void {
        // Redirect to setter
        get().geochartState.setterActions.setSelectedLayerPath(selectedLayerPath);
      },
    },

    setterActions: {
      setGeochartCharts(charts: GeoChartStoreByLayerPath): void {
        set({
          geochartState: {
            ...get().geochartState,
            geochartChartsConfig: charts,
          },
        });
      },
      setLayerDataArray(layerDataArray: TypeGeochartResultSetEntry[]) {
        set({
          geochartState: {
            ...get().geochartState,
            layerDataArray,
          },
        });
      },
      setLayerDataArrayBatch(layerDataArrayBatch: TypeGeochartResultSetEntry[]) {
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
export const useGeochartConfigs = (): GeoChartStoreByLayerPath =>
  useStore(useGeoViewStore(), (state) => state.geochartState.geochartChartsConfig);
export const useGeochartLayerDataArray = (): TypeLayerData[] => useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArray);
export const useGeochartLayerDataArrayBatch = (): TypeLayerData[] =>
  useStore(useGeoViewStore(), (state) => state.geochartState.layerDataArrayBatch);
export const useGeochartSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.geochartState.selectedLayerPath);

export const useGeochartStoreActions = (): GeochartActions => useStore(useGeoViewStore(), (state) => state.geochartState.actions);
