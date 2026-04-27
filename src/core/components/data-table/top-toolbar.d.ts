import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnDef } from 'material-react-table';
import type { ColumnsType } from './data-table-types';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import type { SxStyles } from '@/ui/style/types';
/** Properties for the TopToolbar component. */
interface TopToolbarProps<TData extends ColumnsType> {
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
    columns: MRT_ColumnDef<ColumnsType, unknown>[];
    /** The data object containing features for the table. */
    data: {
        features?: TypeFeatureInfoEntry[] | null;
    };
    /** The Material React Table instance. */
    table: MRTTableInstance<ColumnsType>;
    /** The count of features before any filters are applied. */
    unfilteredFeaturesCount?: number;
}
/**
 * Renders the top toolbar for the data table with filters, search, and export controls.
 *
 * @param props - TopToolbar properties
 * @returns The toolbar element
 */
declare function TopToolbar(props: TopToolbarProps<ColumnsType>): JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof TopToolbar>;
export default _default;
//# sourceMappingURL=top-toolbar.d.ts.map