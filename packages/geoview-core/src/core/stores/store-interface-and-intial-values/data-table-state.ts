import { useStore } from 'zustand';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '../stores-managers';

export interface IMapDataTableState {
  selectedLayerIndex: number;
  isEnlargeDataTable: boolean;
  filterMapDelay: number;
  toolbarRowSelectedMessageRecord: Record<string, string>;
  columnFiltersRecord: Record<string, MRTColumnFiltersState>;
  rowSelectionsRecord: Record<string, Record<number, boolean>>;
  mapFilteredRecord: Record<string, boolean>;
  rowsFilteredRecord: Record<string, number>;
  actions: {
    setRowsFilteredEntry: (rows: number, layerKey: string) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerKey: string) => void;
    setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => void;
    setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => void;
    setIsEnlargeDataTable: (isEnlarge: boolean) => void;
    setSelectedLayerIndex: (idx: number) => void;
    setToolbarRowSelectedMessageEntry: (message: string, layerKey: string) => void;
  };
}

export function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IMapDataTableState {
  return {
    selectedLayerIndex: 0,
    isEnlargeDataTable: false,
    filterMapDelay: 1000,
    toolbarRowSelectedMessageRecord: {},
    rowSelectionsRecord: {},
    mapFilteredRecord: {},
    columnFiltersRecord: {},
    rowsFilteredRecord: {},
    actions: {
      setRowsFilteredEntry: (rows: number, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowsFilteredRecord: { ...get().dataTableState.rowsFilteredRecord, [layerKey]: rows },
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
        // TODO: Apply the filter to the layer
      },
      setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowSelectionsRecord: { ...get().dataTableState.rowSelectionsRecord, [layerKey]: rowSelection },
          },
        });
      },
      setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            columnFiltersRecord: { ...get().dataTableState.columnFiltersRecord, [layerKey]: filtered },
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
      setIsEnlargeDataTable: (isEnlarge: boolean) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            isEnlargeDataTable: isEnlarge,
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
    },
  } as IMapDataTableState;
}

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
