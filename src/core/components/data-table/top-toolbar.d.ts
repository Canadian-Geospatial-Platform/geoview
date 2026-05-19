import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnDef } from 'material-react-table';
import type { DataTableRow } from './data-table-types';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import type { SxStyles } from '@/ui/style/types';
/** Properties for the TopToolbar component. */
interface TopToolbarProps<TData extends DataTableRow> {
    /** Classes or styles for the component. */
    sxClasses: SxStyles;
    /** The path for the current layer being processed. */
    layerPath: string;
    /** Translation function for internationalization. */
    t: (key: string) => string;
    /** The current global filter value. */
    globalFilter: string | null;
    /** Utility functions provided by the table instance. */
    useTable: {
        resetColumnFilters: () => void;
        getFilteredRowModel: () => {
            rows: Array<{
                original: TData;
            }>;
        };
    } | null;
    /** Column definitions for the table. */
    columns: MRT_ColumnDef<DataTableRow, unknown>[];
    /** The data object containing features for the table. */
    data: {
        features?: TypeFeatureInfoEntry[] | null;
    };
    /** The Material React Table instance. */
    table: MRTTableInstance<DataTableRow>;
    /** The count of features before any filters are applied. */
    unfilteredFeaturesCount?: number;
}
/**
 * Creates the top toolbar for the data table with filters, search, and export controls.
 *
 * @param props - Properties defined in TopToolbarProps interface
 * @returns The top toolbar element
 */
declare function TopToolbar(props: TopToolbarProps<DataTableRow>): JSX.Element;
export default TopToolbar;
//# sourceMappingURL=top-toolbar.d.ts.map