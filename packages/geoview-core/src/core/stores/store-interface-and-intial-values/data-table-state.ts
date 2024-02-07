import { useStore } from 'zustand';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '../stores-managers';
import { TypeArrayOfLayerData } from '@/app';
import { DataTableProcessor } from '@/api/event-processors/event-processor-children/data-table-processor';

interface IMapDataTableStateActions {
  setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerPath: string) => void;
  setIsEnlargeDataTable: (isEnlarge: boolean) => void;
  setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
  setRowsFilteredEntry: (rows: number, layerPath: string) => void;
  setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerPath: string) => void;
  setSelectedLayerPath: (layerPath: string) => void;
  setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
  setLayersData: (layers: TypeArrayOfLayerData) => void;
  applyMapFilters: (filterStrings: string) => void;
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
      setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            mapFilteredRecord: { ...get().dataTableState.mapFilteredRecord, [layerPath]: mapFiltered },
          },
        });
        // TODO: Apply the filter to the layer in map event processor
      },
      setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            columnFiltersRecord: { ...get().dataTableState.columnFiltersRecord, [layerPath]: filtered },
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
      setRowsFilteredEntry: (rows: number, layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowsFilteredRecord: { ...get().dataTableState.rowsFilteredRecord, [layerPath]: rows },
          },
        });
      },
      setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            rowSelectionsRecord: { ...get().dataTableState.rowSelectionsRecord, [layerPath]: rowSelection },
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
      setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            toolbarRowSelectedMessageRecord: { ...get().dataTableState.toolbarRowSelectedMessageRecord, [layerPath]: message },
          },
        });
      },
      applyMapFilters: (filterStrings: string): void => {
        const layerPath = get().dataTableState.selectedLayerPath;
        DataTableProcessor.applyFilters(get().mapId, layerPath, filterStrings, !!get().dataTableState.mapFilteredRecord[layerPath]);
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
