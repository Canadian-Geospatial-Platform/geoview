import { useStore } from 'zustand';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '../stores-managers';
import { TypeArrayOfLayerData } from '@/app';

interface IMapDataTableStateActions {
  setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => void;
  setIsEnlargeDataTable: (isEnlarge: boolean) => void;
  setMapFilteredEntry: (mapFiltered: boolean, layerKey: string) => void;
  setRowsFilteredEntry: (rows: number, layerKey: string) => void;
  setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => void;
  setSelectedLayerPath: (layerPath: string) => void;
  setToolbarRowSelectedMessageEntry: (message: string, layerKey: string) => void;
  setLayersData: (layers: TypeArrayOfLayerData) => void;
}
export interface IMapDataTableState {
  columnFiltersRecord: Record<string, MRTColumnFiltersState>;
  isEnlargeDataTable: boolean;
  mapFilteredRecord: Record<string, boolean>;
  rowsFilteredRecord: Record<string, number>;
  rowSelectionsRecord: Record<string, Record<number, boolean>>;
  selectedLayerPath: string;
  toolbarRowSelectedMessageRecord: Record<string, string>;
  layersData: TypeArrayOfLayerData;
  actions: IMapDataTableStateActions;
}

export function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IMapDataTableState {
  return {
    columnFiltersRecord: {},
    isEnlargeDataTable: false,
    mapFilteredRecord: {},
    rowsFilteredRecord: {},
    rowSelectionsRecord: {},
    selectedLayerPath: '',
    toolbarRowSelectedMessageRecord: {},
    layersData: [],

    // #region ACTIONS
    actions: {
      setLayersData: (layersData: TypeArrayOfLayerData) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            layersData,
          },
        });
      },
      setMapFilteredEntry: (mapFiltered: boolean, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            mapFilteredRecord: { ...get().dataTableState.mapFilteredRecord, [layerKey]: mapFiltered },
          },
        });
        // TODO: Apply the filter to the layer in map event processor
      },
      setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            columnFiltersRecord: { ...get().dataTableState.columnFiltersRecord, [layerKey]: filtered },
          },
        });
      },
      setIsEnlargeDataTable: (isEnlarge: boolean) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            isEnlargeDataTable: isEnlarge,
          },
        });
      },
      setRowsFilteredEntry: (rows: number, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowsFilteredRecord: { ...get().dataTableState.rowsFilteredRecord, [layerKey]: rows },
          },
        });
      },
      setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowSelectionsRecord: { ...get().dataTableState.rowSelectionsRecord, [layerKey]: rowSelection },
          },
        });
      },
      setSelectedLayerPath: (layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedLayerPath: layerPath,
          },
        });
      },
      setToolbarRowSelectedMessageEntry: (message: string, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            toolbarRowSelectedMessageRecord: { ...get().dataTableState.toolbarRowSelectedMessageRecord, [layerKey]: message },
          },
        });
      },
    },
    // #endregion ACTIONS
  } as IMapDataTableState;
}

// **********************************************************
// Data-table state selectors
// **********************************************************
export const useDataTableStoreSelectedLayerPath = (): string =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.selectedLayerPath);
export const useDataTableStoreIsEnlargeDataTable = (): boolean =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.isEnlargeDataTable);
export const useDataTableStoreToolbarRowSelectedMessageRecord = (): Record<string, string> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.toolbarRowSelectedMessageRecord);
export const useDataTableStoreColumnFilteredRecord = (): Record<string, MRTColumnFiltersState> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.columnFiltersRecord);
export const useDataTableStoreRowSelectionsRecord = (): Record<string, Record<number, boolean>> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.rowSelectionsRecord);
export const useDataTableStoreMapFilteredRecord = (): Record<string, boolean> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.mapFilteredRecord);
export const useDataTableStoreRowsFiltered = (): Record<string, number> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.rowsFilteredRecord);
export const useDatatableStoreLayersData = (): TypeArrayOfLayerData =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.layersData);

export const useDataTableStoreActions = (): IMapDataTableStateActions =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.actions);
