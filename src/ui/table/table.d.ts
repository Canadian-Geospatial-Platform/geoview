import type { MRT_TableOptions as MRTTableOptions } from 'material-react-table';
import { type MRT_RowData as MRTRowData } from 'material-react-table';
/**
 * Material React Table (MRT) component wrapper for advanced data tables.
 *
 * Wraps Material React Table with full prop compatibility for features like pagination,
 * row selection, sorting, and filtering. Maintains clean pass-through of all MRT options.
 * All Material React Table props are supported.
 *
 * @param props - Table configuration (see MRTTableOptions)
 * @returns Material React Table component with enhanced functionality
 *
 * @example
 * ```tsx
 * <MRTTable
 *   data={tableData}
 *   columns={tableColumns}
 *   enablePagination
 *   enableRowSelection
 * />
 * ```
 *
 * @see {@link https://www.material-react-table.com/}
 */
declare function MRTTableUI<TData extends MRTRowData>(props: MRTTableOptions<TData>): JSX.Element;
export declare const MRTTable: typeof MRTTableUI;
export * from 'material-react-table';
//# sourceMappingURL=table.d.ts.map