import { useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { Box } from '../../../ui';

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
  data: DataTableData;
}

function DataTable({ data }: DataTableProps) {
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

  return (
    <Box sx={{ padding: '1rem 0' }}>
      <MaterialReactTable
        columns={getMaterialReactDatatableColumnHeader(data.fieldAliases)}
        data={getRows(data.features)}
        enableGlobalFilter={false}
        enableRowSelection
        initialState={{ density: 'compact', pagination: { pageSize: 100, pageIndex: 0 } }}
      />
    </Box>
  );
}

export default DataTable;
