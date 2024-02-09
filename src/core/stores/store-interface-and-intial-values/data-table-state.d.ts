import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { TypeArrayOfLayerData } from '@/app';
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
export declare function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IMapDataTableState;
export declare const useDataTableStoreSelectedLayerPath: () => string;
export declare const useDataTableStoreIsEnlargeDataTable: () => boolean;
export declare const useDataTableStoreToolbarRowSelectedMessageRecord: () => Record<string, string>;
export declare const useDataTableStoreColumnFilteredRecord: () => Record<string, MRTColumnFiltersState>;
export declare const useDataTableStoreRowSelectionsRecord: () => Record<string, Record<number, boolean>>;
export declare const useDataTableStoreMapFilteredRecord: () => Record<string, boolean>;
export declare const useDataTableStoreRowsFiltered: () => Record<string, number>;
export declare const useDatatableStoreLayersData: () => TypeArrayOfLayerData;
export declare const useDataTableStoreActions: () => IMapDataTableStateActions;
export {};
