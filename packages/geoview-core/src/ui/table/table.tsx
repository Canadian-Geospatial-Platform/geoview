import { MaterialReactTable, MRT_TableOptions as MRTTableOptions, type MRT_RowData as MRTRowData } from 'material-react-table';

/**
 * Create a material react table
 * @param {MRTTableOptions} props props defined by material react table library.
 * @returns {JSX.Element}
 */
export function MRTTable<TData extends MRTRowData>(tableOptions: MRTTableOptions<TData>): JSX.Element {
  return <MaterialReactTable {...tableOptions} />;
}

export * from 'material-react-table';
