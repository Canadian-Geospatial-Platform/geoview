import React from 'react';
import { MRT_TableInstance as MRTTableInstance, MRT_ColumnDef } from 'material-react-table';
import { ColumnsType } from './data-table-types';
import { TypeFeatureInfoEntry } from '@/geo';
import { SxStyles } from '@/ui/style/types';
interface TopToolbarProps<TData extends ColumnsType> {
    /**
     * Classes or styles for the component.
     */
    sxClasses: SxStyles;
    /**
     * Settings for the datatable, indexed by layerPath.
     */
    datatableSettings: Record<string, {
        toolbarRowSelectedMessageRecord: string;
    }>;
    /**
     * The path for the current layer being processed.
     */
    layerPath: string;
    /**
     * Translation function for internationalization.
     */
    t: (key: string) => string;
    /**
     * The current global filter value.
     */
    globalFilter: string | null;
    /**
     * Utility functions provided by the table instance.
     */
    useTable: {
        resetColumnFilters: () => void;
        getFilteredRowModel: () => {
            rows: Array<{
                original: TData;
            }>;
        };
    } | null;
    /**
     * Column definitions for the table.
     */
    columns: MRT_ColumnDef<ColumnsType, unknown>[];
    /**
     * The data object containing features for the table.
     */
    data: {
        features?: TypeFeatureInfoEntry[] | null;
    };
    table: MRTTableInstance<ColumnsType>;
}
declare function TopToolbar(props: TopToolbarProps<ColumnsType>): JSX.Element;
declare const _default: React.MemoExoticComponent<typeof TopToolbar>;
export default _default;
