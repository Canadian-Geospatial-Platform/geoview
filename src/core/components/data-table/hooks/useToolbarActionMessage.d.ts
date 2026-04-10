import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import type { MappedLayerDataType, ColumnsType } from '@/core/components/data-table/data-table-types';
/** Properties for the useToolbarActionMessage hook. */
interface UseSelectedRowMessageProps {
    data: MappedLayerDataType;
    layerPath: string;
    tableInstance: MRTTableInstance<ColumnsType>;
    columnFilters: MRTColumnFiltersState;
    globalFilter: string;
    showUnsymbolizedFeatures: boolean;
}
/**
 * Custom hook to compute and set the filtered/selected row message for the data table toolbar.
 *
 * @param props - Hook properties containing table data, filters, and instance
 */
export declare function useToolbarActionMessage({ data, columnFilters, globalFilter, layerPath, tableInstance, showUnsymbolizedFeatures, }: UseSelectedRowMessageProps): void;
export {};
//# sourceMappingURL=useToolbarActionMessage.d.ts.map