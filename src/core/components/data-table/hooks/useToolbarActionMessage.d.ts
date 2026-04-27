import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import type { ColumnsType } from '@/core/components/data-table/data-table-types';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
/** Properties for the useToolbarActionMessage hook. */
interface UseSelectedRowMessageProps {
    data: {
        features?: TypeFeatureInfoEntry[] | null;
    };
    layerPath: string;
    tableInstance: MRTTableInstance<ColumnsType>;
    columnFilters: MRTColumnFiltersState;
    globalFilter: string;
    showUnsymbolizedFeatures: boolean;
    unfilteredFeaturesCount: number;
}
/**
 * Custom hook to compute and set the filtered/selected row message for the data table toolbar.
 *
 * @param props - Hook properties containing table data, filters, and instance
 */
export declare function useToolbarActionMessage({ data, columnFilters, globalFilter, layerPath, tableInstance, showUnsymbolizedFeatures, unfilteredFeaturesCount, }: UseSelectedRowMessageProps): string;
export {};
//# sourceMappingURL=useToolbarActionMessage.d.ts.map