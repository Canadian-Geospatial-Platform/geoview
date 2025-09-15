import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeFeatureInfoEntry, TypeLayerData, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
type DataTableActions = IDataTableState['actions'];
export interface IDataTableState {
    allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[];
    activeLayerData: TypeLayerData[];
    layersDataTableSetting: Record<string, IDataTableSettings>;
    selectedFeature: TypeFeatureInfoEntry | null;
    selectedLayerPath: string;
    tableFilters: Record<string, string>;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        addOrUpdateTableFilter(layerPath: string, filter: string): void;
        applyMapFilters: (filterStrings: string) => void;
        getFilteredDataFromLegendVisibility: (layerPath: string, features: TypeFeatureInfoEntry[]) => TypeFeatureInfoEntry[];
        setActiveLayersData: (layers: TypeLayerData[]) => void;
        setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
        setColumnsFiltersVisibility: (visible: boolean, layerPath: string) => void;
        setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
        setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
        setRowsFilteredEntry: (rows: number, layerPath: string) => void;
        setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
        triggerGetAllFeatureInfo: (layerPath: string) => Promise<TypeFeatureInfoEntry[] | void>;
    };
    setterActions: {
        setActiveLayersData: (layers: TypeLayerData[]) => void;
        setAllFeaturesDataArray: (allFeaturesDataArray: TypeAllFeatureInfoResultSetEntry[]) => void;
        setColumnFiltersEntry: (filtered: TypeColumnFiltersState, layerPath: string) => void;
        setColumnsFiltersVisibility: (visible: boolean, layerPath: string) => void;
        setInitiallayerDataTableSetting: (layerPath: string) => void;
        setGlobalFilteredEntry: (globalFilterValue: string, layerPath: string) => void;
        setMapFilteredEntry: (mapFiltered: boolean, layerPath: string) => void;
        setRowsFilteredEntry: (rows: number, layerPath: string) => void;
        setSelectedFeature: (feature: TypeFeatureInfoEntry) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setTableFilters(newTableFilters: Record<string, string>): void;
        setToolbarRowSelectedMessageEntry: (message: string, layerPath: string) => void;
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
export interface IDataTableSettings {
    columnFiltersRecord: TypeColumnFiltersState;
    columnsFiltersVisibility: boolean;
    mapFilteredRecord: boolean;
    rowsFilteredRecord: number;
    toolbarRowSelectedMessageRecord: string;
    globalFilterRecord: string;
}
export type TypeAllFeatureInfoResultSetEntry = TypeResultSetEntry & TypeLayerData;
export type TypeAllFeatureInfoResultSet = TypeResultSet<TypeAllFeatureInfoResultSetEntry>;
export declare const useDataTableAllFeaturesDataArray: () => TypeAllFeatureInfoResultSetEntry[];
export declare const useDataTableFilters: () => Record<string, string>;
export declare const useDataTableSelectedLayerPath: () => string;
export declare const useDataTableLayerSettings: () => Record<string, IDataTableSettings>;
export declare const useDataTableSelectedFeature: () => TypeFeatureInfoEntry | null;
export declare const useDataTableStoreActions: () => DataTableActions;
export {};
//# sourceMappingURL=data-table-state.d.ts.map