import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeFeatureInfoEntry, TypeLayerData, TypeResultSet, TypeResultSetEntry } from '@/geo/map/map-schema-types';
type DataTableActions = IDataTableState['actions'];
export interface IDataTableState {
    allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[];
    activeLayerData: TypeLayerData[];
    layersDataTableSetting: Record<string, IDataTableSettings>;
    selectedLayerPath: string;
    tableHeight: string;
    selectedFeature: TypeFeatureInfoEntry | null;
    actions: {
        applyMapFilters: (filterStrings: string) => void;
        setActiveLayersData: (layers: TypeLayerData[]) => void;
        setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
        setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
        setRowsFilteredEntry: (rows: number, layerPath: string) => void;
        setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
        setTableHeight: (tableHeight: string) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        triggerGetAllFeatureInfo: (layerPath: string) => Promise<TypeAllFeatureInfoResultSet | void>;
        setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
        setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
    };
    setterActions: {
        setActiveLayersData: (layers: TypeLayerData[]) => void;
        setAllFeaturesDataArray: (allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[]) => void;
        setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
        setInitiallayerDataTableSetting: (layerPath: string) => void;
        setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
        setRowsFilteredEntry: (rows: number, layerPath: string) => void;
        setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
        setTableHeight: (tableHeight: string) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
        setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
    };
}
/**
 * Initializes an DataTable State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {IDataTableState} - The initialized DataTable State
 */
export declare function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IDataTableState;
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
export declare const useDataTableAllFeaturesDataArray: () => TypeAllFeatureInfoResultSetEntry[];
export declare const useDataTableSelectedLayerPath: () => string;
export declare const useDataTableLayerSettings: () => Record<string, IDataTableSettings>;
export declare const useDataTableTableHeight: () => string;
export declare const useDataTableSelectedFeature: () => TypeFeatureInfoEntry | null;
export declare const useDataTableStoreActions: () => DataTableActions;
export {};
