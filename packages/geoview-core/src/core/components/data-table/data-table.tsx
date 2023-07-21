import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MaterialReactTable,
  type MRT_ColumnDef as MRTColumnDef,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
  MRT_ShowHideColumnsButton as MRTShowHideColumnsButton,
  MRT_ToggleFiltersButton as MRTToggleFiltersButton,
  MRT_FullScreenToggleButton as MRTFullScreenToggleButton,
  type MRT_SortingState as MRTSortingState,
  type MRT_Virtualizer as MRTVirtualizer,
} from 'material-react-table';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
import { Box, IconButton, ZoomInSearchIcon } from '../../../ui';
import ExportButton from './export-button';

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
  // optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef<MRTVirtualizer<HTMLDivElement, HTMLTableRowElement>>(null);

  const [sorting, setSorting] = useState<MRTSortingState>([]);

  useEffect(() => {
    // scroll to the top of the table when the sorting changes
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch (error) {
      console.error(error);
    }
  }, [sorting]);
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
        ...(['ICON', 'ZOOM'].includes(fieldAlias) && { size: 100 }),
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
        initialState={{
          columnPinning: { left: ['ICON', 'ZOOM'] },
          density: 'compact',
          pagination: { pageSize: 10, pageIndex: 0 },
        }}
        renderToolbarInternalActions={({ table }) => (
          <Box>
            <MRTToggleFiltersButton table={table} />
            <MRTShowHideColumnsButton table={table} />
            <MRTToggleDensePaddingButton table={table} />
            <MRTFullScreenToggleButton table={table} />
            <ExportButton dataTableData={rows} columns={columns} />
          </Box>
        )}
        enableBottomToolbar={false}
        enableColumnResizing
        enableColumnVirtualization
        enableGlobalFilterModes
        enablePagination={false}
        enablePinning
        enableRowVirtualization
        muiTableContainerProps={{ sx: { maxHeight: '600px' } }}
        onSortingChange={setSorting}
        state={{ sorting }}
        rowVirtualizerInstanceRef={rowVirtualizerInstanceRef}
        rowVirtualizerProps={{ overscan: 5 }}
        columnVirtualizerProps={{ overscan: 2 }}
      />
    </Box>
  );
}

export default DataTable;
