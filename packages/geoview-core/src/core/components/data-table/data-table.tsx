import { useCallback, useEffect, useMemo, useRef, useState, memo, isValidElement, type ReactNode } from 'react';

import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';

import { getCenter } from 'ol/extent'; // only for typing

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

import { useTheme } from '@mui/material/styles';
import { HtmlToReact } from '@/core/containers/html-to-react';

import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef as MRTColumnDef,
  type MRT_SortingState as MRTSortingState,
  type MRT_RowVirtualizer as MRTRowVirtualizer,
  type MRT_ColumnFiltersState as MRTColumnFiltersState,
  type MRT_DensityState as MRTDensityState,
  type MRT_ColumnVirtualizer as MRTColumnVirtualizer,
  type MRT_TableInstance as MRTTableInstance,
  Box,
  Button,
  IconButton,
  Tooltip,
  ZoomInSearchIcon,
  InfoOutlinedIcon,
} from '@/ui';

import TopToolbar from './top-toolbar';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { DateMgt } from '@/core/utils/date-mgt';
import { isImage, delay } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { useFilterRows, useToolbarActionMessage, useGlobalFilter } from './hooks';
import { getSxClasses } from './data-table-style';
import { useLightBox } from '@/core/components/common';
import { NUMBER_FILTER, DATE_FILTER, STRING_FILTER } from '@/core/utils/constant';
import { DataTableProps, ColumnsType } from './data-table-types';
import { VALID_DISPLAY_LANGUAGE } from '@/api/config/types/config-constants';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

/**
 * Build Data table from map.
 * @param {DataTableProps} data map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {string} tableHeight Height of the container which contains all rows.
 * @returns {JSX.Element} Data table as react element.
 */

