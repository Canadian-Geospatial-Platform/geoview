import { useStore } from 'zustand';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeLayerData } from '@/geo/utils/layer-set';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';

// Import { MRTColumnFiltersState } from 'material-react-table' fails - This is likely not portable. a type annotation is necessary
// Create a type to mimic
export type TypeColumnFiltersState = ColumnFilter[];
export interface ColumnFilter {
  id: string;
  value: unknown;
}

interface IDataTableSettings {
  columnFiltersRecord: TypeColumnFiltersState;
  mapFilteredRecord: boolean;
  rowsFilteredRecord: number;
  toolbarRowSelectedMessageRecord: string;
}

export interface IDataTableState {
  allFeaturesDataArray: TypeLayerData[];
  isEnlargeDataTable: boolean;
  activeLayerData: TypeLayerData[];
  layersDataTableSetting: Record<string, IDataTableSettings>;
  selectedLayerPath: string;
  tableHeight: number;

  actions: {
    applyMapFilters: (filterStrings: string) => void;
    setActiveLayersData: (layers: TypeLayerData[]) => void;
    setAllFeaturesDataArray: (allFeaturesDataArray: TypeLayerData[]) => void;
    setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
    setInitiallayerDataTableSetting: (layerPath: string) => void;
    setIsEnlargeDataTable: (isEnlarge: boolean) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
    setRowsFilteredEntry: (rows: number, layerPath: string) => void;
    setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
    setTableHeight: (tableHeight: number) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    triggerGetAllFeatureInfo: (layerPath: string) => void;
  };
}

export function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IDataTableState {
  return {
    activeLayerData: [],
    allFeaturesDataArray: [],
    isEnlargeDataTable: false,
    layersDataTableSetting: {},
    selectedLayerPath: '',
    tableHeight: 600,

    // #region ACTIONS
    actions: {
      applyMapFilters: (filterStrings: string): void => {
        const layerPath = get().dataTableState.selectedLayerPath;
        DataTableEventProcessor.applyFilters(
          get().mapId,
          layerPath,
          filterStrings,
          !!get().dataTableState.layersDataTableSetting[layerPath].mapFilteredRecord
        );
      },
      setActiveLayersData: (activeLayerData: TypeLayerData[]) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            activeLayerData,
          },
        });
      },
      setAllFeaturesDataArray(allFeaturesDataArray: TypeLayerData[]) {
        set({
          dataTableState: {
            ...get().dataTableState,
            allFeaturesDataArray,
          },
        });
      },
      setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.columnFiltersRecord = filtered;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },
      setInitiallayerDataTableSetting: (layerPath: string) => {
        const layerSettings = {
          columnFiltersRecord: [],
          mapFilteredRecord: false,
          rowsFilteredRecord: 0,
          toolbarRowSelectedMessageRecord: '',
        };

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
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
      setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.mapFilteredRecord = mapFiltered;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
        // TODO: Apply the filter to the layer in map event processor
      },
      setRowsFilteredEntry: (rows: number, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.rowsFilteredRecord = rows;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },
      setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.toolbarRowSelectedMessageRecord = message;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },
      setTableHeight: (tableHeight: number): void => {
        set({
          dataTableState: {
            ...get().dataTableState,
            tableHeight,
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
      triggerGetAllFeatureInfo(layerPath: string) {
        // Redirect to event processor
        DataTableEventProcessor.triggerGetAllFeatureInfo(get().mapId, layerPath);
      },
    },
    // #endregion ACTIONS
  } as IDataTableState;
}

// **********************************************************
// Data-table state selectors
// **********************************************************
export const useDataTableAllFeaturesDataArray = () => useStore(useGeoViewStore(), (state) => state.dataTableState.allFeaturesDataArray);
export const useDataTableSelectedLayerPath = () => useStore(useGeoViewStore(), (state) => state.dataTableState.selectedLayerPath);
export const useDataTableLayerSettings = () => useStore(useGeoViewStore(), (state) => state.dataTableState.layersDataTableSetting);
export const useDatatableTableHeight = () => useStore(useGeoViewStore(), (state) => state.dataTableState.tableHeight);

export const useDataTableStoreActions = () => useStore(useGeoViewStore(), (state) => state.dataTableState.actions);
