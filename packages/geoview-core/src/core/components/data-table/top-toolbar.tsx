import React from 'react';
import { Box, IconButton } from '@mui/material';
/* eslint-disable camelcase */
import {
  MRT_GlobalFilterTextField as MRTGlobalFilterTextField,
  MRT_ToggleFiltersButton as MRTToggleFiltersButton,
  MRT_ShowHideColumnsButton as MRTShowHideColumnsButton,
  MRT_ToggleDensePaddingButton as MRTToggleDensePaddingButton,
  MRT_TableInstance as MRTTableInstance,
  MRT_ColumnDef,
} from 'material-react-table';
import ClearFiltersIcon from '@mui/icons-material/ClearAll';
import ExportButton from './export-button';
import JSONExportButton from './json-export-button';
import FilterMap from './filter-map';
import { ColumnsType } from './data-table-types';
import { TypeFeatureInfoEntry } from '@/api/config/types/map-schema-types';
import { SxStyles } from '@/ui/style/types';

// GV: Disabled prop-types for this to work. From the react 19 ugprade guide it seems that prop-types are deprecated.
interface TopToolbarProps<TData extends ColumnsType> {
  /**
   * Classes or styles for the component.
   */
  sxClasses: SxStyles;

  /**
   * Settings for the datatable, indexed by layerPath.
   */
  datatableSettings: Record<string, { toolbarRowSelectedMessageRecord: string }>;

  /**
   * The path for the current layer being processed.
   */
  layerPath: string;

  /**
   * Translation function for internationalization.
   */
  t: (key: string) => string;

  /**
   * The current global filter value.
   */
  globalFilter: string | null;

  /**
   * Utility functions provided by the table instance.
   */
  useTable: {
    resetColumnFilters: () => void;
    getFilteredRowModel: () => { rows: Array<{ original: TData }> };
  } | null;

  /**
   * Column definitions for the table.
   */
  columns: MRT_ColumnDef<ColumnsType, unknown>[];

  /**
   * The data object containing features for the table.
   */
  data: {
    features?: TypeFeatureInfoEntry[] | null;
  };

  table: MRTTableInstance<ColumnsType>;
}

function TopToolbar(props: TopToolbarProps<ColumnsType>): JSX.Element {
  const { sxClasses, datatableSettings, layerPath, t, globalFilter, useTable, columns, data, table } = props;
  return (
    <Box display="flex" sx={{ justifyContent: 'space-between', borderBottom: '1px solid #9e9e9e' }} p={4}>
      <Box display="flex" sx={{ flexDirection: 'column', justifyContent: 'space-evenly' }}>
        <Box sx={sxClasses.selectedRows}>{datatableSettings[layerPath].toolbarRowSelectedMessageRecord}</Box>
        <Box display="flex">
          <Box sx={sxClasses.selectedRows}>{t('dataTable.filterMap')}</Box>
          <FilterMap layerPath={layerPath} isGlobalFilterOn={!!globalFilter?.length} />
        </Box>
      </Box>
      <Box display="flex" sx={{ flexDirection: 'column' }}>
        <Box sx={{ float: 'right', marginLeft: 'auto', maxWidth: '15rem' }}>
          <MRTGlobalFilterTextField className="buttonOutline" table={table} />
        </Box>
        <Box display="flex" sx={{ justifyContent: 'space-around' }}>
          <IconButton
            className="buttonOutline"
            title={t('dataTable.clearFilters')}
            color="primary"
            onClick={() => useTable?.resetColumnFilters()}
          >
            <ClearFiltersIcon />
          </IconButton>

          <MRTToggleFiltersButton className="buttonOutline" table={table} />
          {/* Override column pinning options */}
          <MRTShowHideColumnsButton
            className="buttonOutline"
            table={{ ...table, options: { ...table.options, enableColumnPinning: false } }}
          />
          <MRTToggleDensePaddingButton className="buttonOutline" table={table} />

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
  );
}

export default React.memo(TopToolbar);
