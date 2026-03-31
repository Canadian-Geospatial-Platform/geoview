import { useCallback, useEffect, useMemo, useRef, useState, memo, isValidElement, type ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { getCenter } from 'ol/extent';

import type { Dayjs } from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { MRT_Localization_FR as MRTLocalizationFR } from 'material-react-table/locales/fr';
import { MRT_Localization_EN as MRTLocalizationEN } from 'material-react-table/locales/en';

import { useTheme } from '@mui/material/styles';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';

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
  BrowserNotSupportedIcon,
  ClearFiltersIcon,
} from '@/ui';

import TopToolbar from './top-toolbar';
import { useUIController } from '@/core/controllers/ui-controller';
import { getStoreMapCurrentProjectionEPSG } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useLayerDateTemporalMode,
  useLayerDisplayDateFormat,
  useLayerDisplayDateTimezone,
  useLayerSelectorFilterClass,
  useLayerSelectorName,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import {
  useDataTableLayerSettings,
  setStoreColumnFilterModesEntry,
  setStoreColumnsFiltersVisibility,
  setStoreSelectedFeature,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useTimeSliderFiltersSelector } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useAppDisplayLanguage, useAppShowUnsymbolizedFeatures } from '@/core/stores/store-interface-and-intial-values/app-state';
import { DateMgt } from '@/core/utils/date-mgt';
import linkifyHtml from 'linkify-html';
import { isImage, delay, sanitizeHtmlContent, enhanceLinksAccessibility } from '@/core/utils/utilities';
import { debounce } from '@/core/utils/debounce';
import { logger } from '@/core/utils/logger';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { useFilterRows, useToolbarActionMessage, useGlobalFilter } from './hooks';
import { getSxClasses } from './data-table-style';
import { useLightBox } from '@/core/components/common';
import { NUMBER_FILTER, DATE_FILTER, STRING_FILTER } from '@/core/utils/constant';
import type { DataTableProps, ColumnsType } from './data-table-types';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { Projection } from '@/geo/utils/projection';
import { useDataTableController } from '@/core/controllers/data-table-controller';
import { useLayerController } from '@/core/controllers/layer-controller';
import { useMapController } from '@/core/controllers/map-controller';

/** The possible filters for numeric columns */
const NUMERIC_FIELD_FILTERS = [
  'between', // The first one listed here is the default
  'betweenInclusive',
  'equals',
  'notEquals',
  'lessThan',
  'greaterThan',
  'lessThanOrEqualTo',
  'greaterThanOrEqualTo',
];

/** The possible filters for date columns */
const DATE_FIELD_FILTERS = NUMERIC_FIELD_FILTERS;

/** The possible filters for string columns */
const STRING_FIELD_FILTERS = ['contains', 'startsWith', 'endsWith'];

/**
 * Renders the interactive data table for a single layer.
 *
 * Memoized to avoid re-rendering all layer tables when only one layer's data changes.
 *
 * @param props - DataTable properties
 * @returns The data table element
 */

