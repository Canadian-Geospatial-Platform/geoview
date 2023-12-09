import { MaterialReactTable, MaterialReactTableProps } from 'material-react-table';

/**
 * Create a material react table
 * @param {MaterialReactTableProps} props props defined by material react table library.
 * @returns JSX.Element
 */
export function Table(props: MaterialReactTableProps) {
  return <MaterialReactTable {...props} />;
}

export * from 'material-react-table';
