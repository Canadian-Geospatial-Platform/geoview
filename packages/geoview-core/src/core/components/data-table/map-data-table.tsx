import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import debounce from 'lodash/debounce';
import startCase from 'lodash/startCase';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

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
  type MRT_Column as MRTColumn,
  type MRT_TableInstance as MRTTableInstance,
  type MRT_Localization as MRTLocalization,
  type MRT_DensityState as MRTDensityState,
} from 'material-react-table';
import { Projection } from 'ol/proj';
import { Extent } from 'ol/extent';
import { darken, useTheme } from '@mui/material';
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
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { getSxClasses } from './data-table-style';

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

const DATE_FILTER: Record<string, string> = {
  greaterThan: `> date 'value'`,
  greaterThanOrEqualTo: `>= date 'value'`,
  lessThan: `< date 'value'`,
  lessThanOrEqualTo: `<= date 'value'`,
  equals: `= date 'value'`,
  empty: 'is null',
  notEmpty: 'is not null',
  notEquals: `<> date 'value'`,
  between: `> date 'value'`,
  betweenInclusive: `>= date 'value'`,
};

const STRING_FILTER: Record<string, string> = {
  contains: `(filterId) like ('%value%')`,
  startsWith: `(filterId) like ('value%')`,
  endsWith: `(filterId) like ('%value')`,
  empty: '(filterId) is null',
  notEmpty: '(filterId) is not null',
  equals: `filterId = 'value'`,
  notEquals: `filterId <> 'value'`,
};

