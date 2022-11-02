import { DataGrid, DataGridProps } from '@mui/x-data-grid';

/**
 * Create a data grid (table) component for a lyer features all request
 *
 * @param {DataGridProps} props table properties
 * @returns {JSX.Element} returns table component
 */
export function LayerDataGrid(props: DataGridProps) {
  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        {...props}
        getRowId={(row) => row.OBJECTID}
        getRowClassName={(params) => (params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd')}
      />
    </div>
  );
}
