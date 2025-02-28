import { MaterialReactTable, MRT_TableOptions as MRTTableOptions, type MRT_RowData as MRTRowData } from 'material-react-table';
import { logger } from '@/core/utils/logger';

/**
 * Create a Material React Table component wrapper.
 * This is a wrapper around Material React Table that maintains
 * full compatibility with MRT props.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <MRTTable
 *   data={tableData}
 *   columns={tableColumns}
 *   enablePagination
 * />
 *
 * // With row selection
 * <MRTTable
 *   data={tableData}
 *   columns={tableColumns}
 *   enableRowSelection
 *   onRowSelectionChange={handleSelection}
 * />
 *
 * // With custom styling
 * <MRTTable
 *   data={tableData}
 *   columns={tableColumns}
 *   className="custom-table"
 *   muiTableHeadCellProps={{
 *     sx: { backgroundColor: 'lightgray' }
 *   }}
 * />
 * ```
 *
 * @param {MRTTableProps} props - All valid Material React Table props
 * @returns {JSX.Element} The MRT table component with enhanced functionality
 *
 * @see {@link https://www.material-react-table.com/}
 */
function MRTTableUI<TData extends MRTRowData>(props: MRTTableOptions<TData>): JSX.Element {
  logger.logTraceRenderDetailed('ui/table/table', props);

  return <MaterialReactTable {...props} />;
}

export const MRTTable = MRTTableUI;

export * from 'material-react-table';
