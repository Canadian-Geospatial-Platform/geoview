import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  MaterialReactTable,
  type MRT_ColumnDef as MRTColumnDef,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
  MRT_ShowHideColumnsButton as MRTShowHideColumnsButton,
  MRT_ToggleFiltersButton as MRTToggleFiltersButton,
  MRT_FullScreenToggleButton as MRTFullScreenToggleButton,
  type MRT_SortingState as MRTSortingState,
  type MRT_Virtualizer as MRTVirtualizer,
  type MRT_ColumnFiltersState as MRTColumnFiltersState,
} from 'material-react-table';
import { Projection } from 'ol/proj';
import { Extent } from 'ol/extent';
import { darken } from '@mui/material';
import { difference } from 'lodash';
import { getUid } from 'ol/util';
import { Box, IconButton, Tooltip, ZoomInSearchIcon } from '@/ui';
import ExportButton from './export-button';
import JSONExportButton from './json-export-button';
import FilterMap from './filter-map';
import {
  AbstractGeoViewVector,
  TypeLayerEntryConfig,
  EsriDynamic,
  api,
  TypeFieldEntry,
  TypeFeatureInfoEntry,
  featureHighlightPayload,
  EVENT_NAMES,
  clearHighlightsPayload,
} from '@/app';

export interface MapDataTableDataEntrys extends TypeFeatureInfoEntry {
  rows: Record<string, string>;
}

export interface MapDataTableData {
  features: MapDataTableDataEntrys[];
  fieldAliases: Record<string, TypeFieldEntry>;
}

export interface ColumnsType {
  ICON: string;
  ZOOM: string;
  [key: string]: string;
}

interface MapDataTableProps {
  data: MapDataTableData;
  layerId: string;
  mapId: string;
  layerKey: string;
  projectionConfig: Projection;
}

/**
 * Build Data table from map.
 * @param {MapDataTableProps} data map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {Projection} projectionConfig projection config to transfer lat long.
 * @return {ReactElement} Data table as react element.
 */