function DataTable({ data, layerPath, tableHeight = '500px' }: DataTableProps): JSX.Element {
  const { t } = useTranslation();

  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  // get store actions and values
  const { zoomToExtent, highlightBBox, transformPoints, showClickMarker, addHighlightedFeature, removeHighlightedFeature } =
    useMapStoreActions();
  const { applyMapFilters, setSelectedFeature, setColumnsFiltersVisibility, getFilteredDataFromLegendVisibility } =
    useDataTableStoreActions();
  const { getExtentFromFeatures } = useLayerStoreActions();
  const language = useAppDisplayLanguage();
  const datatableSettings = useDataTableLayerSettings();

  // internal state
  const [density, setDensity] = useState<MRTDensityState>('compact');
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(datatableSettings[layerPath].columnsFiltersVisibility);
  const rowVirtualizerInstanceRef = useRef<MRTRowVirtualizer>(null);
  const columnVirtualizerInstanceRef = useRef<MRTColumnVirtualizer>(null);
  const [sorting, setSorting] = useState<MRTSortingState>([]);

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

  const { enableFocusTrap } = useUIStoreActions();

  const handleDensityChange = (updaterOrValue: MRTDensityState | ((prevState: MRTDensityState) => MRTDensityState)): void => {
    setDensity(updaterOrValue);
  };

  const handleToggleColumnFilters = () => {
    setShowColumnFilters((prev) => !prev);
    setColumnsFiltersVisibility(false, layerPath);
  };

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
        <Box component="span" sx={{ whiteSpace: 'nowrap', justifyContent: 'end' }}>
          {header}
        </Box>
      </Tooltip>
    );
  }, []);

  /**
   * Create image button which will trigger lightbox.
   * @param {string | number} cellValue value to be rendered in cell.
   * @param {string} cellId id of the column.
   * @returns {string | number | JSX.Element}
   */
  const createLightBoxButton = useCallback(
    (cellValue: string | number, cellId: string): string | number | JSX.Element => {
      // Log
      logger.logTraceUseCallback('DATA-TABLE - createLightBoxButton');

      if (typeof cellValue === 'string' && isImage(cellValue)) {
        return (
          <Button
            type="text"
            size="small"
            className={`returnLightboxFocusItem-${cellId.split('_')[0]}`}
            onClick={() => initLightBox(cellValue, cellId, 0)}
            sx={{ height: '2.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem', textTransform: 'none' }}
          >
            {t('dataTable.images')}
          </Button>
        );
      }

      // convert string to react component.
      return (typeof cellValue === 'string' && cellValue.length) || typeof cellValue === 'number' ? (
        <HtmlToReact htmlContent={cellValue.toString()} itemOptions={{ tabIndex: 0 }} />
      ) : (
        cellValue
      );
    },
    [initLightBox, t]
  );

  /**
   * Create data table body cell with tooltip
   *
   * @param {string | number | JSX.Element} cellValue - Cell value to be displayed in cell
   * @returns {JSX.Element}
   */
  const getCellValueWithTooltip = useCallback(
    (cellValue: string | number | JSX.Element, cellId: string): JSX.Element => {
      // Log
      logger.logTraceUseCallback('DATA-TABLE - getCellValueWithTooltip');

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
    },
    [createLightBoxButton, density, sxClasses.tableCell]
  );

  /**
   * Custom date type Column tooltip
   * @param {Date} date value to be shown in column.
   * @returns JSX.Element
   */
  const getDateColumnTooltip = useCallback((date: Date): JSX.Element => {
    // Log
    logger.logTraceUseCallback('DATA-TABLE - getDateColumnTooltip');

    const formattedDate = DateMgt.formatDate(date, 'YYYY-MM-DDThh:mm:ss');
    return (
      <Tooltip title={formattedDate} arrow>
        <Box tabIndex={0}>{formattedDate}</Box>
      </Tooltip>
    );
  }, []);

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
        ...((value.dataType === 'number' || value.dataType === 'oid') && {
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
        Cell: ({ cell }) => getCellValueWithTooltip(cell.getValue() as string | number | JSX.Element, cell.id),
        ...(value.dataType === 'date' && {
          accessorFn: (row) => new Date(row[key].value as string),
          sortingFn: 'datetime',
          filterFn: 'between',
          Cell: ({ cell }) => getDateColumnTooltip(cell.getValue<Date>()),
          filterVariant: 'date',
          muiFilterDatePickerProps: {
            timezone: 'UTC',
            format: 'YYYY-MM-DD',
            // NOTE: reason for type cast as undefined as x-mui-datepicker prop type saying Date cant be assigned to undefined.
            minDate: DateMgt.getDayjsDate('1600-01-01') as unknown as undefined,
            slotProps: {
              textField: {
                placeholder: language === VALID_DISPLAY_LANGUAGE[1] ? 'AAAA-MM-JJ' : 'YYYY-MM-DD',
              },
            },
          },
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
   * Handles zoom to feature.
   *
   * @param {TypeFeatureInfoEntry} feature - The feature to zoom to.
   */
  const handleZoomIn = useCallback(
    async (feature: TypeFeatureInfoEntry) => {
      let { extent } = feature;

      // Get oid field
      const oidField =
        feature && feature.fieldInfo
          ? Object.keys(feature.fieldInfo).find((key) => feature.fieldInfo[key]!.dataType === 'oid') || undefined
          : undefined;

      // If there is no extent, the layer is ESRI Dynamic, get the feature extent using its oid field
      if (!extent && oidField !== undefined)
        extent = await getExtentFromFeatures(layerPath, [feature.fieldInfo[oidField]!.value as string], oidField);

      if (extent) {
        // Project
        const center = getCenter(extent);
        const newCenter = transformPoints([center], 4326)[0];

        // Zoom to extent and wait for it to finish
        // TODO: We have the same patch in details, see if we should create a reusable custom patch / or change design
        zoomToExtent(extent)
          .then(async () => {
            // Typically, the click marker is removed after a zoom, so wait a bit here and re-add it...
            // TODO: Refactor - Zoom ClickMarker - Improve the logic in general of when/if a click marker should be removed after a zoom
            await delay(150);

            // Add (back?) a click marker, a bbox extent who will disapear and remove/add higlight the zoomed feature
            showClickMarker({ lnglat: newCenter });
            highlightBBox(extent!, false);
            removeHighlightedFeature('all');
            addHighlightedFeature(feature);
          })
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('zoomToExtent in handleZoomIn in FeatureInfoNew', error);
          });
      }
    },
    [
      getExtentFromFeatures,
      layerPath,
      transformPoints,
      zoomToExtent,
      showClickMarker,
      highlightBBox,
      removeHighlightedFeature,
      addHighlightedFeature,
    ]
  );

  /**
   * Build Rows for datatable
   *
   * @param {Features} features list of objects transform into rows.
   */
  const rows = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - rows', data.features);

    // get filtered feature for unique value info style so non visible class is not in the table
    const filterArray = getFilteredDataFromLegendVisibility(data.layerPath, data?.features ?? []);

    return (filterArray ?? []).map((feature) => {
      const featureInfo = {
        ICON: <Box component="img" alt={feature?.nameField ?? ''} src={feature.featureIcon} className="layer-icon" />,
        ZOOM: (
          <IconButton
            color="primary"
            // Function returns void promise instead of void, other work arounds led to more eslint issues
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onClick={() => handleZoomIn(feature)}
            disabled={!feature.extent && feature.geoviewLayerType !== CONST_LAYER_TYPES.ESRI_DYNAMIC}
          >
            <ZoomInSearchIcon />
          </IconButton>
        ),
        DETAILS: (
          <Box marginLeft="0.3rem">
            <IconButton
              color="primary"
              onClick={() => {
                setSelectedFeature(feature);
                enableFocusTrap({ activeElementId: 'featureDetailDataTable', callbackElementId: 'table-details' });
              }}
            >
              <InfoOutlinedIcon />
            </IconButton>
          </Box>
        ),
        ...feature.fieldInfo,
      };

      return featureInfo;
    }) as unknown as ColumnsType[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.features, handleZoomIn]);

  let useTable: MRTTableInstance<ColumnsType> | null = null;
  // Create the Material React Table
  useTable = useMaterialReactTable({
    columns,
    data: rows,
    enableDensityToggle: true,
    onDensityChange: handleDensityChange,
    onShowColumnFiltersChange: handleToggleColumnFilters,

    // NOTE: showGlobalFilter as true when layer change and we want to show global filter by default
    initialState: {
      showColumnFilters: datatableSettings[layerPath].columnsFiltersVisibility,
      showGlobalFilter: true,
      columnVisibility: { geoviewID: false },
    },
    state: {
      sorting,
      columnFilters,
      density,
      showColumnFilters,
      columnPinning: { left: ['ICON', 'ZOOM', 'DETAILS'] },
      globalFilter,
    },
    enableColumnFilterModes: true,
    // NOTE: enable column pinning so that icon, zoom, details can be pinned to left
    enableColumnPinning: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    enableBottomToolbar: false,
    positionToolbarAlertBanner: 'none', // hide existing row count
    renderTopToolbar: useCallback(
      (props: { table: MRTTableInstance<ColumnsType> }): ReactNode => (
        <TopToolbar
          sxClasses={sxClasses}
          datatableSettings={datatableSettings}
          layerPath={layerPath}
          t={t}
          globalFilter={globalFilter}
          useTable={useTable}
          columns={columns}
          data={data}
          table={props.table}
        />
      ),
      [datatableSettings, layerPath, globalFilter, columns, data, sxClasses, t, useTable] // Include dependencies
    ),
    enableFilterMatchHighlighting: true,
    enableColumnResizing: true,
    enableColumnVirtualization: true,
    enablePagination: false,
    enableRowVirtualization: true,
    muiTableContainerProps: { sx: { maxHeight: '5000px', maxWidth: '5000px', overflowY: 'hidden' } },
    rowVirtualizerInstanceRef,
    columnVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 5 },
    columnVirtualizerOptions: { overscan: 2 },
    localization: dataTableLocalization,
    muiTableHeadCellProps: {
      sx: sxClasses.tableHeadCell,
    },
    muiTableHeadProps: {
      sx: sxClasses.tableHead,
    },
    defaultColumn: {
      muiFilterTextFieldProps: {
        sx: () => ({
          minWidth: '50px',
        }),
      },
    },
    // override z-index of table when table is in fullscreen mode
    muiTablePaperProps: ({ table }) => ({
      style: {
        zIndex: table.getState().isFullScreen ? 999999 : undefined,
      },
    }),
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
    // Log
    logger.logTraceUseEffect('DATA-TABLE - buildFilterList');

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
        const date = DateMgt.applyInputDateFormat(`${(filterValue as Date).toISOString().slice(0, -5)}Z`);
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
  }, 500);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedColumnFilters = useCallback(
    (filters: MRTColumnFiltersState) => filterMap(filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datatableSettings[layerPath]?.mapFilteredRecord]
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
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
        <MaterialReactTable table={useTable} />
      </LocalizationProvider>
      <LightBoxComponent />
    </Box>
  );
}

export default memo(DataTable);