function DataTable({ data, layerPath, containerType }: DataTableProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-table');

  const { t } = useTranslation();

  const sxtheme = useTheme();
  const sxClasses = getSxClasses(sxtheme);

  // get store actions and values
  const language = useAppDisplayLanguage();
  const datatableSettings = useDataTableLayerSettings();
  const showUnsymbolizedFeatures = useAppShowUnsymbolizedFeatures();
  const layerClassFilter = useLayerSelectorFilterClass(layerPath);
  const layerTimeFilter = useTimeSliderFiltersSelector(layerPath);
  const layerDateTemporalMode = useLayerDateTemporalMode(layerPath);
  const displayDateFormat = useLayerDisplayDateFormat(layerPath);
  const displayDateTimezone = useLayerDisplayDateTimezone(layerPath);
  const displayDateTimezoneUniversal = displayDateTimezone === 'local' ? DateMgt.TIME_IANA_LOCAL : displayDateTimezone;
  const layerName = useLayerSelectorName(layerPath);
  const dataTableController = useDataTableController();
  const layerController = useLayerController();
  const mapController = useMapController();

  // internal state
  const [density, setDensity] = useState<MRTDensityState>('compact');
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(datatableSettings[layerPath].columnsFiltersVisibility);
  const rowVirtualizerInstanceRef = useRef<MRTRowVirtualizer>(null);
  const columnVirtualizerInstanceRef = useRef<MRTColumnVirtualizer>(null);
  const [sorting, setSorting] = useState<MRTSortingState>([]);
  const [columnFilterFns, setColumnFilterFns] = useState<Record<string, string>>(
    datatableSettings[layerPath]?.columnFilterModesRecord || {}
  );

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  // #region PINNED Datatable columns
  const iconColumn = { alias: t('dataTable.icon'), dataType: 'string', id: 'icon' };
  const zoomColumn = { alias: t('dataTable.zoom'), dataType: 'string', id: 'zoom' };
  const detailColumn = { alias: t('dataTable.details'), dataType: 'string', id: 'details' };
  // #endregion

  // #region REACT CUSTOM HOOKS
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { columnFilters, setColumnFilters } = useFilterRows({ layerPath });
  const { globalFilter, setGlobalFilter } = useGlobalFilter({ layerPath });
  // #endregion

  const uiController = useUIController();

  const mapId = useGeoViewMapId();

  // #region Handlers

  /**
   * Handles density change for the data table.
   */
  const handleDensityChange = (updaterOrValue: MRTDensityState | ((prevState: MRTDensityState) => MRTDensityState)): void => {
    setDensity(updaterOrValue);
  };

  /**
   * Handles toggling column filters visibility.
   */
  const handleToggleColumnFilters = (updaterOrValue: boolean | ((prev: boolean) => boolean)): void => {
    const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(showColumnFilters) : updaterOrValue;
    setShowColumnFilters(newValue);
    setStoreColumnsFiltersVisibility(mapId, newValue, layerPath);
  };

  // #endregion

  /** Checks if a value is a Dayjs instance. */
  const isDayjs = (v: unknown): v is Dayjs => typeof v === 'object' && v !== null && 'isValid' in v;

  /** Checks if a value is a date range tuple. */
  const isDateRange = useCallback((v: unknown): v is [Dayjs | null, Dayjs | null] => Array.isArray(v) && v.some(isDayjs), []);

  /**
   * Creates a table header cell with tooltip.
   *
   * @param header - Value to be displayed in the header
   * @returns The header element
   */
  const getTableHeader = useCallback((header: string): JSX.Element => {
    return (
      // Tooltip allows long titles to be fully visible on hover
      <Tooltip title={header} placement="top" arrow disableInteractive>
        <Box component="span" sx={{ whiteSpace: 'nowrap', justifyContent: 'end' }}>
          {header}
        </Box>
      </Tooltip>
    );
  }, []);

  const linkifyOptions = useMemo(
    () => ({
      attributes: {
        target: '_blank',
        rel: 'noopener noreferrer',
        title: t('details.externalLink'),
      },
      defaultProtocol: 'https',
      format: {
        url: (value: string) => (value.length > 50 ? `${value.slice(0, 40)}…${value.slice(value.length - 10)}` : value),
      },
      ignoreTags: ['script', 'style', 'img'],
    }),
    [t]
  );

  /**
   * Creates an image button that triggers the lightbox.
   *
   * @param cellValue - Value to be rendered in the cell
   * @param cellId - ID of the column
   * @returns The cell content element
   */
  const createLightBoxButton = useCallback(
    (cellValue: string | number, cellId: string): string | number | JSX.Element => {
      const uniqueButtonId = `${mapId}-${containerType}-btn-${cellId}`; // Create unique ID for focus management after lightbox closes

      if (typeof cellValue === 'string' && isImage(cellValue)) {
        return (
          <Button
            type="text"
            size="small"
            id={uniqueButtonId}
            onClick={() => initLightBox(cellValue, '', uniqueButtonId, 0)} // WCAG - Using empty alt text for images as descriptive text is not available
            sx={{ height: '2.5rem', paddingLeft: '0.5rem', paddingRight: '0.5rem', textTransform: 'none' }}
          >
            {t('dataTable.images')}
          </Button>
        );
      }

      // convert string to react component.
      return (typeof cellValue === 'string' && cellValue.length) || typeof cellValue === 'number' ? (
        <UseHtmlToReact
          htmlContent={sanitizeHtmlContent(
            enhanceLinksAccessibility(linkifyHtml(cellValue.toString(), linkifyOptions), t('general.opensInNewTab'))
          )}
          itemOptions={{ tabIndex: 0 }}
        />
      ) : (
        cellValue
      );
    },
    [initLightBox, t, containerType, mapId, linkifyOptions]
  );

  /**
   * Creates a data table body cell with tooltip.
   *
   * @param cellValue - Cell value to be displayed
   * @param cellId - ID of the cell
   * @returns The cell element
   */
  const getCellValueWithTooltip = useCallback(
    (cellValue: string | number | JSX.Element, cellId: string): JSX.Element => {
      return typeof cellValue === 'string' || typeof cellValue === 'number' ? (
        <Tooltip title={cellValue} placement="top" arrow>
          <Box component="div" sx={density === 'compact' ? sxClasses.tableCell : {}}>
            {createLightBoxButton(cellValue, cellId)}
          </Box>
        </Tooltip>
      ) : (
        <Box component="div" sx={density === 'compact' ? sxClasses.tableCell : {}}>
          {cellValue}
        </Box>
      );
    },
    [createLightBoxButton, density, sxClasses.tableCell]
  );

  /**
   * Creates a formatted date cell with tooltip.
   *
   * @param date - The date value to render
   * @returns The date cell element
   */
  const getCellContentDate = useCallback(
    (date: Dayjs): JSX.Element => {
      const formattedDate = DateMgt.formatDate(
        date.toDate(),
        displayDateFormat[language],
        language,
        displayDateTimezone,
        layerDateTemporalMode
      );
      return (
        <Tooltip title={formattedDate} arrow>
          <Box tabIndex={0}>{formattedDate}</Box>
        </Tooltip>
      );
    },
    [language, displayDateFormat, displayDateTimezone, layerDateTemporalMode]
  );

  /**
   * Gets the filter options configuration for a column based on its data type.
   *
   * @param dataType - The data type to infer the filter config from
   * @returns The filter options configuration
   */
  const getFilterConfig = useCallback((dataType: string): Partial<MRTColumnDef<ColumnsType>> => {
    // Depending on the data type
    if (dataType === 'date') {
      return {
        filterFn: 'between',
        columnFilterModeOptions: DATE_FIELD_FILTERS,
        filterVariant: 'date',
        sortingFn: 'datetime',
      };
    }

    if (dataType === 'number' || dataType === 'oid') {
      return {
        filterFn: 'between',
        columnFilterModeOptions: NUMERIC_FIELD_FILTERS,
      };
    }

    return {
      filterFn: 'contains',
      columnFilterModeOptions: STRING_FIELD_FILTERS,
    };
  }, []);

  /**
   * Builds material react data table column definitions.
   */

  // TODO: WCAG Issue #3114 Contrast is low on sort and action icons in header.
  // TODO: WCAG Issue #3116 At times generates empty table headings.
  const memoColumns = useMemo<MRTColumnDef<ColumnsType>[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - memoColumns', density);

    const entries = Object.entries({ ICON: iconColumn, ZOOM: zoomColumn, DETAILS: detailColumn, ...data.fieldInfos });
    const columnList = [] as MRTColumnDef<ColumnsType>[];
    entries.forEach(([key, value]) => {
      // Get the filter config
      const filterConfig = getFilterConfig(value.dataType);

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
        visibleInShowHideMenu: value.id === 'icon' || value.id === 'zoom' || value.id === 'details' ? false : true,

        Header: ({ column }) => getTableHeader(column.columnDef.header),
        Cell: ({ cell }) => getCellValueWithTooltip(cell.getValue() as string | number | JSX.Element, cell.id),

        // Spread in the filter config
        ...filterConfig,

        // Spread in more properties if dataType is date
        ...(value.dataType === 'date' && {
          accessorFn: (row) => (row[key].value ? DateMgt.createDayjs(row[key].value as string) : undefined),
          Cell: ({ cell }) => getCellContentDate(cell.getValue<Dayjs>()),
          muiFilterDatePickerProps: {
            timezone: displayDateTimezoneUniversal,
            format: displayDateFormat[language],
            // NOTE: reason for type cast as undefined as x-mui-datepicker prop type saying Date cant be assigned to undefined.
            minDate: DateMgt.createDayjs('1600-01-01') as unknown as undefined,
          },
        }),

        // Spread in the extra config for the special columns (icon/zoom/details)
        ...([t('dataTable.icon'), t('dataTable.zoom'), t('dataTable.details')].includes(value.alias)
          ? (() => {
              return {
                size: 60,
                grow: false,
                enableColumnFilter: false,
                enableColumnActions: false,
                enableSorting: false,
                enableResizing: false,
                enableGlobalFilter: false,
                muiTableBodyCellProps: {
                  sx: sxClasses.pinnedColumn,
                },
                muiTableHeadCellProps: {
                  sx: sxClasses.pinnedColumn,
                },
              };
            })()
          : {}),
      });
    });

    return columnList;
    // TODO: CLEANUP REACT - Uncomment all disable react-hooks/exhaustive-deps from this file and fix all dependencies!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, getFilterConfig, getCellContentDate, displayDateTimezone]);

  /**
   * Initializes default filter modes for columns using the first available option.
   */
  const memoInitialColumnFilterModes = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - memoInitialColumnFilterModes');

    // If we have stored filter modes, use them
    if (
      datatableSettings[layerPath]?.columnFilterModesRecord &&
      Object.keys(datatableSettings[layerPath].columnFilterModesRecord).length > 0
    ) {
      return datatableSettings[layerPath].columnFilterModesRecord;
    }

    // Otherwise, initialize with first available mode for each column
    const defaultModes: Record<string, string> = {};
    memoColumns.forEach((column) => {
      if (column.id && column.columnFilterModeOptions && column.columnFilterModeOptions.length > 0) {
        defaultModes[column.id] = column.columnFilterModeOptions[0];
      }
    });
    return defaultModes;
  }, [memoColumns, datatableSettings, layerPath]);

  /**
   * Checks if a column has numerical filters.
   *
   * @param columnId - The column ID to check
   * @returns Whether the column uses numerical filters
   */
  const isColumnFilterNumeric = useCallback(
    (columnId: string): boolean => {
      return !!memoColumns.find((col) => {
        if (col.id === columnId) {
          // If the column has a 'lessThanOrEqualTo' filter option, we can assume it's filtering on numbers
          return col.columnFilterModeOptions?.includes('lessThanOrEqualTo');
        }
        return false;
      });
    },
    [memoColumns]
  );

  /**
   * Handles zoom to a feature on the map.
   *
   * @param feature - The feature to zoom to
   */
  const handleZoomIn = useCallback(
    async (feature: TypeFeatureInfoEntry): Promise<void> => {
      let { extent } = feature;

      // Get oid field
      let oidField: string | undefined;
      if (feature && feature.fieldInfo) {
        oidField = Object.keys(feature.fieldInfo).find((key) => feature.fieldInfo[key]?.dataType === 'oid');
      }

      // If there is no extent, but there's an OID field (ESRI Dynamic layer / WMS with associated WFS) ?
      if (!extent && oidField) {
        try {
          // Get the feature extent using its oid field
          extent = await layerController.getExtentFromFeatures(layerPath, [feature.fieldInfo[oidField]!.value as number], oidField);
        } catch (error: unknown) {
          // Log error
          logger.logError(error);
        }
      }

      // If the extent was found
      if (extent) {
        // Project
        const center = getCenter(extent);
        // TODO: CHECK -This should likely go through a Zustand hook instead of a state getter
        const newCenter = Projection.transformPoints([center], getStoreMapCurrentProjectionEPSG(mapId), `EPSG:4326`)[0];

        // Zoom to extent and wait for it to finish
        // TODO: We have the same patch in details, see if we should create a reusable custom patch / or change design
        mapController
          .zoomToExtent(extent)
          .then(async () => {
            // Typically, the click marker is removed after a zoom, so wait a bit here and re-add it...
            // TODO: Refactor - Zoom ClickMarker - Improve the logic in general of when/if a click marker should be removed after a zoom
            await delay(150);

            // Add (back?) a click marker, a bbox extent who will disapear and remove/add higlight the zoomed feature
            mapController.clickMarkerIconShow({ lonlat: newCenter });
            mapController.highlightBBox(extent, false);
            mapController.removeHighlightedFeature('all');
            mapController.addHighlightedFeature(feature);
          })
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('zoomToExtent in handleZoomIn in FeatureInfoNew', error);
          });
      } else {
        // Log error
        logger.logError('Cannot zoom to feature, no extent found.');
      }
    },
    [mapId, layerPath, layerController, mapController]
  );

  /**
   * Builds the data table rows from features with filtering applied.
   */
  const memoRows = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - memoRows', data.features);

    // In addition, filter on the class renderer filters and the time slider filter
    const layerFilterClassAndTime = LayerFilters.joinWithAnd([layerClassFilter, layerTimeFilter]);

    // Create the filter equation equivalent of the combined filter
    const layerFilterEquation = GeoviewRenderer.createFilterNodeFromFilter(layerFilterClassAndTime);

    // Filter each features
    let filterArray =
      data?.features?.filter((f) => {
        return f.feature && GeoviewRenderer.featureRespectsFilterEquation(f.feature, layerFilterEquation);
      }) ?? [];

    // Filter out unsymbolized features if the showUnsymbolizedFeatures config is false
    if (!showUnsymbolizedFeatures) {
      filterArray = filterArray.filter((record) => record.featureIcon);
    }

    return (filterArray ?? []).map((feature, featureIndex) => {
      // Create unique button ID per feature
      const featureDetailsButtonId = `${mapId}-${containerType}-table-details-btn-${featureIndex}`;

      const icon = feature.featureIcon ? (
        // WCAG - Using empty alt text for images as descriptive text is not available
        <Box component="img" alt="" src={feature.featureIcon} className="layer-icon" />
      ) : (
        <Box component="div" aria-label={feature?.nameField ?? ''} className="layer-icon">
          <BrowserNotSupportedIcon />
        </Box>
      );

      const featureInfo = {
        ICON: icon,
        ZOOM: (
          <IconButton
            color="primary"
            aria-label={t('dataTable.zoom')}
            tooltipPlacement="top"
            // Function returns void promise instead of void, other work arounds led to more eslint issues
            onClick={() => {
              handleZoomIn(feature).catch((error) => logger.logError('Zoom failed:', error));
            }}
            disabled={!feature.supportZoomTo}
          >
            <ZoomInSearchIcon />
          </IconButton>
        ),
        DETAILS: (
          <IconButton
            id={featureDetailsButtonId}
            color="primary"
            aria-label={t('dataTable.details')}
            tooltipPlacement="top"
            onClick={() => {
              setStoreSelectedFeature(mapId, feature);
              uiController.enableFocusTrap({ activeElementId: 'featureDetailDataTable', callbackElementId: featureDetailsButtonId });
            }}
          >
            <InfoOutlinedIcon />
          </IconButton>
        ),
        ...feature.fieldInfo,
      };

      return featureInfo;
    }) as unknown as ColumnsType[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.features, layerClassFilter, layerTimeFilter, handleZoomIn]);

  // TODO: Cleanup - remove  dead code
  // TODO: The table is triggering many useless callback. With max-height of 5000px, it is slower to create but faster scroll.
  // TO.DOCONT: The x scroll is at the bottom, this is not good. We can set at the top with CSS below.
  // TO.DOCONT: It looks like we have circular dependencies, lack of useMemo to avoid rendering, callback not need like lightbox (only for images but render alll the time), ...
  // transform: 'rotateX(180deg)',
  //   '& .MuiTable-root': {  // Target the MUI table root specifically
  //     transform: 'rotateX(180deg)',
  //   }
  // TODO: The right panel fullscreen button is incredibly slow...
  // TODO: There is the error below
  // hook.js:608 Warning: A component is changing a controlled input to be uncontrolled. This is likely caused by the value changing from a defined to undefined, which should not happen.
  // Decide between using a controlled or uncontrolled input element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components Error Component Stack

  let useTable: MRTTableInstance<ColumnsType> | null = null;
  // Ref to the table wrapper element - used to scope search input DOM queries to a specific table instance
  const dataTableWrapperRef = useRef<HTMLDivElement>(null);
  // Ref to track previous globalFilter value - used to detect when clear button is pressed (transition from text to empty)
  const prevGlobalFilterRef = useRef<string | null>(null);

  // Create the Material React Table
  useTable = useMaterialReactTable({
    columns: memoColumns,
    data: memoRows,
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
      columnFilterFns,
    },
    icons: {
      FilterListOffIcon: ClearFiltersIcon,
    },
    enableColumnFilterModes: true,
    // NOTE: enable column pinning so that icon, zoom, details can be pinned to left
    enableColumnPinning: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFilterFnsChange: setColumnFilterFns,
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
          columns={memoColumns}
          data={data}
          table={props.table}
        />
      ),
      [datatableSettings, layerPath, globalFilter, memoColumns, data, sxClasses, t, useTable] // Include dependencies
    ),
    enableFilterMatchHighlighting: true,
    enableColumnResizing: true,
    enableColumnVirtualization: true,
    enablePagination: false,
    enableRowVirtualization: true,
    muiTableContainerProps: {
      sx: {
        maxHeight: 'calc(100% - 97px)', // 97px is the height of the data table header. Setting max height prevents the containing columns scrollbars from triggering
      },
      className: 'data-table-container',
    },
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
        height: '100%',
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
    // Improve global filter accessibility
    muiSearchTextFieldProps: {
      inputProps: {
        type: 'search',
        'aria-label': t('dataTable.searchInputLabel')!,
      },
    },
    // Improve table accessibility
    muiTableProps: {
      'aria-label': t('dataTable.tableAriaLabelWithLayer', { layerName })!,
    },
  });

  /**
   * Scrolls to top of table when sorting changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - sorting', sorting);

    // update scroll index when there are some rows in the table.
    const rowsCount = useTable.getRowCount();
    // scroll to the top of the table when the sorting changes
    try {
      if (rowsCount > 0) {
        rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
      }
    } catch (error: unknown) {
      logger.logError('Data table error on sorting action', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  /**
   * Sets default column filter modes when columns are available.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - memoInitialColumnFilterModes', memoInitialColumnFilterModes);

    // Only set defaults if we don't have stored values and columns are now available
    if (Object.keys(columnFilterFns).length === 0 && Object.keys(memoInitialColumnFilterModes).length > 0) {
      setColumnFilterFns(memoInitialColumnFilterModes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoInitialColumnFilterModes]);

  /**
   * Converts column filter state into filter strings for the map.
   *
   * @param columnFilter - The column filters state
   * @returns The list of filter strings
   */
  const buildFilterList = useCallback(
    (columnFilter: MRTColumnFiltersState): string[] => {
      const tableState = useTable.getState();
      if (!columnFilter.length) return [''];

      return columnFilter.map(({ id: filterId, value }) => {
        const filterFn = tableState?.columnFilterFns[filterId];

        /* ---------------------------------
         * DATE RANGE FILTER (array of Dayjs)
         * --------------------------------- */
        if (isDateRange(value)) {
          const [start, end] = value;

          // Convert the dates as read to UTC ISO strings, that's the core standard
          const startDate = start?.isValid() ? start.utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : undefined;
          const endDate = end?.isValid() ? end.utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : undefined;

          const inclusive = filterFn === 'betweenInclusive' ? '=' : '';

          if (startDate && endDate) {
            return `${filterId} >${inclusive} date '${startDate}' and ${filterId} <${inclusive} date '${endDate}'`;
          }
          if (startDate) {
            return `${filterId} >${inclusive} date '${startDate}'`;
          }
          if (endDate) {
            return `${filterId} <${inclusive} date '${endDate}'`;
          }

          return '';
        }

        /* -------------------------
         * NUMERIC RANGE (min / max)
         * ------------------------- */
        if (Array.isArray(value) && isColumnFilterNumeric(filterId)) {
          const [minRaw, maxRaw] = value;
          const min = minRaw === '' || minRaw === null || String(minRaw).trim() === '' ? undefined : Number(minRaw);
          const max = maxRaw === '' || maxRaw === null || String(maxRaw).trim() === '' ? undefined : Number(maxRaw);

          if ((min !== undefined && Number.isNaN(min)) || (max !== undefined && Number.isNaN(max))) {
            return '';
          }

          const inclusive = filterFn === 'betweenInclusive' ? '=' : '';

          if (min !== undefined && max !== undefined) {
            return `${filterId} >${inclusive} ${min} and ${filterId} <${inclusive} ${max}`;
          }
          if (min !== undefined) {
            return `${filterId} >${inclusive} ${min}`;
          }
          if (max !== undefined) {
            return `${filterId} <${inclusive} ${max}`;
          }

          return '';
        }

        /* -------------------------
         * SINGLE DATE FILTER
         * ------------------------- */
        if (isDayjs(value) && value.isValid()) {
          const dateOpr = filterFn || 'equals';
          const dateFilter = DATE_FILTER[dateOpr];

          // Convert the date as read to UTC ISO string, that's the core standard
          const date = value.utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

          // Return the UTC date filter
          return `${filterId} ${dateFilter.replace('value', `date '${date}'`)}`;
        }

        /* -------------------------
         * NULL / NOT NULL
         * ------------------------- */
        if (filterFn === 'empty') return `${filterId} is null`;
        if (filterFn === 'notEmpty') return `${filterId} is not null`;

        /* -------------------------
         * SINGLE NUMERIC
         * ------------------------- */
        if (isColumnFilterNumeric(filterId)) {
          const num = Number(value);
          if (Number.isNaN(num)) return '';
          return `${filterId} ${NUMBER_FILTER[filterFn]} ${num}`;
        }

        /* -------------------------
         * STRING FILTER (default)
         * ------------------------- */
        const operator = filterFn ?? 'contains';
        const strFilter = STRING_FILTER[operator];

        return strFilter?.replace('filterId', filterId).replace('value', value as string) ?? '';
      });
    },
    [useTable, isDateRange, isColumnFilterNumeric]
  );

  /**
   * Filters the map based on the data table filter strings.
   *
   * @param filters - The column filters to apply
   */
  const filterMap = debounce((filters: MRTColumnFiltersState) => {
    const filterStrings = buildFilterList(filters)
      .filter((filterValue) => filterValue.length)
      .join(' and ');
    dataTableController.applyMapFilters(filterStrings);
  }, 500);

  /**
   * Debounces column filter changes before applying them to the map.
   *
   * @param filters - The column filters to apply
   */
  const debouncedColumnFilters = useCallback(
    (filters: MRTColumnFiltersState): void => {
      return filterMap(filters);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [datatableSettings[layerPath]?.mapFilteredRecord]
  );

  /**
   * Updates the map when column filters change.
   */
  // update map when column filters change
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - columnFilters', columnFilters);

    if (columnFilters && datatableSettings[layerPath].mapFilteredRecord) {
      debouncedColumnFilters(columnFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  /**
   * Saves column filter modes to the store when they change.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - columnFilterFns', columnFilterFns);

    setStoreColumnFilterModesEntry(mapId, columnFilterFns, layerPath);
  }, [mapId, columnFilterFns, layerPath]);

  /**
   * Updates the map when the filter map switch is toggled.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - mapFilteredRecord', datatableSettings[layerPath].mapFilteredRecord);

    filterMap(columnFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datatableSettings[layerPath].mapFilteredRecord]);

  /**
   * Restores focus to the search input when the clear search button is pressed.
   *
   * A custom "Clear search" button is used because the browser's native "Clear search" button (hidden with CSS above) is not focusable.
   * The esc key will not clear the search because it is mapped to close the panel.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - globalFilter focus', globalFilter);
    // Only focus when transitioning from having text to being empty (clear button pressed)
    if (prevGlobalFilterRef.current && !globalFilter && dataTableWrapperRef.current) {
      dataTableWrapperRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
    }
    prevGlobalFilterRef.current = globalFilter ?? '';
  }, [globalFilter]);

  // set toolbar custom action message in store.
  useToolbarActionMessage({ data, columnFilters, globalFilter, layerPath, tableInstance: useTable, showUnsymbolizedFeatures });

  return (
    <Box ref={dataTableWrapperRef} sx={sxClasses.dataTableWrapper} className="data-table-wrapper">
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
        <MaterialReactTable table={useTable} />
      </LocalizationProvider>
      <LightBoxComponent />
    </Box>
  );
}

export default memo(DataTable);
