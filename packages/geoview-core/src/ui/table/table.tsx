import { DataGrid, DataGridProps } from '@mui/x-data-grid';

/**
 * Create a table component
 *
 * @param {DataGridProps} props table properties
 * @returns {JSX.Element} returns table component
 */
export function Table(props: DataGridProps): JSX.Element {
  return <DataGrid {...props} />;
}
