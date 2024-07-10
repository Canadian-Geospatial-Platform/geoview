import { type MRT_TableInstance as MRTTableInstance, type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { MappedLayerDataType, ColumnsType } from '@/core/components/data-table/data-table-types';
interface UseSelectedRowMessageProps {
    data: MappedLayerDataType;
    layerPath: string;
    tableInstance: MRTTableInstance<ColumnsType>;
    columnFilters: MRTColumnFiltersState;
    globalFilter: string;
}
/**
 * Custom hook to set the selected/filtered row message for data table.
 * @param {MappedLayerDataType} data data to be rendered inside data table
 * @param {string} layerPath key of the layer selected.
 * @param {MRTTableInstance} tableInstance  object of the data table.
 * @param {MRTColumnFiltersState} columnFilters column filters set by the user on the table.
 */
export declare function useToolbarActionMessage({ data, columnFilters, globalFilter, layerPath, tableInstance }: UseSelectedRowMessageProps): void;
export {};
