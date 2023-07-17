import React, { useMemo } from 'react';
import {
  MaterialReactTable,
  type MRT_ColumnDef as MRTColumnDef,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
  MRT_FullScreenToggleButton as MRTFullScreenToggleButton,
} from 'material-react-table';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { ZoomInSearchIcon } from '../../../ui/icons';
import { Box, IconButton } from '../../../ui';

export interface Features {
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

export interface ColumnsType {
  ICON: string;
  ZOOM: string;
  [key: string]: string;
}

interface DataTableProps {
  data: DataTableData;
}

export interface Rows {
  geometry: Geometry;
  extent?: Extent;
  featureKey?: string;
  featureIcon?: string;
  featureActions?: unknown;
}

function DataTable({ data }: DataTableProps) {
  /**
   * Build material react data table column header.
   *
   * @param {object} data.fieldAliases object values transformed into required key value property of material react data table
   */
  const columns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
    return Object.values({ icon: 'ICON', zoom: 'ZOOM', ...data.fieldAliases }).map((fieldAlias) => {
      return {
        accessorKey: fieldAlias,
        header: fieldAlias,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Build Rows for datatable
   *
   * @param {Features} features list of objects transform into rows.
   */
  const rows = useMemo(() => {
    return data.features.map((feature) => {
      return {
        ICON: 'Image',
        ZOOM: (
          <IconButton>
            <ZoomInSearchIcon />
          </IconButton>
        ),
        ...feature.attributes,
      };
    }) as unknown as ColumnsType[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ padding: '1rem 0' }}>
      <MaterialReactTable
        columns={columns}
        data={rows}
        enableGlobalFilter={false}
        enableRowSelection
        initialState={{ density: 'compact', pagination: { pageSize: 10, pageIndex: 0 } }}
        renderToolbarInternalActions={({ table }) => (
          <Box>
            {/* add custom button to print table  */}

            {/* along-side built-in buttons in whatever order you want them */}
            <MRTToggleDensePaddingButton table={table} />
            <MRTFullScreenToggleButton table={table} />
          </Box>
        )}
      />
    </Box>
  );
}

export default DataTable;