const NUMBER_FILTER: Record<string, string> = {
  lessThanOrEqualTo: '<=',
  lessThan: '<',
  greaterThan: '>',
  greaterThanOrEqualTo: '>=',
  empty: 'is null',
  notEmpty: 'is not null',
  between: '>',
  betweenInclusive: '>=',
  equals: '=',
  notEquals: '<>',
};

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
  const { t } = useTranslation();
  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  const language = api.maps[mapId].displayLanguage;

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  const tableInstanceRef = useRef<MRTTableInstance>(null);

  const iconColumn = { alias: t('dataTable.icon'), dataType: 'string', id: t('dataTable.icon') };
  const zoomColumn = { alias: t('dataTable.zoom'), dataType: 'string', id: t('dataTable.zoom') };

  const store = getGeoViewStore(mapId);
  const {
    FILTER_MAP_DELAY,
    toolbarRowSelectedMessage,
    setToolbarRowSelectedMessage,
    storeColumnFilters,
    setStoreColumnFilters,
    storeRowSelections,
    setStoreRowSelections,
    storeMapFiltered,
  } = useStore(store, (state) => state.dataTableState);
  const rowSelectionRef = useRef<Array<number>>([]);

  const [columnFilters, setColumnFilters] = useState<MRTColumnFiltersState>(storeColumnFilters[layerKey] || []);

  const [density, setDensity] = useState<MRTDensityState>('compact');
  const [rowSelection, setRowSelection] = useState<Record<number, boolean>>(storeRowSelections[layerKey] ?? {});
  const rowVirtualizerInstanceRef = useRef<MRTVirtualizer<HTMLDivElement, HTMLTableRowElement>>(null);
  const [sorting, setSorting] = useState<MRTSortingState>([]);

  /**
   * Convert the filter list from the Column Filter
   *
   * @param {MRTColumnFiltersState} columnFilter list of filter from table.
   */
  const buildFilterList = useCallback((columnFilter: MRTColumnFiltersState) => {
    const tableState = tableInstanceRef?.current?.getState();

    if (!columnFilter.length) return [''];
    return columnFilter.map((filter) => {
      const filterValue = filter.value;
      const filterId = filter.id;
      // Check if filterValue is of type array because columnfilters return array with min and max.
      if (Array.isArray(filterValue)) {
        let numQuery = '';
        const minValue = Number(filterValue[0]);
        const maxValue = Number(filterValue[1]);

        const numOpr = tableState?.columnFilterFns[filterId] as string;

        const numFilter = NUMBER_FILTER[numOpr] ?? '=';

        if (minValue && maxValue) {
          const opr2 = numFilter === '>' ? '<' : '<=';
          numQuery = `${filterId} ${numFilter} ${filterValue[0]} and ${filterId} ${opr2} ${filterValue[1]}`;
        } else if (minValue) {
          numQuery = `${filterId} ${numFilter} ${filterValue[0]}`;
        } else if (maxValue) {
          numQuery = `${filterId} ${numFilter} ${filterValue[1]}`;
        }
        return numQuery;
      }

      // Check filter value is of type date,
      if (typeof filterValue === 'object' && filterValue) {
        const dateOpr = tableState?.columnFilterFns[filterId] || 'equals';
        const dateFilter = DATE_FILTER[dateOpr] as string;
        const date = api.dateUtilities.applyInputDateFormat(`${(filterValue as Date).toISOString().slice(0, -5)}Z`);
        const formattedDate = date.slice(0, -1);
        return `${filterId} ${dateFilter.replace('value', formattedDate)}`;
      }
      const operator = tableState?.columnFilterFns[filterId] ?? 'contains';

      const strFilter = STRING_FILTER[operator] as string;

      return `${strFilter.replace('filterId', filterId).replace('value', filterValue as string)}`;
    });
  }, []);

  /**
   * Filter map based on the filter strings of data table.
   *
   * @param {Array} filterStrings list of filter strings.
   */
  const filterMap = debounce((filters: MRTColumnFiltersState) => {
    const filterStrings = buildFilterList(filters)
      .filter((filterValue) => filterValue.length)
      .join(' and ');

    const geoviewLayerInstance = api.maps[mapId].layer.geoviewLayers[layerId];
    const filterLayerConfig = api.maps[mapId].layer.registeredLayers[layerKey] as TypeLayerEntryConfig;

    if (storeMapFiltered[layerKey] && geoviewLayerInstance !== undefined && filterLayerConfig !== undefined && filterStrings.length) {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, filterStrings);
    } else {
      (geoviewLayerInstance as AbstractGeoViewVector | EsriDynamic)?.applyViewFilter(filterLayerConfig, '');
    }
  }, FILTER_MAP_DELAY);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedColumnFilters = useCallback((filters: MRTColumnFiltersState) => filterMap(filters), [storeMapFiltered[layerKey]]);

  useEffect(() => {
    // scroll to the top of the table when the sorting changes
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [sorting]);

  // update store column filters
  useEffect(() => {
    setStoreColumnFilters(columnFilters, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  // update store row selections.
  useEffect(() => {
    setStoreRowSelections(rowSelection, layerKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // update map when column filters change
  useEffect(() => {
    if (columnFilters && storeMapFiltered[layerKey]) {
      debouncedColumnFilters(columnFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  // Update map when filter map switch is toggled.
  useEffect(() => {
    filterMap(columnFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeMapFiltered[layerKey]]);

  // add/remove hightlight feature when row is selected/unselected.
  useEffect(() => {
    const selectedRows = Object.keys(rowSelection).map((key) => Number(key));

    const addAnimationRowIds = difference(selectedRows, rowSelectionRef.current);

    addAnimationRowIds.forEach((idx) => {
      const row = data.features[Number(idx)];
      if (row) {
        api.event.emit(featureHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_FEATURE, mapId, row));
      }
    });

    const removeAnimationRowIds = difference(rowSelectionRef.current, selectedRows);
    removeAnimationRowIds.forEach((id) => {
      const feature = data.features[Number(id)];
      const featureUid = getUid(feature.geometry);
      api.event.emit(clearHighlightsPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_CLEAR, mapId, featureUid));
    });

    rowSelectionRef.current = selectedRows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // show row selected message in the toolbar.
  useEffect(() => {
    let message = '';
    if (Object.keys(rowSelection).length && tableInstanceRef.current) {
      message = t('dataTable.rowsSelected')
        .replace('{rowsSelected}', Object.keys(rowSelection).length.toString())
        .replace('{totalRows}', tableInstanceRef.current.getFilteredRowModel().rows.length.toString());
    } else if (tableInstanceRef.current && tableInstanceRef.current.getFilteredRowModel().rows.length !== data.features.length) {
      message = t('dataTable.rowsFiltered')
        .replace('{rowsFiltered}', tableInstanceRef.current.getFilteredRowModel().rows.length.toString())
        .replace('{totalRows}', data.features.length.toString());
    }
    setToolbarRowSelectedMessage(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, data.features]);

  // show row filtered message in the toolbar.
  useEffect(() => {
    let message = '';
    if (tableInstanceRef.current) {
      const rowsFiltered = tableInstanceRef.current.getFilteredRowModel();
      if (rowsFiltered.rows.length !== data.features.length) {
        message = t('dataTable.rowsFiltered')
          .replace('{rowsFiltered}', rowsFiltered.rows.length.toString())
          .replace('{totalRows}', data.features.length.toString());
      }
    }
    setToolbarRowSelectedMessage(message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, data.features]);

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
   *
   * @param {string} cellValue cell value to be displayed in cell
   * @returns JSX.Element
   */
  const getCellValueWithTooltip = (cellValue: string) => {
    return (
      <Tooltip title={cellValue}>
        <Box component="span" sx={density === 'compact' ? sxClasses.tableCell : {}}>
          {cellValue}
        </Box>
      </Tooltip>
    );
  };

  /**
   * Create Date filter with Datepicker.
   *
   * @param {MRTColumn<ColumnsType>} column filter column.
   * @returns JSX.Element
   */
  const getDateFilter = (column: MRTColumn<ColumnsType>) => {
    // eslint-disable-next-line no-underscore-dangle
    const filterFn = startCase(column.columnDef._filterFn).replaceAll(' ', '');
    const key = `filter${filterFn}` as keyof MRTLocalization;
    const filterFnKey = dataTableLocalization[key];
    const helperText = dataTableLocalization.filterMode.replace('{filterType}', filterFnKey);
    return (
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
        <DatePicker
          timezone="UTC"
          format="YYYY/MM/DD"
          onChange={(newValue) => {
            column.setFilterValue(newValue);
          }}
          slotProps={{
            textField: {
              placeholder: language === 'fr' ? 'AAAA/MM/JJ' : 'YYYY/MM/DD',
              helperText,
              sx: { minWidth: '120px', width: '100%' },
              variant: 'standard',
            },
          }}
        />
      </LocalizationProvider>
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
        id: key,
        accessorFn: (row) => row[key] ?? '',
        header: value.alias,
        filterFn: 'contains',
        columnFilterModeOptions: ['contains', 'startsWith', 'endsWith', 'empty', 'notEmpty'],
        ...(value.dataType === 'number' && {
          filterFn: 'between',
          columnFilterModeOptions: [
            'equals',
            'notEquals',
            'between',
            'betweenInclusive',
            'lessThan',
            'greaterThan',
            'lessThanOrEqualTo',
            'greaterThanOrEqualTo',
            'empty',
            'notEmpty',
          ],
        }),

        Header: ({ column }) => getTableHeader(column.columnDef.header),
        Cell: ({ cell }) => getCellValueWithTooltip(cell.getValue() as string),
        ...(value.dataType === 'date' && {
          accessorFn: (row) => new Date(row[key]),
          sortingFn: 'datetime',
          Cell: ({ cell }) => api.dateUtilities.formatDate(cell.getValue<Date>(), 'YYYY-MM-DDThh:mm:ss'),
          Filter: ({ column }) => getDateFilter(column),
          filterFn: 'equals',
          columnFilterModeOptions: [
            'equals',
            'notEquals',
            'between',
            'betweenInclusive',
            'lessThan',
            'greaterThan',
            'lessThanOrEqualTo',
            'greaterThanOrEqualTo',
            'empty',
            'notEmpty',
          ],
        }),
        ...([t('dataTable.icon'), t('dataTable.zoom')].includes(value.alias) ? { size: 100, enableColumnFilter: false } : {}),
      });
    });

    return columnList;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density]);

  /**
   * featureinfo data table Zoom in/out handling
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
    return data.features.map((feature) => {
      return {
        ICON: (
          <img
            alt={feature.featureIcon.toDataURL().toString()}
            src={feature.featureIcon.toDataURL().toString()}
            style={sxClasses.iconImage as React.CSSProperties}
          />
        ),
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
    <Box sx={sxClasses.dataTableWrapper}>
      <MaterialReactTable
        columns={columns as MRTColumnDef[]}
        data={rows}
        enableGlobalFilter={false}
        enableRowSelection
        onRowSelectionChange={setRowSelection}
        enableDensityToggle
        onDensityChange={setDensity}
        initialState={{
          showColumnFilters: !!columnFilters.length,
        }}
        state={{ sorting, columnFilters, rowSelection, density, columnPinning: { left: ['ICON', 'ZOOM'] } }}
        enableColumnFilterModes
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        enableBottomToolbar={false}
        positionToolbarAlertBanner="none" // hide existing row count
        renderTopToolbarCustomActions={() => {
          return <Box sx={sxClasses.selectedRows}>{toolbarRowSelectedMessage}</Box>;
        }}
        renderToolbarInternalActions={({ table }) => (
          <Box>
            <MRTToggleFiltersButton table={table} />
            <FilterMap layerKey={layerKey} mapId={mapId} />
            <MRTShowHideColumnsButton table={table} />
            <MRTToggleDensePaddingButton table={table} />
            <MRTFullScreenToggleButton table={table} />
            <ExportButton rows={rows} columns={columns}>
              <JSONExportButton features={data.features} layerId={layerId} projectionConfig={projectionConfig} />
            </ExportButton>
          </Box>
        )}
        tableInstanceRef={tableInstanceRef}
        enableFilterMatchHighlighting
        enableColumnResizing
        enableColumnVirtualization
        enablePagination={false}
        enablePinning
        enableRowVirtualization
        muiTableContainerProps={{ sx: { maxHeight: '600px' } }}
        rowVirtualizerInstanceRef={rowVirtualizerInstanceRef}
        rowVirtualizerProps={{ overscan: 5 }}
        columnVirtualizerProps={{ overscan: 2 }}
        localization={dataTableLocalization}
        muiTableHeadCellFilterTextFieldProps={{
          sx: () => ({
            minWidth: '50px',
          }),
        }}
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

export default memo(MapDataTable);
