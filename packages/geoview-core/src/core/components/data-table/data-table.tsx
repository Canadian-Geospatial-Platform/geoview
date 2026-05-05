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

import type { SxStyles } from '@/ui/style/types';

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
import { getStoreMapCurrentProjectionEPSG } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useStoreLayerDateTemporalMode,
  useStoreLayerDisplayDateFormat,
  useStoreLayerDisplayDateTimezone,
  useStoreLayerFilterClass,
  useStoreLayerName,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useStoreDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useStoreTimeSliderFilter } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { useStoreAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { DateMgt } from '@/core/utils/date-mgt';
import linkifyHtml from 'linkify-html';
import { isImage, delay, sanitizeHtmlContent, enhanceLinksAccessibility } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { useFilterRows, useGlobalFilter, useColumnVisibility } from './hooks';
import { getSxClasses } from './data-table-style';
import { useLightBox } from '@/core/components/common';
import { NUMBER_FILTER, DATE_FILTER, STRING_FILTER } from '@/core/utils/constant';
import type { DataTableProps, DataTableRow } from './data-table-types';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { GeoviewRenderer } from '@/geo/utils/renderer/geoview-renderer';
import { LayerFilters } from '@/geo/layer/gv-layers/layer-filters';
import { Projection } from '@/geo/utils/projection';
import { useDataTableController, useLayerController, useMapController, useUIController } from '@/core/controllers/use-controllers';

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

/** Checks if a value is a Dayjs instance. */
const isDayjs = (v: unknown): v is Dayjs => typeof v === 'object' && v !== null && 'isValid' in v;

/** Checks if a value is a date range tuple containing at least one Dayjs element. */
const isDateRange = (v: unknown): v is [Dayjs | null, Dayjs | null] => Array.isArray(v) && (v as unknown[]).some(isDayjs);

/** Linkify configuration options for URL detection and formatting. */
const linkifyOptions = {
  attributes: {
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  defaultProtocol: 'https',
  format: {
    url: (value: string): string => (value.length > 50 ? `${value.slice(0, 40)}\u2026${value.slice(value.length - 10)}` : value),
  },
  ignoreTags: ['script', 'style', 'img'],
};

/** Properties for the TooltipCell component. */
interface TooltipCellProps {
  /** The content to wrap with the tooltip. */
  children: ReactNode;
  /** The tooltip text to display. */
  title: string | number;
  /** Whether the tooltip should be open. */
  isOpen?: boolean;
}

/**
 * Creates the tooltip cell wrapper component.
 *
 * The tooltip opens when either the parent cell is focused (keyboard) or the mouse hovers over it.
 * Truncation check is performed lazily on hover to avoid per-cell ResizeObserver overhead.
 *
 * @param props - Properties defined in TooltipCellProps interface
 * @returns The tooltip cell wrapper element
 */
function TooltipCell({ children, title, isOpen = false }: TooltipCellProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-table > TooltipCell');

  const [isHovered, setIsHovered] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const contentRef = useRef<HTMLSpanElement>(null);

  // #region Handlers

  /**
   * Handles mouse enter to show tooltip and check truncation lazily.
   */
  const handleMouseEnter = useCallback((): void => {
    setIsHovered(true);
    // Check truncation only on hover — avoids per-cell ResizeObserver overhead
    if (contentRef.current) {
      const truncated = contentRef.current.scrollWidth > contentRef.current.offsetWidth;
      setIsTruncated(truncated);
    }
  }, []);

  /**
   * Handles mouse leave to hide tooltip.
   */
  const handleMouseLeave = useCallback((): void => {
    setIsHovered(false);
  }, []);

  // #endregion

  /**
   * Checks truncation when cell receives keyboard focus.
   */
  useEffect(() => {
    logger.logTraceUseEffect('TOOLTIP-CELL - Check truncation on focus', isOpen);

    if (isOpen && contentRef.current) {
      const truncated = contentRef.current.scrollWidth > contentRef.current.offsetWidth;
      setIsTruncated(truncated);
    }
  }, [isOpen]);

  return (
    <Tooltip title={title} arrow open={isTruncated && (isOpen || isHovered)} disableHoverListener disableFocusListener disableTouchListener>
      <Box
        ref={contentRef}
        component="span"
        sx={{
          display: 'block',
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Box>
    </Tooltip>
  );
}

/**
 * Renders the interactive data table for a single layer.
 *
 * Memoized to avoid re-rendering all layer tables when only one layer's data changes.
 *
 * @param props - Properties defined in DataTableProps interface
 * @returns The data table element
 */
function DataTable({ data, layerPath, containerType, unfilteredFeaturesCount }: DataTableProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/data-table');

  const { t } = useTranslation<string>();

  const sxtheme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('DATA-TABLE - memoSxClasses', sxtheme);
    return getSxClasses(sxtheme);
  }, [sxtheme]);

  // get store actions and values
  const mapId = useStoreGeoViewMapId();
  const language = useStoreAppDisplayLanguage();
  const datatableSettings = useStoreDataTableLayerSettings();
  const layerClassFilter = useStoreLayerFilterClass(layerPath);
  const layerTimeFilter = useStoreTimeSliderFilter(layerPath);
  const layerDateTemporalMode = useStoreLayerDateTemporalMode(layerPath);
  const displayDateFormat = useStoreLayerDisplayDateFormat(layerPath);
  const displayDateTimezone = useStoreLayerDisplayDateTimezone(layerPath);
  const displayDateTimezoneUniversal = displayDateTimezone === 'local' ? DateMgt.TIME_IANA_LOCAL : displayDateTimezone;
  const layerName = useStoreLayerName(layerPath);
  const dataTableController = useDataTableController();
  const layerController = useLayerController();
  const mapController = useMapController();
  const uiController = useUIController();
  const { mapFilteredRecord } = datatableSettings[layerPath];

  // internal state
  const [density, setDensity] = useState<MRTDensityState>('compact');
  const [showColumnFilters, setShowColumnFilters] = useState<boolean>(datatableSettings[layerPath].columnsFiltersVisibility);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const rowVirtualizerInstanceRef = useRef<MRTRowVirtualizer>(null);
  const columnVirtualizerInstanceRef = useRef<MRTColumnVirtualizer>(null);
  const [sorting, setSorting] = useState<MRTSortingState>([]);
  const [columnFilterFns, setColumnFilterFns] = useState<Record<string, string>>(
    datatableSettings[layerPath]?.columnFilterModesRecord || {}
  );
  const filteredFeaturesRef = useRef<TypeFeatureInfoEntry[]>([]);

  const dataTableLocalization = language === 'fr' ? MRTLocalizationFR : MRTLocalizationEN;

  // #region REACT CUSTOM HOOKS
  const { initLightBox, LightBoxComponent } = useLightBox();
  const { columnFilters, setColumnFilters } = useFilterRows({ layerPath });
  const { globalFilter, setGlobalFilter } = useGlobalFilter({ layerPath });
  const { columnVisibility, onColumnVisibilityChange } = useColumnVisibility({ layerPath });
  // #endregion

  // #region Handlers

  /**
   * Handles density change for the data table.
   */
  const handleDensityChange = useCallback((updaterOrValue: MRTDensityState | ((prevState: MRTDensityState) => MRTDensityState)): void => {
    setDensity(updaterOrValue);
  }, []);

  /**
   * Handles toggling column filters visibility.
   */
  const handleToggleColumnFilters = useCallback(
    (updaterOrValue: boolean | ((prev: boolean) => boolean)): void => {
      const newValue = typeof updaterOrValue === 'function' ? updaterOrValue(showColumnFilters) : updaterOrValue;
      setShowColumnFilters(newValue);
      dataTableController.setColumnsFiltersVisibility(layerPath, newValue);
    },
    [dataTableController, layerPath, showColumnFilters]
  );

  /**
   * Handles cell focus for tooltip display.
   */
  const handleCellFocus = useCallback((event: React.FocusEvent<HTMLTableCellElement>): void => {
    const cellId = event.currentTarget.getAttribute('data-cell-id');
    if (cellId) setFocusedCell(cellId);
  }, []);

  /**
   * Handles cell blur to hide tooltip.
   */
  const handleCellBlur = useCallback((): void => {
    setFocusedCell(null);
  }, []);

  /**
   * Handles keyboard navigation in table head cells.
   */
  const handleTableHeadKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (event.key.startsWith('Arrow')) {
      const target = event.target as HTMLElement;
      const isInsideMenu = target.closest('[role="menu"]') !== null;
      if (isInsideMenu) {
        event.stopPropagation();
      }
    }
  }, []);

  /**
   * Handles keyboard activation of column action buttons.
   */
  const handleColumnActionsKeyDown = useCallback((event: React.KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      (event.currentTarget as HTMLElement).click();
    }
  }, []);

  // #endregion

  /**
   * Creates a table header cell with dynamic tooltip.
   *
   * Tooltip only appears when header text is truncated.
   *
   * @param header - Value to be displayed in the header
   * @param columnId - ID of the column for focus tracking
   * @returns The header element
   */
  const getTableHeader = useCallback(
    (header: string, columnId: string): JSX.Element => {
      const isOpen = focusedCell === `header-${columnId}`;
      return (
        <TooltipCell title={header} isOpen={isOpen}>
          <Box component="span" sx={memoSxClasses.tableHeaderContent}>
            {header}
          </Box>
        </TooltipCell>
      );
    },
    [memoSxClasses.tableHeaderContent, focusedCell]
  );

  /**
   * Creates an image button that triggers the lightbox.
   *
   * @param cellValue - Value to be rendered in the cell
   * @param cellId - ID of the column
   * @returns The cell content element
   */
  const createLightBoxButton = useCallback(
    (cellValue: string | number, cellId: string, feature?: TypeFeatureInfoEntry): string | number | JSX.Element => {
      const uniqueButtonId = `${mapId}-${containerType}-btn-${cellId}`; // Create unique ID for focus management after lightbox closes
      const isImageValue = typeof cellValue === 'string' && isImage(cellValue);
      if (isImageValue) {
        // Extract feature name for aria-label
        const featureName =
          feature?.nameField && feature.fieldInfo[feature.nameField] ? ` - ${feature.fieldInfo[feature.nameField]?.value}` : '';
        return (
          <Button
            type="text"
            variant="outlined"
            size="small"
            id={uniqueButtonId}
            onClick={() => initLightBox(cellValue, '', uniqueButtonId, 0)}
            sx={memoSxClasses.lightboxButton}
            aria-label={`${t('dataTable.openImages')}${featureName}`}
          >
            {t('dataTable.openImages')}
          </Button>
        );
      }

      // convert string to react component.
      return (typeof cellValue === 'string' && cellValue.length) || typeof cellValue === 'number' ? (
        <UseHtmlToReact
          htmlContent={sanitizeHtmlContent(
            enhanceLinksAccessibility(linkifyHtml(cellValue.toString(), linkifyOptions), t('general.opensInNewTab'))
          )}
        />
      ) : (
        cellValue
      );
    },
    [initLightBox, t, containerType, mapId, memoSxClasses.lightboxButton]
  );

  /**
   * Extracts plain text or full URL from cell content for tooltip display.
   *
   * For links, returns the full href URL (useful when link text is truncated).
   * For HTML content, uses DOMParser to extract plain text safely.
   *
   * @param cellValue - The cell value (may contain HTML)
   * @returns Plain text or full URL for tooltip display
   */
  const extractTooltipText = useCallback((cellValue: string | number): string => {
    if (typeof cellValue === 'number') return String(cellValue);

    // Fast path: no HTML tags present - skip processing
    if (!cellValue.includes('<')) return cellValue;

    // Check for anchor tag and extract href (most common case for links)
    const anchorMatch = cellValue.match(/<a[^>]+href=["']([^"']+)["']/i);
    if (anchorMatch) {
      return anchorMatch[1];
    }

    // DOMParser with text/html never throws — textContent extraction is inherently safe
    const doc = new DOMParser().parseFromString(cellValue, 'text/html');
    const text: string = doc.body.textContent ?? '';
    return text;
  }, []);

  /**
   * Creates a data table body cell with tooltip.
   *
   * @param cellValue - Cell value to be displayed
   * @param cellId - ID of the cell
   * @returns The cell element
   */
  const getCellValueWithTooltip = useCallback(
    (cellValue: string | number | JSX.Element, cellId: string, feature?: TypeFeatureInfoEntry): JSX.Element => {
      const isOpen = focusedCell === cellId;
      const isImageValue = typeof cellValue === 'string' && isImage(cellValue);

      // For images, the button handles its own tooltip
      if (isImageValue) {
        return (
          <Box component="div" sx={density === 'compact' ? memoSxClasses.tableCell : {}}>
            {createLightBoxButton(cellValue, cellId, feature)}
          </Box>
        );
      }

      // Extract tooltip text
      let tooltipTitle: string;
      if (typeof cellValue === 'string' || typeof cellValue === 'number') {
        tooltipTitle = extractTooltipText(cellValue);
      } else {
        tooltipTitle = String(cellValue);
      }

      // TooltipCell directly wraps the content - NO extra Box wrapper
      return typeof cellValue === 'string' || typeof cellValue === 'number' ? (
        <TooltipCell title={tooltipTitle} isOpen={isOpen}>
          {createLightBoxButton(cellValue, cellId)}
        </TooltipCell>
      ) : (
        <Box component="div" sx={density === 'compact' ? memoSxClasses.tableCell : {}}>
          {cellValue}
        </Box>
      );
    },
    [createLightBoxButton, density, memoSxClasses.tableCell, focusedCell, extractTooltipText]
  );

  /**
   * Creates a formatted date cell with tooltip.
   *
   * @param date - The date value to render
   * @param cellId - ID of the cell
   * @returns The date cell element
   */
  const getCellContentDate = useCallback(
    (date: Dayjs, cellId: string): JSX.Element => {
      const isOpen = focusedCell === cellId;
      const formattedDate = DateMgt.formatDate(
        date.toDate(),
        displayDateFormat[language],
        language,
        displayDateTimezone,
        layerDateTemporalMode
      );

      return (
        <TooltipCell title={formattedDate} isOpen={isOpen}>
          {formattedDate}
        </TooltipCell>
      );
    },
    [language, displayDateFormat, displayDateTimezone, layerDateTemporalMode, focusedCell]
  );

  /**
   * Gets the filter options configuration for a column based on its data type.
   *
   * @param dataType - The data type to infer the filter config from
   * @returns The filter options configuration
   */
  const getFilterConfig = useCallback((dataType: string): Partial<MRTColumnDef<DataTableRow>> => {
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

  // TODO: WCAG Issue #3450 At times generates empty table headings.
  const memoColumns = useMemo<MRTColumnDef<DataTableRow>[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - memoColumns', density);

    // Pinned data table columns
    const iconColumn = { alias: t('dataTable.icon'), dataType: 'string', id: 'icon' };
    const zoomColumn = { alias: t('dataTable.zoom'), dataType: 'string', id: 'zoom' };
    const detailColumn = { alias: t('dataTable.details'), dataType: 'string', id: 'details' };

    const entries = Object.entries({ ICON: iconColumn, ZOOM: zoomColumn, DETAILS: detailColumn, ...data.fieldInfos });
    const columnList = [] as MRTColumnDef<DataTableRow>[];
    entries.forEach(([key, value]) => {
      // Get the filter config
      const filterConfig = getFilterConfig(value.dataType);

      columnList.push({
        id: key,
        accessorFn: (row) => {
          const cellValue = row[key];
          // check if cell value is valid react element.
          if (isValidElement(cellValue)) {
            return cellValue;
          }
          // check if cell value is TypeFieldEntry (has value property)
          if (cellValue && typeof cellValue === 'object' && 'value' in cellValue) {
            return cellValue.value ?? '';
          }
          return '';
        },
        header: value.alias,
        visibleInShowHideMenu: value.id !== 'icon' && value.id !== 'zoom' && value.id !== 'details',

        Header: ({ column }) => getTableHeader(column.columnDef.header, column.id),
        Cell: ({ cell }) => getCellValueWithTooltip(cell.getValue() as string | number | JSX.Element, cell.id, cell.row.original.gvFeature),

        // Spread in the filter config
        ...filterConfig,

        // Spread in more properties if dataType is date
        ...(value.dataType === 'date' && {
          accessorFn: (row) => {
            const cellValue = row[key];
            if (cellValue && typeof cellValue === 'object' && 'value' in cellValue) {
              return cellValue.value ? DateMgt.createDayjs(cellValue.value as string) : undefined;
            }
            return undefined;
          },
          Cell: ({ cell }) => getCellContentDate(cell.getValue<Dayjs>(), cell.id),
          muiFilterDatePickerProps: {
            timezone: displayDateTimezoneUniversal,
            format: displayDateFormat[language],
            // NOTE: reason for type cast as undefined as x-mui-datepicker prop type saying Date cant be assigned to undefined.
            minDate: DateMgt.createDayjs('1600-01-01') as unknown as undefined,
          },
        }),

        // Spread in the extra config for the special columns (icon/zoom/details)
        ...([t('dataTable.icon'), t('dataTable.zoom'), t('dataTable.details')].includes(value.alias)
          ? {
              size: 60,
              grow: false,
              enableColumnFilter: false,
              enableColumnActions: false,
              enableSorting: false,
              enableResizing: false,
              enableGlobalFilter: false,
              // GV Pinned columns must never be hidden — Hide All / Show All would put MRT in a
              // GV contradictory pinned+hidden state that triggers repeated onColumnVisibilityChange calls.
              enableHiding: false,
              muiTableBodyCellProps: {
                sx: memoSxClasses.pinnedColumn,
              },
              muiTableHeadCellProps: {
                sx: memoSxClasses.pinnedColumn,
              },
            }
          : {}),

        // GV geoviewID is an internal column that must always remain hidden from the user.
        ...(value.alias === 'geoviewID' ? { enableHiding: false } : {}),
      });
    });

    return columnList;
  }, [
    density,
    getFilterConfig,
    getCellContentDate,
    getCellValueWithTooltip,
    getTableHeader,
    data.fieldInfos,
    displayDateTimezoneUniversal,
    displayDateFormat,
    language,
    memoSxClasses,
    t,
  ]);

  /**
   * Initializes default filter modes for columns using the first available option.
   */
  const memoInitialColumnFilterModes = useMemo<Record<string, string>>(() => {
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
   * Zooms to a feature on the map.
   *
   * @param feature - The feature to zoom to
   * @returns A promise that resolves when zoom completes
   */
  const zoomToFeature = useCallback(
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
        // Transform the coordinate and use a state getter here, because we don't need to hook on value changes in this callback function.
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
            logger.logPromiseFailed('zoomToExtent in zoomToFeature in FeatureInfoNew', error);
          });
      } else {
        // Log error
        logger.logError('Cannot zoom to feature, no extent found.');
      }
    },
    [mapId, layerPath, layerController, mapController]
  );

  /**
   * Handles zoom button clicks.
   */
  const handleZoomClickWrapper = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const index = Number(event.currentTarget.dataset.featureIndex);
      const feature = filteredFeaturesRef.current[index];
      if (feature) {
        zoomToFeature(feature).catch((error) => logger.logError('Zoom failed:', error));
      }
    },
    [zoomToFeature]
  );

  /**
   * Handles details button clicks.
   */
  const handleDetailsClickWrapper = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const index = Number(event.currentTarget.dataset.featureIndex);
      const buttonId = event.currentTarget.id;
      const feature = filteredFeaturesRef.current[index];
      if (feature) {
        dataTableController.setSelectedFeature(feature);
        uiController.enableFocusTrap({ activeElementId: 'featureDetailDataTable', callbackElementId: buttonId });
      }
    },
    [dataTableController, uiController]
  );

  // #endregion

  /**
   * Computes filtered features based on class and time filters.
   */
  const memoFilteredFeatures = useMemo<TypeFeatureInfoEntry[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - memoFilteredFeatures', data.features);

    // In addition, filter on the class renderer filters and the time slider filter
    const layerFilterClassAndTime = LayerFilters.joinWithAnd([layerClassFilter, layerTimeFilter]);

    // Create the filter equation equivalent of the combined filter
    const layerFilterEquation = GeoviewRenderer.createFilterNodeFromFilter(layerFilterClassAndTime);

    // Filter each features
    return (
      data?.features?.filter((f) => {
        return f.feature && GeoviewRenderer.featureRespectsFilterEquation(f.feature, layerFilterEquation);
      }) ?? []
    );
  }, [data.features, layerClassFilter, layerTimeFilter]);

  /**
   * Updates filtered features ref for handler access.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - Sync filteredFeaturesRef', memoFilteredFeatures);

    filteredFeaturesRef.current = memoFilteredFeatures;
  }, [memoFilteredFeatures]);

  /**
   * Builds the data table rows from filtered features.
   */
  const memoRows = useMemo<DataTableRow[]>(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - memoRows', memoFilteredFeatures);

    return memoFilteredFeatures.map((feature, featureIndex) => {
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

      const featureInfo: DataTableRow = {
        gvFeature: feature,
        ICON: icon,
        ZOOM: (
          <IconButton
            data-feature-index={featureIndex}
            color="primary"
            aria-label={`${t('dataTable.zoom')}${feature?.nameField && feature.fieldInfo[feature.nameField] ? ` - ${feature.fieldInfo[feature.nameField]?.value}` : ''}`}
            tooltip={t('dataTable.zoom')}
            tooltipPlacement="top"
            // Function returns void promise instead of void, other work arounds led to more eslint issues
            onClick={handleZoomClickWrapper}
            disabled={!feature.supportZoomTo}
          >
            <ZoomInSearchIcon />
          </IconButton>
        ),
        DETAILS: (
          <IconButton
            id={featureDetailsButtonId}
            data-feature-index={featureIndex}
            color="primary"
            aria-label={`${t('dataTable.details')}${feature?.nameField && feature.fieldInfo[feature.nameField] ? ` - ${feature.fieldInfo[feature.nameField]?.value}` : ''}`}
            tooltip={t('dataTable.details')}
            tooltipPlacement="top"
            onClick={handleDetailsClickWrapper}
          >
            <InfoOutlinedIcon />
          </IconButton>
        ),
        ...feature.fieldInfo,
      };

      return featureInfo;
    });
  }, [memoFilteredFeatures, mapId, containerType, t, handleZoomClickWrapper, handleDetailsClickWrapper]);

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

  /** Ref to the table wrapper element — scopes search input DOM queries to this table instance. */
  const dataTableWrapperRef = useRef<HTMLDivElement>(null);

  /** Ref to track the previous globalFilter value — detects when the clear button is pressed (transition from text to empty). */
  const prevGlobalFilterRef = useRef<string | null>(null);

  /** Ref to the table instance — used to access state in callbacks without adding the table instance to effect deps. */
  const tableInstanceRef = useRef<MRTTableInstance<DataTableRow> | null>(null);

  // Create the Material React Table
  const useTable = useMaterialReactTable<DataTableRow>({
    columns: memoColumns,
    data: memoRows,
    enableDensityToggle: true,
    onDensityChange: handleDensityChange,
    onShowColumnFiltersChange: handleToggleColumnFilters,

    // NOTE: showGlobalFilter as true when layer change and we want to show global filter by default
    initialState: {
      showColumnFilters: datatableSettings[layerPath].columnsFiltersVisibility,
      showGlobalFilter: true,
    },
    state: {
      sorting,
      columnFilters,
      density,
      showColumnFilters,
      columnPinning: { left: ['ICON', 'ZOOM', 'DETAILS'] },
      globalFilter,
      columnFilterFns,
      columnVisibility,
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
    onColumnVisibilityChange,
    enableBottomToolbar: false,
    positionToolbarAlertBanner: 'none', // hide existing row count
    renderTopToolbar: useCallback(
      (props: { table: MRTTableInstance<DataTableRow> }): ReactNode => (
        <TopToolbar
          sxClasses={memoSxClasses}
          layerPath={layerPath}
          t={t}
          globalFilter={globalFilter}
          useTable={props.table}
          columns={memoColumns}
          data={data}
          table={props.table}
          unfilteredFeaturesCount={unfilteredFeaturesCount}
        />
      ),
      [memoSxClasses, layerPath, t, globalFilter, memoColumns, data, unfilteredFeaturesCount]
    ),
    enableFilterMatchHighlighting: true,
    enableColumnResizing: true,
    enableColumnVirtualization: true,
    enablePagination: false,
    enableRowVirtualization: true,
    muiTableContainerProps: {
      sx: memoSxClasses.tableContainer,
      className: 'data-table-container',
    },
    rowVirtualizerInstanceRef,
    columnVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 5 },
    columnVirtualizerOptions: { overscan: 2 },
    localization: dataTableLocalization,
    muiTableHeadCellProps: ({ column }) => ({
      sx: memoSxClasses.tableHeadCell,
      onKeyDown: handleTableHeadKeyDown,
      onFocus: () => setFocusedCell(`header-${column.id}`),
      onBlur: () => setFocusedCell(null),
    }),
    muiColumnActionsButtonProps: {
      onKeyDown: handleColumnActionsKeyDown,
    },
    muiTableHeadProps: {
      sx: memoSxClasses.tableHead,
    },
    defaultColumn: {
      muiFilterTextFieldProps: {
        sx: memoSxClasses.filterTextField,
      },
    },
    // override z-index of table when table is in fullscreen mode
    muiTablePaperProps: ({ table }) => ({
      style: {
        zIndex: table.getState().isFullScreen ? 999999 : undefined,
        height: '100%',
        paddingBottom: '5px', // Add padding to account for by horizontal scrollbar
      },
    }),
    muiTableBodyCellProps: ({ cell }) => ({
      'data-cell-id': cell.id,
      onFocus: handleCellFocus,
      onBlur: handleCellBlur,
    }),
    muiTableBodyProps: {
      sx: memoSxClasses.tableBody,
    },
    // Improve global filter accessibility
    muiSearchTextFieldProps: {
      inputProps: {
        type: 'search',
        'aria-label': t('dataTable.searchInputLabel'),
      },
    },
    // Improve table accessibility
    muiTableProps: {
      'aria-label': t('dataTable.tableAriaLabelWithLayer', { layerName })!,
      'aria-rowcount': memoRows.length + 1, // +1 to account for the header row
    },
    muiTableBodyRowProps: ({ row }) => ({
      'aria-rowindex': row.index + 2, // +2 to account for 1-based indexing and header row
    }),
  });
  tableInstanceRef.current = useTable;

  /**
   * Scrolls to top of table when sorting changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - sorting', sorting);

    // update scroll index when there are some rows in the table.
    const rowsCount = tableInstanceRef.current?.getRowCount() ?? 0;
    // scroll to the top of the table when the sorting changes
    try {
      if (rowsCount > 0) {
        rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
      }
    } catch (error: unknown) {
      logger.logError('Data table error on sorting action', error);
    }
  }, [sorting]);

  /**
   * Sets default column filter modes when columns are available.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - memoInitialColumnFilterModes', memoInitialColumnFilterModes);

    // Only set defaults if we don't have stored values and columns are now available
    if (Object.keys(memoInitialColumnFilterModes).length > 0) {
      setColumnFilterFns((prev) => (Object.keys(prev).length === 0 ? memoInitialColumnFilterModes : prev));
    }
  }, [memoInitialColumnFilterModes]);

  /**
   * Builds filter expression strings from the current column filter state.
   *
   * @param columnFilter - The column filters to convert
   * @returns The list of SQL-like filter expression strings, one per active filter
   */
  const buildFilterList = useCallback(
    (columnFilter: MRTColumnFiltersState): string[] => {
      const tableState = tableInstanceRef.current?.getState();
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
          return `${filterId} ${NUMBER_FILTER[filterFn ?? 'equals']} ${num}`;
        }

        /* -------------------------
         * STRING FILTER (default)
         * ------------------------- */
        const operator = filterFn ?? 'contains';
        const strFilter = STRING_FILTER[operator];

        return strFilter?.replace('filterId', filterId).replace('value', value as string) ?? '';
      });
    },
    [isColumnFilterNumeric]
  );

  /**
   * Applies column filters to the map layer.
   *
   * Passing an empty array clears the map filter.
   *
   * @param filters - The column filters to apply, or an empty array to clear
   */
  const filterMap = useCallback(
    (filters: MRTColumnFiltersState): void => {
      const filterStrings = buildFilterList(filters)
        .filter((filterValue) => filterValue.length)
        .join(' and ');
      dataTableController.applyMapFilters(filterStrings);
    },
    [buildFilterList, dataTableController]
  );

  /**
   * Applies map filters when column filters or the filter-map toggle changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - columnFilters', columnFilters);

    filterMap(mapFilteredRecord ? columnFilters : []);
  }, [columnFilters, filterMap, mapFilteredRecord]);

  /**
   * Saves column filter modes to the store when they change.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('DATA-TABLE - columnFilterFns', columnFilterFns);

    dataTableController.setColumnFilterModesRecord(layerPath, columnFilterFns);
  }, [dataTableController, columnFilterFns, layerPath]);

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

  return (
    <Box ref={dataTableWrapperRef} sx={memoSxClasses.dataTableWrapper} className="data-table-wrapper">
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={language}>
        <MaterialReactTable table={useTable} />
      </LocalizationProvider>
      <LightBoxComponent />
    </Box>
  );
}

export default memo(DataTable);