function MapDataTable({ data, layerId, mapId, layerKey, projectionConfig }: MapDataTableProps) {
  const mountedRef = useRef(false);
  const { t } = useTranslation<string>();
  const iconColumn = { alias: t('dataTable.icon'), dataType: 'string', id: t('dataTable.icon') };
  const zoomColumn = { alias: t('dataTable.zoom'), dataType: 'string', id: t('dataTable.zoom') };

  const [mapFiltered, setMapFiltered] = useState<boolean>(false);
  const [filteredData] = useState(data.features);
  const [columnFilters, setColumnFilters] = useState<MRTColumnFiltersState>([]);
  const [filterStrings, setFilterStrings] = useState<string[]>();

  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>({});
  const rowSelectionRef = useRef<Array<number>>([]);

  // optionally access the underlying virtualizer instance
  const rowVirtualizerInstanceRef = useRef<MRTVirtualizer<HTMLDivElement, HTMLTableRowElement>>(null);

  const [sorting, setSorting] = useState<MRTSortingState>([]);

  const iconImage = {
    padding: 3,
    borderRadius: 0,
    border: '1px solid',
    borderColor: '#757575',
    boxShadow: 'rgb(0 0 0 / 20%) 0px 3px 1px -2px, rgb(0 0 0 / 14%) 0px 2px 2px 0px, rgb(0 0 0 / 12%) 0px 1px 5px 0px',
    background: '#fff',
    objectFit: 'scale-down',
    width: '35px',
    height: '35px',
  } as React.CSSProperties;

  /**
   * Convert the filter list from the Column Filter
   *
   * @param {MRTColumnFiltersState} columnFilter list of filter from table.
   */
  const buildFilterList = useCallback((columnFilter: MRTColumnFiltersState) => {
    if (!columnFilter.length) return [''];
    return columnFilter.map((filter) => {
      if ((filter.value as string).match(/^-?\d+$/)) {
        return `${filter.id} = ${filter.value}`;
      }
      return `${filter.id} like '%${filter.value}%'`;
    });
  }, []);

  useEffect(() => {
    // scroll to the top of the table when the sorting changes
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [sorting]);

  useEffect(() => {
    if (columnFilters && mountedRef.current) {
      const filterList = buildFilterList(columnFilters);
      setFilterStrings(filterList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  useEffect(() => {
    const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];
    const filterLayerConfig = api.maps[mapId].layer.registeredLayers[layerKey] as TypeLayerEntryConfig;
    // filter map when filterMap is toggled true.
    if (mapFiltered && filterStrings) {
      filterStrings.forEach((filterString) => {
        if (mapFiltered && geoviewLayerInstance !== undefined && filterLayerConfig !== undefined) {
          (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, filterString);
        } else {
          (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, '');
        }
      });
    }
    // clear filters filtering is off
    if (!mapFiltered) {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFiltered, filterStrings]);

  useEffect(() => {
    // This is created to counter column filter that is fired when component is mounted.
    mountedRef.current = true;
  }, []);

  // add/remove hightlight feature when row is selected/unselected.
  useEffect(() => {
    const selectedRows = Object.keys(rowSelection).map((key) => Number(key));

    const addAnimationRowIds = difference(selectedRows, rowSelectionRef.current);

    addAnimationRowIds.forEach((idx) => {
      const row = filteredData[Number(idx)];
      if (row) {
        api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, row));
      }
    });

    const removeAnimationRowIds = difference(rowSelectionRef.current, selectedRows);
    removeAnimationRowIds.forEach((id) => {
      const feature = filteredData[Number(id)];
      const featureUid = getUid(feature.geometry);
      api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, featureUid));
    });

    rowSelectionRef.current = selectedRows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  /**
   * Create table header cell
   * @param {string} header value to be displayed in cell
   * @returns JSX.Element
   */
  const getTableHeader = useCallback((header: string) => {
    return (
      <Box component="span" sx={{ 'white-space': 'nowrap' }}>
        {header}
      </Box>
    );
  }, []);

  /**
   * Create data table body cell with tooltip
   * @param {string} cellValue cell value to be displayed in cell
   * @returns JSX.Element
   */
  const getCellValueWithTooltip = (cellValue: string) => {
    return (
      <Tooltip title={cellValue}>
        <Box component="span" sx={{ 'white-space': 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {cellValue}
        </Box>
      </Tooltip>
    );
  };
  /**
   * Build material react data table column header.
   *
   * @param {object} data.fieldAliases object values transformed into required key value property of material react data table
   */
  const columns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
    const entries = Object.entries({ ICON: iconColumn, ZOOM: zoomColumn, ...data.fieldAliases });
    const columnList = [] as MRTColumnDef<ColumnsType>[];
    entries.forEach(([key, value]) => {
      columnList.push({
        accessorKey: key,
        header: value.alias,
        Header: ({ column }) => getTableHeader(column.columnDef.header),
        Cell: ({ cell }) => getCellValueWithTooltip(cell.getValue() as string),
        ...([t('dataTable.icon'), t('dataTable.zoom')].includes(value.alias) && { size: 100, enableColumnFilter: false }),
      });
    });

    return columnList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * featureinfo data grid Zoom in/out handling
   *
   * @param {React.MouseEvent<HTMLButtonElement, MouseEvent>} e mouse clicking event
   * @param {Extent} extent feature exten
   *
   */
  const handleZoomIn = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, extent: Extent) => {
    api.maps[mapId].zoomToExtent(extent);
  };

  /**
   * Build Rows for datatable
   *
   * @param {Features} features list of objects transform into rows.
   */
  const rows = useMemo(() => {
    return filteredData.map((feature) => {
      return {
        ICON: <img alt={feature.featureIcon.toDataURL().toString()} src={feature.featureIcon.toDataURL().toString()} style={iconImage} />,
        ZOOM: (
          <IconButton color="primary" onClick={(e) => handleZoomIn(e, feature.extent!)}>
            <ZoomInSearchIcon />
          </IconButton>
        ),
        ...feature.rows,
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
        onRowSelectionChange={setRowSelection}
        initialState={{
          columnPinning: { left: [t('dataTable.icon'), t('dataTable.zoom')] },
          density: 'compact',
          pagination: { pageSize: 10, pageIndex: 0 },
        }}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        state={{ sorting, columnFilters, rowSelection }}
        renderToolbarInternalActions={({ table }) => (
          <Box>
            <MRTToggleFiltersButton table={table} />
            <FilterMap mapFiltered={mapFiltered} setMapFiltered={setMapFiltered} />
            <MRTShowHideColumnsButton table={table} />
            <MRTToggleDensePaddingButton table={table} />
            <MRTFullScreenToggleButton table={table} />
            <ExportButton rows={rows} columns={columns}>
              <JSONExportButton features={data.features} layerId={layerId} projectionConfig={projectionConfig} />
            </ExportButton>
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
        rowVirtualizerInstanceRef={rowVirtualizerInstanceRef}
        rowVirtualizerProps={{ overscan: 5 }}
        columnVirtualizerProps={{ overscan: 2 }}
        muiTableBodyProps={{
          sx: (theme) => ({
            // stripe style of table
            '& tr:nth-of-type(odd)': {
              backgroundColor: darken(theme.palette.background.default, 0.1),
            },
            '& tr:hover > td': {
              backgroundColor: '#00ffff14',
            },
            '& td': {
              backgroundColor: 'inherit',
            },
          }),
        }}
      />
    </Box>
  );
}

export default MapDataTable;
