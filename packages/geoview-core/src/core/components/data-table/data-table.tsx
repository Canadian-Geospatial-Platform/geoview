/* eslint-disable @typescript-eslint/no-unused-vars */
import { useCallback, useEffect, useMemo, useRef, useState, memo, ReactNode, isValidElement } from 'react';

import { useTranslation } from 'react-i18next';

import debounce from 'lodash/debounce';
import startCase from 'lodash/startCase';
import { difference } from 'lodash';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

import { Extent } from 'ol/extent'; // only for typing

import { darken } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef as MRTColumnDef,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
  MRT_ShowHideColumnsButton as MRTShowHideColumnsButton,
  MRT_ToggleFiltersButton as MRTToggleFiltersButton,
  MRT_ToggleFullScreenButton as MRTFullScreenToggleButton,
  type MRT_SortingState as MRTSortingState,
  type MRT_RowVirtualizer as MRTRowVirtualizer,
  type MRT_ColumnFiltersState as MRTColumnFiltersState,
  type MRT_Column as MRTColumn,
  type MRT_Localization as MRTLocalization,
  type MRT_DensityState as MRTDensityState,
  Box,
  Button,
  IconButton,
  Tooltip,
  ZoomInSearchIcon,
} from '@/ui';
import ExportButton from './export-button';
import JSONExportButton from './json-export-button';
import FilterMap from './filter-map';
import { AbstractGeoViewVector, TypeLayerEntryConfig, api, TypeFieldEntry, TypeFeatureInfoEntry, isImage, EsriDynamic } from '@/app';
import { getSxClasses } from './data-table-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useDataTableStoreActions,
  useDataTableStoreMapFilteredRecord,
  useDataTableStoreToolbarRowSelectedMessageRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useLightBox, useSelectedRows, useFilterRows, useToolbarActionMessage } from './hooks';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';
import { MappedLayerDataType } from './data-panel';

export interface FieldInfos {
  alias: string;
  dataType: string;
  domain?: string;
  fieldKey: number;
  value: string | null;
}

export interface ColumnsType {
  ICON: FieldInfos;
  ZOOM: FieldInfos;
  [key: string]: FieldInfos;
}

