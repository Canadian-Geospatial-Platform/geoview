import { useEffect, useRef, useState, useMemo } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DataLoader from './data-loader';

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

interface DataTableData {
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
  tableType: 'materialReactDataTable' | 'muiDataTable';
}

function DataTable({ tableType }: DataTableProps) {
  const urlRef = useRef<string>(
    'https://geoappext.nrcan.gc.ca/arcgis/rest/services/GSCC/Geochronology/MapServer/0/query?f=json&where=OBJECTID+%3E+0&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&having=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&historicMoment=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentOnly=false&datumTransformation=&parameterValues=&rangeValues=&quantizationParameters=&f=html'
  );

  const [data, setData] = useState<DataTableData>();
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get Data table data from url.
   * @param {searchTerm} - search term url
   * @returns void
   */
  const getData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${urlRef.current}`);
      if (!response.ok) {
        throw new Error('Error');
      }
      const result = await response.json();
      setIsLoading(false);
      setData(result);
    } catch (err) {
      setIsLoading(false);
      console.log('error');
    }
  };

  useEffect(() => {
    getData();
  }, []);

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

  const getMaterialReactDatatableRows = useMemo(() => {
    return (features: Features[]) => {
      return features.map((feature) => {
        return feature.attributes;
      });
    };
  }, []);

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

  const getMUIDatatableRows = useMemo(() => {
    return (features: Features[]) => {
      return features.map((feature) => {
        return feature.attributes;
      });
    };
  }, []);

  if (isLoading) {
    return <DataLoader />;
  }

  return (
    <Box sx={{ padding: '1rem 0' }}>
      {data &&
        (tableType === 'materialReactDataTable' ? (
          <MaterialReactTable
            columns={getMaterialReactDatatableColumnHeader(data.fieldAliases)}
            data={getMaterialReactDatatableRows(data.features)}
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
            rows={getMUIDatatableRows(data.features)}
          />
        ))}
    </Box>
  );
}

export default DataTable;
