import { useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '../../../ui';

const sxClasses = {
  DataGrid: {
    boxShadow: 2,
    border: 2,
    borderColor: 'primary.light',
    '& .MuiDataGrid-main': {
      '> div:nth-of-type(2)': {
        height: 'auto !important',
      },
    },
  },
};

interface Features {
  attributes: {
    [key: string]: string;
  };
  geometry: { x: string; y: string };
}

export interface DataTableData {
  displayFieldName: string;
  features: Features[];
  fieldAliases: { [key: string]: string };
  fields: {
    alias: string;
    type: string;
    name: string;
  }[];
  geometryType: string;
  spatialReference: {
    latestWkid: number;

    wkid: number;
  };
}

interface DataTableProps {
  tableType: 'materialReactDataTable';
  data: DataTableData;
}

function DataTable({ tableType, data }: DataTableProps) {
  /**
   * Build material react data table column header.
   *
   * @param {object} fieldAliases object values transformed into required key value property of material react data table
   */
  const getMaterialReactDatatableColumnHeader = useMemo(() => {
    return (fieldAliases: { [key: string]: string }) => {
      return Object.values(fieldAliases).map((fieldAlias) => {
        return {
          accessorKey: fieldAlias,
          header: fieldAlias,
        };
      });
    };
  }, []);

  /**
   * Build Rows for datatable
   *
   * @param {Features} features list of objects transform into rows.
   */
  const getRows = useMemo(() => {
    return (features: Features[]) => {
      return features.map((feature) => {
        return feature.attributes;
      });
    };
  }, []);

  /**
   * Build MUI data table column header.
   *
   * @param {object} fieldAliases object values transformed into required key value property of MUI data table
   */
  const getMUIDatatableColumnHeader = useMemo(() => {
    return (fieldAliases: { [key: string]: string }) => {
      return Object.values(fieldAliases).map((fieldAlias) => {
        return {
          field: fieldAlias,
          headerName: fieldAlias,
        };
      });
    };
  }, []);

  return (
    <Box sx={{ padding: '1rem 0' }}>
      {tableType === 'materialReactDataTable' ? (
        <MaterialReactTable
          columns={getMaterialReactDatatableColumnHeader(data.fieldAliases)}
          data={getRows(data.features)}
          enableGlobalFilter={false}
          enableRowSelection
          initialState={{ density: 'compact', pagination: { pageSize: 100, pageIndex: 0 } }}
        />
      ) : (
        <DataGrid
          sx={sxClasses.DataGrid}
          getRowId={(row) => row.OBJECTID}
          checkboxSelection
          disableSelectionOnClick
          rowsPerPageOptions={[50]}
          logLevel={false}
          columns={getMUIDatatableColumnHeader(data.fieldAliases)}
          rows={getRows(data.features)}
        />
      )}
    </Box>
  );
}

export default DataTable;
