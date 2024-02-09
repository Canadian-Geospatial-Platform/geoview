import { type MRT_TableInstance as MRTTableInstance, type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import { ColumnsType } from '../data-table';
import { MappedLayerDataType } from '../data-panel';
interface UseSelectedRowMessageProps {
    data: MappedLayerDataType;
    layerPath: string;
    tableInstance: MRTTableInstance<ColumnsType>;
    rowSelection: Record<number, boolean>;
    columnFilters: MRTColumnFiltersState;
}
/**
 * Custom hook to set the selected/filtered row message for data table.
 * @param {MappedLayerDataType} data data to be rendered inside data table
 * @param {string} layerPath key of the layer selected.
 * @param {MRTTableInstance} tableInstance  object of the data table.
 * @param {Object} rowSelection selected rows by the user
 * @param {MRTColumnFiltersState} columnFilters column filters set by the user on the table.
 */
export declare function useToolbarActionMessage({ data, rowSelection, columnFilters, layerPath, tableInstance }: UseSelectedRowMessageProps): void;
export {};
