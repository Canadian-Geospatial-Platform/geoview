import { useStore } from 'zustand';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeFeatureInfoEntry, TypeLayerData, TypeResultSet, TypeResultSetEntry } from '@/geo/map/map-schema-types';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with DataTableEventProcessor vs DataTaleState

// #region INTERFACES & TYPES

type DataTableActions = IDataTableState['actions'];

export interface IDataTableState {
  allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[];
  activeLayerData: TypeLayerData[];
  layersDataTableSetting: Record<string, IDataTableSettings>;
  selectedFeature: TypeFeatureInfoEntry | null;
  selectedLayerPath: string;
  tableFilters: Record<string, string>;
  tableHeight: string;

  actions: {
    addOrUpdateTableFilter(layerPath: string, filter: string): void;
    applyMapFilters: (filterStrings: string) => void;
    setActiveLayersData: (layers: TypeLayerData[]) => void;
    setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
    setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
    setRowsFilteredEntry: (rows: number, layerPath: string) => void;
    setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setTableHeight: (tableHeight: string) => void;
    setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
    triggerGetAllFeatureInfo: (layerPath: string) => Promise<TypeAllFeatureInfoResultSet | void>;
  };

  setterActions: {
    setActiveLayersData: (layers: TypeLayerData[]) => void;
    setAllFeaturesDataArray: (allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[]) => void;
    setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
    setInitiallayerDataTableSetting: (layerPath: string) => void;
    setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
    setRowsFilteredEntry: (rows: number, layerPath: string) => void;
    setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
    setSelectedLayerPath: (layerPath: string) => void;
    setTableFilters(newTableFilters: Record<string, string>): void;
    setTableHeight: (tableHeight: string) => void;
    setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
  };
}

// #endregion INTERFACES & TYPES

/**
 * Initializes an DataTable State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IDataTableState} - The initialized DataTable State
 */
export function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IDataTableState {
  return {
    activeLayerData: [],
    allFeaturesDataArray: [],
    layersDataTableSetting: {},
    selectedFeature: null,
    selectedLayerPath: '',
    tableFilters: {},
    tableHeight: '500px',

    // #region ACTIONS

    actions: {
      addOrUpdateTableFilter(layerPath: string, filter: string): void {
        // Redirect to event processor
        DataTableEventProcessor.addOrUpdateTableFilter(get().mapId, layerPath, filter);
      },
      applyMapFilters: (filterStrings: string): void => {
        const layerPath = get().dataTableState.selectedLayerPath;
        DataTableEventProcessor.updateFilters(
          get().mapId,
          layerPath,
          filterStrings,
          !!get().dataTableState.layersDataTableSetting[layerPath].mapFilteredRecord
        );
      },
      setActiveLayersData: (activeLayerData: TypeLayerData[]) => {
        // Redirect to setter
        get().dataTableState.setterActions.setActiveLayersData(activeLayerData);
      },
      setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => {
        // Redirect to setter
        get().dataTableState.setterActions.setColumnFiltersEntry(filtered, layerPath);
      },
      setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => {
        // Redirect to setter
        get().dataTableState.setterActions.setMapFilteredEntry(mapFiltered, layerPath);
      },
      setRowsFilteredEntry: (rows: number, layerPath: string) => {
        // Redirect to setter
        get().dataTableState.setterActions.setRowsFilteredEntry(rows, layerPath);
      },
      setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => {
        // Redirect to setter
        get().dataTableState.setterActions.setToolbarRowSelectedMessageEntry(message, layerPath);
      },
      setTableHeight: (tableHeight: string): void => {
        // Redirect to setter
        get().dataTableState.setterActions.setTableHeight(tableHeight);
      },
      setSelectedLayerPath: (layerPath: string) => {
        // Redirect to setter
        get().dataTableState.setterActions.setSelectedLayerPath(layerPath);
      },
      triggerGetAllFeatureInfo(layerPath: string): Promise<TypeAllFeatureInfoResultSet | void> {
        // Redirect to event processor
        return DataTableEventProcessor.triggerGetAllFeatureInfo(get().mapId, layerPath);
      },
      setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => {
        // Redirect to setter
        get().dataTableState.setterActions.setGlobalFilteredEntry(globalFilterValue, layerPath);
      },
      setSelectedFeature: (feature: TypeFeatureInfoEntry) => {
        // Redirect to setter
        get().dataTableState.setterActions.setSelectedFeature(feature);
      },
    },

    setterActions: {
      setActiveLayersData: (activeLayerData: TypeLayerData[]) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            activeLayerData,
          },
        });
      },
      setAllFeaturesDataArray(allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[]) {
        set({
          dataTableState: {
            ...get().dataTableState,
            allFeaturesDataArray,
          },
        });
      },
      setInitiallayerDataTableSetting: (layerPath: string) => {
        const layerSettings = {
          columnFiltersRecord: [],
          mapFilteredRecord: false,
          rowsFilteredRecord: 0,
          toolbarRowSelectedMessageRecord: '',
          globalFilterRecord: '',
        };

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
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
      setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.mapFilteredRecord = mapFiltered;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
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
      setTableFilters(newTableFilters: Record<string, string>): void {
        set({
          dataTableState: {
            ...get().dataTableState,
            tableFilters: newTableFilters,
          },
        });
      },
      setTableHeight: (tableHeight: string): void => {
        set({
          dataTableState: {
            ...get().dataTableState,
            tableHeight,
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
      setSelectedLayerPath: (layerPath: string) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedLayerPath: layerPath,
          },
        });
      },
      setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => {
        const layerSettings = get().dataTableState.layersDataTableSetting[layerPath];
        layerSettings.globalFilterRecord = globalFilterValue;

        set({
          dataTableState: {
            ...get().dataTableState,
            layersDataTableSetting: { ...get().dataTableState.layersDataTableSetting, [layerPath]: layerSettings },
          },
        });
      },
      setSelectedFeature: (feature: TypeFeatureInfoEntry) => {
        set({
          dataTableState: {
            ...get().dataTableState,
            selectedFeature: feature,
          },
        });
      },
    },

    // #endregion ACTIONS
  } as IDataTableState;
}

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
  globalFilterRecord: string;
}

export type TypeAllFeatureInfoResultSetEntry = TypeResultSetEntry & TypeLayerData;

export type TypeAllFeatureInfoResultSet = TypeResultSet<TypeAllFeatureInfoResultSetEntry>;

// **********************************************************
// Data-table state selectors
// **********************************************************
export const useDataTableAllFeaturesDataArray = (): TypeAllFeatureInfoResultSetEntry[] =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.allFeaturesDataArray);
export const useDataTableFilters = (): Record<string, string> => useStore(useGeoViewStore(), (state) => state.dataTableState.tableFilters);
export const useDataTableSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.dataTableState.selectedLayerPath);
export const useDataTableLayerSettings = (): Record<string, IDataTableSettings> =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.layersDataTableSetting);
export const useDataTableTableHeight = (): string => useStore(useGeoViewStore(), (state) => state.dataTableState.tableHeight);
export const useDataTableSelectedFeature = (): TypeFeatureInfoEntry | null =>
  useStore(useGeoViewStore(), (state) => state.dataTableState.selectedFeature);

export const useDataTableStoreActions = (): DataTableActions => useStore(useGeoViewStore(), (state) => state.dataTableState.actions);
