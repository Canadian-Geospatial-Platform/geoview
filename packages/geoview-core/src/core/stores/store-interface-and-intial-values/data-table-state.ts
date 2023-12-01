import { useStore } from 'zustand';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '../stores-managers';

export interface IMapDataTableState {
  columnFiltersRecord: Record<string, MRTColumnFiltersState>;
  filterMapDelay: number;
  isEnlargeDataTable: boolean;
  mapFilteredRecord: Record<string, boolean>;
  rowsFilteredRecord: Record<string, number>;
  rowSelectionsRecord: Record<string, Record<number, boolean>>;
  selectedLayerIndex: number;
  toolbarRowSelectedMessageRecord: Record<string, string>;

  actions: {
    setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => void;
    setIsEnlargeDataTable: (isEnlarge: boolean) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerKey: string) => void;
    setRowsFilteredEntry: (rows: number, layerKey: string) => void;
    setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => void;
    setSelectedLayerIndex: (idx: number) => void;
    setToolbarRowSelectedMessageEntry: (message: string, layerKey: string) => void;
  };
}

export function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IMapDataTableState {
  return {
    columnFiltersRecord: {},
    filterMapDelay: 1000,
    isEnlargeDataTable: false,
    mapFilteredRecord: {},
    rowsFilteredRecord: {},
    rowSelectionsRecord: {},
    selectedLayerIndex: 0,
    toolbarRowSelectedMessageRecord: {},

    // #region ACTIONS
    actions: {
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
      setSelectedLayerIndex: (index: number) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedLayerIndex: index,
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
export const useDataTableStoreSelectedLayerIndex = () => useStore(useGeoViewStore(), (state) => state.dataTableState.selectedLayerIndex);
export const useDataTableStoreIsEnlargeDataTable = () => useStore(useGeoViewStore(), (state) => state.dataTableState.isEnlargeDataTable);
export const useDataTableStoreFilterMapDelay = () => useStore(useGeoViewStore(), (state) => state.dataTableState.filterMapDelay);
export const useDataTableStoreToolbarRowSelectedMessageRecord = () =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.toolbarRowSelectedMessageRecord);
export const useDataTableStoreColumnFiltersRecord = () => useStore(useGeoViewStore(), (state) => state.dataTableState.columnFiltersRecord);
export const useDataTableStoreRowSelectionsRecord = () => useStore(useGeoViewStore(), (state) => state.dataTableState.rowSelectionsRecord);
export const useDataTableStoreMapFilteredRecord = () => useStore(useGeoViewStore(), (state) => state.dataTableState.mapFilteredRecord);
export const useDataTableStoreRowsFiltered = () => useStore(useGeoViewStore(), (state) => state.dataTableState.rowsFilteredRecord);

export const useDataTableStoreActions = () => useStore(useGeoViewStore(), (state) => state.dataTableState.actions);
