/* eslint-disable camelcase */
import { useCallback } from 'react';

import type { MRT_TableInstance as MRTTableInstance, MRT_ColumnDef } from 'material-react-table';
import {
  MRT_GlobalFilterTextField as MRTGlobalFilterTextField,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
} from 'material-react-table';

import { Box, IconButton, Switch } from '@/ui';
import ExportButton from './export-button';
import { ShowHideColumnsButton } from './show-hide-columns-button';
import JSONExportButton from './json-export-button';
import FilterMap from './filter-map';
import FilterDataToExtent from './filter-data-extent';
import type { DataTableRow } from './data-table-types';
import { useToolbarActionMessage } from './hooks/useToolbarActionMessage';
import type { TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { SxStyles } from '@/ui/style/types';
import { ClearFiltersIcon } from '@/ui/icons';
import { useStoreAppShowUnsymbolizedFeatures } from '@/core/stores/states/app-state';
import { logger } from '@/core/utils/logger';

/** Properties for the TopToolbar component. */
// GV: Disabled prop-types for this to work. From the react 19 ugprade guide it seems that prop-types are deprecated.
interface TopToolbarProps<TData extends DataTableRow> {
  /** Classes or styles for the component. */
  sxClasses: SxStyles;

  /** The path for the current layer being processed. */
  layerPath: string;

  /** Translation function for internationalization. */
  t: (key: string) => string;

  /** The current global filter value. */
  globalFilter: string | null;

  /** Utility functions provided by the table instance. */
  useTable: {
    resetColumnFilters: () => void;
    getFilteredRowModel: () => { rows: Array<{ original: TData }> };
  } | null;

  /** Column definitions for the table. */
  columns: MRT_ColumnDef<DataTableRow, unknown>[];

  /** The data object containing features for the table. */
  data: {
    features?: TypeFeatureInfoEntry[] | null;
  };

  /** The Material React Table instance. */
  table: MRTTableInstance<DataTableRow>;

  /** The count of features before any filters are applied. */
  unfilteredFeaturesCount?: number;
}

/**
 * Checks if a filter value is active (non-empty).
 *
 * NOTE: No trace logging — this is a pure predicate function called
 * multiple times per render cycle and would create excessive log noise.
 *
 * @param value - The filter value to check
 * @returns Whether the filter value is active (not undefined, null, or empty string)
 */
function isFilterValueActive(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((v) => v !== undefined && v !== null && v !== '');
  }
  return value !== undefined && value !== null && value !== '';
}

/**
 * Creates the top toolbar for the data table with filters, search, and export controls.
 *
 * @param props - Properties defined in TopToolbarProps interface
 * @returns The top toolbar element
 */
function TopToolbar(props: TopToolbarProps<DataTableRow>): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/top-toolbar');

  const { sxClasses, layerPath, t, globalFilter, useTable, columns, data, table, unfilteredFeaturesCount } = props;

  const showUnsymbolizedFeatures = useStoreAppShowUnsymbolizedFeatures();

  // Get toolbar message
  const toolbarMessage = useToolbarActionMessage({
    data: data,
    layerPath,
    tableInstance: table,
    columnFilters: table.getState().columnFilters,
    globalFilter: table.getState().globalFilter ?? '',
    showUnsymbolizedFeatures: showUnsymbolizedFeatures,
    unfilteredFeaturesCount: unfilteredFeaturesCount || 0,
  });

  // ESRI Dynamic layer data does not include geometry and can't be filtered to extent
  const isEsriDynamic = data.features?.[0]?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;

  // Check if there are any active filters (column filters OR global search filter)
  const hasActiveFilters =
    table.getState().columnFilters?.some((filter) => isFilterValueActive(filter.value)) ||
    isFilterValueActive(table.getState().globalFilter);

  // #region Handlers

  /**
   * Handles clearing all active filters (column filters and global search filter).
   */
  const handleClearFilters = useCallback((): void => {
    // Check filters at runtime instead of using closure
    const columnFiltersActive = table.getState().columnFilters?.some((filter) => isFilterValueActive(filter.value));
    const globalFilterActive = isFilterValueActive(table.getState().globalFilter);

    if (columnFiltersActive || globalFilterActive) {
      useTable?.resetColumnFilters();
      table.setGlobalFilter('');
    }
  }, [useTable, table]);

  // #endregion

  return (
    <Box className="data-table-top-toolbar" role="region" aria-label={t('dataTable.tableControls')} sx={sxClasses.toolbarContainer}>
      <Box sx={sxClasses.toolbarRow}>
        <Box component="p" role="status" className="filter-results-summary" sx={sxClasses.selectedRows} aria-live="polite">
          {toolbarMessage}
        </Box>
        <Box>
          <form role="search" onSubmit={(e) => e.preventDefault()} aria-label={t('dataTable.searchInputLabel')}>
            <MRTGlobalFilterTextField className="buttonOutline" table={table} />
          </form>
        </Box>
      </Box>
      <Box sx={sxClasses.toolbarRow}>
        <Box>
          <FilterMap layerPath={layerPath} isGlobalFilterOn={!!globalFilter?.length} />
          {!isEsriDynamic && <FilterDataToExtent layerPath={layerPath} />}
        </Box>
        <Box sx={sxClasses.toolbarControls}>
          <Switch
            checked={table.getState().showColumnFilters}
            onChange={() => table.setShowColumnFilters(!table.getState().showColumnFilters)}
            size="small"
            label={
              table.getState().showColumnFilters
                ? `${t('general.hide')} ${t('dataTable.filterToggle')}`
                : `${t('general.show')} ${t('dataTable.filterToggle')}`
            }
            sx={sxClasses.filterMap}
          />

          <Box sx={sxClasses.toolbarButtonGroup}>
            <IconButton
              className="buttonOutline"
              aria-label={t('dataTable.clearFilters')}
              aria-disabled={!hasActiveFilters}
              color="primary"
              onClick={handleClearFilters}
            >
              <ClearFiltersIcon />
            </IconButton>

            {/* Override column pinning options */}
            <ShowHideColumnsButton table={table} />
            <MRTToggleDensePaddingButton className="buttonOutline" table={table} aria-pressed={table.getState().density === 'compact'} />

            {/* Export Buttons */}
            {useTable?.getFilteredRowModel()?.rows ? (
              <ExportButton layerPath={layerPath} rows={useTable.getFilteredRowModel().rows.map((row) => row.original)} columns={columns}>
                <JSONExportButton
                  rows={useTable.getFilteredRowModel().rows.map((row) => row.original)}
                  features={data.features as TypeFeatureInfoEntry[]}
                  layerPath={layerPath}
                />
              </ExportButton>
            ) : undefined}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default TopToolbar;
