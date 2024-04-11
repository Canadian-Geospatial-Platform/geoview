import { useCallback, useEffect, useMemo, useRef, useState, memo, ReactNode, isValidElement } from 'react';

import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';
import startCase from 'lodash/startCase';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

import { Extent } from 'ol/extent'; // only for typing

import { useTheme } from '@mui/material/styles';
import { HtmlToReact } from '@/core/containers/html-to-react';

import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef as MRTColumnDef,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
  MRT_ShowHideColumnsButton as MRTShowHideColumnsButton,
  MRT_ToggleFiltersButton as MRTToggleFiltersButton,
  MRT_ToggleFullScreenButton as MRTFullScreenToggleButton,
  MRT_GlobalFilterTextField as MRTGlobalFilterTextField,
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
  InfoOutlinedIcon,
} from '@/ui';
import { api } from '@/app';

import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';

import { logger } from '@/core/utils/logger';
import { TypeFeatureInfoEntry } from '@/geo/utils/layer-set';
import { MappedLayerDataType } from './data-panel';
import { useLightBox, useFilterRows, useToolbarActionMessage, useGlobalFilter } from './hooks';
import { getSxClasses } from './data-table-style';
import ExportButton from './export-button';
import JSONExportButton from './json-export-button';
import FilterMap from './filter-map';
import { isImage } from '@/core/utils/utilities';

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

  // internal state
  const [density, setDensity] = useState<MRTDensityState>('compact');
  const rowVirtualizerInstanceRef = useRef<MRTRowVirtualizer>(null);
  const [sorting, setSorting] = useState<MRTSortingState>([]);

  // get store actions and values
  const { zoomToExtent } = useMapStoreActions();
  const { applyMapFilters, setSelectedFeature } = useDataTableStoreActions();
  const language = useAppDisplayLanguage();
  const datatableSettings = useDataTableLayerSettings();

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  // #region PINNED Datatable columns
  const iconColumn = { alias: t('dataTable.icon'), dataType: 'string', id: t('dataTable.icon') };
  const zoomColumn = { alias: t('dataTable.zoom'), dataType: 'string', id: t('dataTable.zoom') };
  const detailColumn = { alias: t('dataTable.details'), dataType: 'string', id: t('dataTable.details') };
  // #endregion

  // #region REACT CUSTOM HOOKS
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { columnFilters, setColumnFilters } = useFilterRows({ layerPath });
  const { globalFilter, setGlobalFilter } = useGlobalFilter({ layerPath });
  // #endregion

  const { openModal } = useUIStoreActions();

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
    // convert string to react component.
    return typeof cellValue === 'string' ? <HtmlToReact htmlContent={cellValue} /> : cellValue;
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
      <Tooltip title={api.utilities.date.formatDate(date, 'YYYY-MM-DDThh:mm:ss')} arrow>
        <Box>{api.utilities.date.formatDate(date, 'YYYY-MM-DDThh:mm:ss')}</Box>
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

    const entries = Object.entries({ ICON: iconColumn, ZOOM: zoomColumn, DETAILS: detailColumn, ...data.fieldInfos });
    const columnList = [] as MRTColumnDef<ColumnsType>[];
    entries.forEach(([key, value]) => {
      columnList.push({
        id: key,
        accessorFn: (row) => {
          // check if row is valid react element.
          if (isValidElement(row[key])) {
            return row[key];
          }
          if (typeof row[key]?.value === 'string' || typeof row[key]?.value === 'number') {
            return row[key]?.value ?? '';
          }
          return '';
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
        ...([t('dataTable.icon'), t('dataTable.zoom'), t('dataTable.details')].includes(value.alias)
          ? {
              size: 70,
              enableColumnFilter: false,
              enableColumnActions: false,
              enableSorting: false,
              enableResizing: false,
              enableGlobalFilter: false,
            }
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
  const handleZoomIn = useCallback(
    (extent: Extent) => {
      zoomToExtent(extent);
    },
    [zoomToExtent]
  );

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
          <Box
            component="img"
            alt={feature.featureIcon.toDataURL().toString()}
            src={feature.featureIcon.toDataURL().toString()}
            className="layer-icon"
          />
        ),
        ZOOM: (
          <IconButton color="primary" onClick={() => handleZoomIn(feature.extent!)}>
            <ZoomInSearchIcon />
          </IconButton>
        ),
        DETAILS: (
          <Box marginLeft="0.3rem">
            <IconButton
              color="primary"
              onClick={() => {
                setSelectedFeature(feature);
                openModal({ activeElementId: 'featureDetailDataTable', callbackElementId: 'table-details' });
              }}
            >
              <InfoOutlinedIcon />
            </IconButton>
          </Box>
        ),
        ...feature.fieldInfo,
      };
    }) as unknown as ColumnsType[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.features, handleZoomIn]);

  const useTable = useMaterialReactTable({
    columns,
    data: rows,
    enableDensityToggle: true,
    onDensityChange: setDensity,
    // NOTE: showGlobalFilter as true when layer change and we want to show global filter by default
    initialState: { showColumnFilters: !!columnFilters.length, showGlobalFilter: true },
    state: {
      sorting,
      columnFilters,
      density,
      columnPinning: { left: ['ICON', 'ZOOM', 'DETAILS'] },
      globalFilter,
    },
    enableColumnFilterModes: true,
    enableColumnPinning: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    enableBottomToolbar: false,
    positionToolbarAlertBanner: 'none', // hide existing row count
    renderTopToolbar: ({ table }) => (
      <Box display="flex" justifyContent="space-between" p={4}>
        <Box>
          <Box sx={sxClasses.selectedRows}>{datatableSettings[layerPath].toolbarRowSelectedMessageRecord}</Box>
        </Box>
        <Box>
          <Box>
            <MRTToggleFiltersButton className="style1" table={table} />
            <FilterMap layerPath={layerPath} isGlobalFilterOn={!!globalFilter?.length} />
            <MRTShowHideColumnsButton className="style1" table={table} />
            <MRTToggleDensePaddingButton className="style1" table={table} />
            <MRTFullScreenToggleButton className="style1" table={table} />
            <ExportButton rows={rows} columns={columns}>
              <JSONExportButton features={data.features as TypeFeatureInfoEntry[]} layerPath={layerPath} />
            </ExportButton>
          </Box>
          <Box sx={{ marginLeft: 'auto', maxWidth: '15rem', marginRight: '1rem' }}>
            <MRTGlobalFilterTextField className="style1" table={table} />
          </Box>
        </Box>
      </Box>
    ),
    enableFilterMatchHighlighting: true,
    enableColumnResizing: true,
    enableColumnVirtualization: true,
    enablePagination: false,
    enableRowVirtualization: true,
    muiTableContainerProps: { sx: { maxHeight: `${tableHeight - 75}px` } },
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
          backgroundColor: theme.palette.geoViewColor.bgColor.darken(0.1),
        },
        '& tr:hover > td': {
          backgroundColor: theme.palette.secondary.light,
        },
        '& .Mui-selected > td': {
          backgroundColor: `${theme.palette.secondary.light} !important`,
        },
      }),
    },
  });

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - sorting', sorting);

    // update scroll index when there are some rows in the table.
    const rowsCount = useTable!.getRowCount();
    // scroll to the top of the table when the sorting changes
    try {
      if (rowsCount > 0) {
        rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
      }
    } catch (error) {
      logger.logError('Data table error on sorting action', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

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
        const minValue = filterValue[0] === '' ? undefined : Number(filterValue[0]);
        const maxValue = filterValue[1] === '' ? undefined : Number(filterValue[1]);
        const inclusive = tableState?.columnFilterFns[filterId] === 'betweenInclusive' ? '=' : '';

        if (minValue && maxValue) {
          numQuery = `${filterId} >${inclusive} ${minValue} and ${filterId} <${inclusive} ${maxValue}`;
        } else if (minValue) {
          numQuery = `${filterId} >${inclusive} ${minValue}`;
        } else if (maxValue) {
          numQuery = `${filterId} <${inclusive} ${maxValue}`;
        }
        return numQuery;
      }

      if (!Number.isNaN(Number(filterValue))) {
        return `${filterId} ${NUMBER_FILTER[tableState?.columnFilterFns[filterId]]} ${Number(filterValue)}`;
      }

      if (tableState?.columnFilterFns[filterId] === 'empty') return `${filterId} is null`;
      if (tableState?.columnFilterFns[filterId] === 'notEmpty') return `${filterId} is not null`;

      // Check filter value is of type date,
      if (typeof filterValue === 'object' && filterValue) {
        const dateOpr = tableState?.columnFilterFns[filterId] || 'equals';
        const dateFilter = DATE_FILTER[dateOpr] as string;
        const date = api.utilities.date.applyInputDateFormat(`${(filterValue as Date).toISOString().slice(0, -5)}Z`);
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
  const debouncedColumnFilters = useCallback(
    (filters: MRTColumnFiltersState) => filterMap(filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datatableSettings[layerPath].mapFilteredRecord]
  );

  // update map when column filters change
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - columnFilters', columnFilters);

    if (columnFilters && datatableSettings[layerPath].mapFilteredRecord) {
      debouncedColumnFilters(columnFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  // Update map when filter map switch is toggled.
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - mapFilteredRecord', datatableSettings[layerPath].mapFilteredRecord);

    filterMap(columnFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datatableSettings[layerPath].mapFilteredRecord]);

  // set toolbar custom action message in store.
  useToolbarActionMessage({ data, columnFilters, globalFilter, layerPath, tableInstance: useTable });

  return (
    <Box sx={sxClasses.dataTableWrapper}>
      <MaterialReactTable table={useTable} />
      <LightBoxComponent />
    </Box>
  );
}

export default memo(DataTable);
