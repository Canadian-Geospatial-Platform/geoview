import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { TypeSetStore, TypeGetStore } from '@/core/stores/geoview-store';
import { LayersDataType } from '@/core/components/data-table/data-panel';
export interface IMapDataTableState {
    columnFiltersRecord: Record<string, MRTColumnFiltersState>;
    filterMapDelay: number;
    isEnlargeDataTable: boolean;
    mapFilteredRecord: Record<string, boolean>;
    rowsFilteredRecord: Record<string, number>;
    rowSelectionsRecord: Record<string, Record<number, boolean>>;
    selectedLayerIndex: number;
    toolbarRowSelectedMessageRecord: Record<string, string>;
    layersData: LayersDataType[];
    actions: {
        setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => void;
        setIsEnlargeDataTable: (isEnlarge: boolean) => void;
        setMapFilteredEntry: (mapFiltered: boolean, layerKey: string) => void;
        setRowsFilteredEntry: (rows: number, layerKey: string) => void;
        setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => void;
        setSelectedLayerIndex: (idx: number) => void;
        setToolbarRowSelectedMessageEntry: (message: string, layerKey: string) => void;
        setLayersData: (layers: LayersDataType[]) => void;
    };
}
export declare function initialDataTableState(set: TypeSetStore, get: TypeGetStore): IMapDataTableState;
export declare const useDataTableStoreSelectedLayerIndex: () => number;
export declare const useDataTableStoreIsEnlargeDataTable: () => boolean;
export declare const useDataTableStoreFilterMapDelay: () => number;
export declare const useDataTableStoreToolbarRowSelectedMessageRecord: () => Record<string, string>;
export declare const useDataTableStoreColumnFiltersRecord: () => Record<string, MRTColumnFiltersState>;
export declare const useDataTableStoreRowSelectionsRecord: () => Record<string, Record<number, boolean>>;
export declare const useDataTableStoreMapFilteredRecord: () => Record<string, boolean>;
export declare const useDataTableStoreRowsFiltered: () => Record<string, number>;
export declare const useDatatableStoreLayersData: () => LayersDataType[];
export declare const useDataTableStoreActions: () => {
    setColumnFiltersEntry: (filtered: MRTColumnFiltersState, layerKey: string) => void;
    setIsEnlargeDataTable: (isEnlarge: boolean) => void;
    setMapFilteredEntry: (mapFiltered: boolean, layerKey: string) => void;
    setRowsFilteredEntry: (rows: number, layerKey: string) => void;
    setRowSelectionsEntry: (rowSelection: Record<number, boolean>, layerKey: string) => void;
    setSelectedLayerIndex: (idx: number) => void;
    setToolbarRowSelectedMessageEntry: (message: string, layerKey: string) => void;
    setLayersData: (layers: LayersDataType[]) => void;
};