interface DataTableProps {
  data: MappedLayerDataType;
  layerPath: string;
  tableHeight: number;
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
 * @param {DataTableProps} data map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {number} tableHeight Height of the container which contains all rows.
 * @return {ReactElement} Data table as react element.
 */

function DataTable({ data, layerPath, tableHeight = 600 }: DataTableProps) {
  const { t } = useTranslation();

  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  // get store actions and values
  const { addHighlightedFeature, removeHighlightedFeature, zoomToExtent } = useMapStoreActions();
  const { applyMapFilters } = useDataTableStoreActions();
  const language = useAppDisplayLanguage();

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  const iconColumn = { alias: t('dataTable.icon'), dataType: 'string', id: t('dataTable.icon') };
  const zoomColumn = { alias: t('dataTable.zoom'), dataType: 'string', id: t('dataTable.zoom') };

  const toolbarRowSelectedMessageRecord = useDataTableStoreToolbarRowSelectedMessageRecord();

  const mapFilteredRecord = useDataTableStoreMapFilteredRecord();

  const [density, setDensity] = useState<MRTDensityState>('compact');
  const rowVirtualizerInstanceRef = useRef<MRTRowVirtualizer>(null);

  const [sorting, setSorting] = useState<MRTSortingState>([]);

  const rowSelectionRef = useRef<Array<number>>([]);

  // #region REACT CUSTOM HOOKS
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { rowSelection, setRowSelection } = useSelectedRows({ layerPath });
  const { columnFilters, setColumnFilters } = useFilterRows({ layerPath });
  // #endregion

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - sorting', sorting);

    // scroll to the top of the table when the sorting changes
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  }, [sorting]);

  /**
   * Create table header cell
   * @param {string} header value to be displayed in cell
   * @returns JSX.Element
   */
  const getTableHeader = useCallback((header: string) => {
    // Log
    logger.logTraceUseCallback('DATA-TABLE - getTableHeader');

    return (
      <Tooltip title={header} placement="top" arrow>
        <Box component="span" sx={{ whiteSpace: 'nowrap' }}>
          {header}
        </Box>
      </Tooltip>
    );
  }, []);

  /**
   * Create image button which will trigger lightbox.
   * @param {string | number | ReactNode} cellValue value to be rendered in cell.
   * @param {string} cellId id of the column.
   * @returns
   */
  const createLightBoxButton = (cellValue: string | number | ReactNode, cellId: string) => {
    if (typeof cellValue === 'string' && isImage(cellValue)) {
      return (
        <Button
          type="text"
          size="small"
          onClick={() => initLightBox(cellValue, cellId)}
          sx={{ height: '2.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem', textTransform: 'none' }}
        >
          {t('dataTable.images')}
        </Button>
      );
    }
    return cellValue;
  };

  /**
   * Create data table body cell with tooltip
   *
   * @param {string | number | ReactNode} cellValue cell value to be displayed in cell
   * @returns JSX.Element
   */
  const getCellValueWithTooltip = (cellValue: string | number | ReactNode, cellId: string) => {
    return typeof cellValue === 'string' || typeof cellValue === 'number' ? (
      <Tooltip title={cellValue} placement="top" arrow>
        <Box component="span" sx={density === 'compact' ? sxClasses.tableCell : {}}>
          {createLightBoxButton(cellValue, cellId)}
        </Box>
      </Tooltip>
    ) : (
      <Box component="span" sx={density === 'compact' ? sxClasses.tableCell : {}}>
        {cellValue}
      </Box>
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
   * Custom date type Column tooltip
   * @param {Date} date value to be shown in column.
   * @returns JSX.Element
   */
  const getDateColumnTooltip = (date: Date) => {
    return (
      <Tooltip title={api.dateUtilities.formatDate(date, 'YYYY-MM-DDThh:mm:ss')} arrow>
        <Box>{api.dateUtilities.formatDate(date, 'YYYY-MM-DDThh:mm:ss')}</Box>
      </Tooltip>
    );
  };

  /**
   * Build material react data table column header.
   *
   * @param {object} data.fieldAliases object values transformed into required key value property of material react data table
   */
  const columns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - columns', density);

    const entries = Object.entries({ ICON: iconColumn, ZOOM: zoomColumn, ...data.fieldInfos });
    const columnList = [] as MRTColumnDef<ColumnsType>[];
    entries.forEach(([key, value]) => {
      columnList.push({
        id: key,
        accessorFn: (row) => {
          // check if row is valid react element.
          if (isValidElement(row[key])) {
            return row[key];
          }
          return row[key].value ?? '';
        },
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
        Cell: ({ cell }) => getCellValueWithTooltip(cell.getValue() as string | number | ReactNode, cell.id),
        ...(value.dataType === 'date' && {
          accessorFn: (row) => new Date(row[key].value as string),
          sortingFn: 'datetime',
          Cell: ({ cell }) => getDateColumnTooltip(cell.getValue<Date>()),
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
        ...([t('dataTable.icon'), t('dataTable.zoom')].includes(value.alias)
          ? { size: 100, enableColumnFilter: false, enableColumnActions: false, enableSorting: false, enableResizing: false }
          : {}),
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
    zoomToExtent(extent);
  };

  /**
   * Build Rows for datatable
   *
   * @param {Features} features list of objects transform into rows.
   */
  const rows = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - rows', data.features);

    return (data?.features ?? []).map((feature) => {
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
        ...feature.fieldInfo,
      };
    }) as unknown as ColumnsType[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useTable = useMaterialReactTable({
    columns,
    data: rows,
    enableGlobalFilter: false,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    enableDensityToggle: true,
    onDensityChange: setDensity,
    initialState: { showColumnFilters: !!columnFilters.length },
    state: { sorting, columnFilters, rowSelection, density, columnPinning: { left: ['ICON', 'ZOOM'] } },
    enableColumnFilterModes: true,
    enableColumnPinning: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableBottomToolbar: false,
    positionToolbarAlertBanner: 'none', // hide existing row count
    renderTopToolbarCustomActions: () => {
      // show rowSelection/Filter message on top-left corner of the table
      return <Box sx={sxClasses.selectedRows}>{toolbarRowSelectedMessageRecord[layerPath]}</Box>;
    },
    renderToolbarInternalActions: ({ table }) => (
      <Box>
        <MRTToggleFiltersButton table={table} />
        <FilterMap layerPath={layerPath} />
        <MRTShowHideColumnsButton table={table} />
        <MRTToggleDensePaddingButton table={table} />
        <MRTFullScreenToggleButton table={table} />
        <ExportButton rows={rows} columns={columns}>
          <JSONExportButton features={data.features as TypeFeatureInfoEntry[]} layerPath={layerPath} />
        </ExportButton>
      </Box>
    ),
    enableFilterMatchHighlighting: true,
    enableColumnResizing: true,
    enableColumnVirtualization: true,
    enablePagination: false,
    enableRowVirtualization: true,
    muiTableContainerProps: { sx: { maxHeight: `${tableHeight - 60}px` } },
    rowVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 5 },
    columnVirtualizerOptions: { overscan: 2 },
    localization: dataTableLocalization,
    muiTableHeadCellProps: {
      sx: () => sxClasses.tableHeadCell,
    },
    // override z-index of table when table is in fullscreen mode
    muiTablePaperProps: ({ table }) => ({
      style: {
        zIndex: table.getState().isFullScreen ? 999999 : undefined,
      },
    }),
    muiFilterTextFieldProps: {
      sx: () => ({
        minWidth: '50px',
      }),
    },
    muiTableBodyProps: {
      sx: (theme) => ({
        // stripe the rows, make odd rows a darker color
        '& tr:nth-of-type(odd) > td': {
          backgroundColor: `${darken(theme.palette.background.default, 0.1)}`,
        },
        '& tr:hover > td': {
          backgroundColor: theme.palette.secondary.light,
        },
        '& .Mui-selected > td': {
          backgroundColor: theme.palette.secondary.light,
        },
      }),
    },
  });

  // add/remove hightlight feature when row is selected/unselected.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - rowSelection', rowSelection);

    const selectedRows = Object.keys(rowSelection).map((key) => Number(key));
    const addAnimationRowIds = difference(selectedRows, rowSelectionRef.current);

    addAnimationRowIds.forEach((idx) => {
      const feature = data?.features ? data.features[idx] : null;

      if (feature && mapFilteredRecord[layerPath]) {
        addHighlightedFeature(feature);
      }
    });
    const removeAnimationRowIds = difference(rowSelectionRef.current, selectedRows);
    removeAnimationRowIds.forEach((idx) => {
      const feature = data?.features ? data.features[idx] : null;
      if (feature && mapFilteredRecord[layerPath]) {
        removeHighlightedFeature(feature);
      }
    });

    rowSelectionRef.current = selectedRows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection, mapFilteredRecord]);

  /**
   * Convert the filter list from the Column Filter state to filter the map.
   *
   * @param {MRTColumnFiltersState} columnFilter list of filter from table.
   */
  const buildFilterList = useCallback((columnFilter: MRTColumnFiltersState) => {
    const tableState = useTable!.getState();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    applyMapFilters(filterStrings);
  }, 1000);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedColumnFilters = useCallback((filters: MRTColumnFiltersState) => filterMap(filters), [mapFilteredRecord[layerPath]]);

  // update map when column filters change
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - columnFilters', columnFilters);

    if (columnFilters && mapFilteredRecord[layerPath]) {
      debouncedColumnFilters(columnFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  // Update map when filter map switch is toggled.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - mapFilteredRecord', mapFilteredRecord[layerPath]);

    filterMap(columnFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapFilteredRecord[layerPath]]);

  // set toolbar custom action message in store.
  useToolbarActionMessage({ data, rowSelection, columnFilters, layerPath, tableInstance: useTable });

  return (
    <Box sx={sxClasses.dataTableWrapper}>
      <MaterialReactTable table={useTable} />
      <LightBoxComponent />
    </Box>
  );
}

export default memo(DataTable);
