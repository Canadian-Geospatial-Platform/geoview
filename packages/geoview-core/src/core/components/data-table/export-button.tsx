import type { ReactElement } from 'react';
import { useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { mkConfig, generateCsv, download } from 'export-to-csv';

import type { MRT_ColumnDef as MRTColumnDef } from 'material-react-table';

import { IconButton, DownloadIcon, Menu, MenuItem } from '@/ui';
import { logger } from '@/core/utils/logger';
import type { DataTableRow } from './data-table-types';
import { useStoreLayerName } from '@/core/stores/store-interface-and-intial-values/layer-state';

/** Properties for the ExportButton component. */
interface ExportButtonProps {
  layerPath: string;
  rows: DataTableRow[];
  columns: MRTColumnDef<DataTableRow>[];
  children?: ReactElement | undefined;
}

/** The columns to remove from the data when exporting */
const COLUMNS_TO_REMOVE = ['ICON', 'ZOOM', 'DETAILS', 'geoviewID'];

/**
 * Creates an export button component with CSV download menu.
 *
 * @param props - Properties defined in ExportButtonProps interface
 * @returns The export button element
 */
function ExportButton({ layerPath, rows, columns, children }: ExportButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/export-button');

  const { t } = useTranslation<string>();
  const layerName = useStoreLayerName(layerPath) ?? '';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // #region Handlers

  /**
   * Shows the export menu.
   */
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * Closes the export menu.
   */
  const handleClose = useCallback((): void => {
    setAnchorEl(null);
  }, []);

  // #endregion

  /**
   * Builds CSV options for download.
   */
  const memoGetCsvOptions = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - EXPORT BUTTON - memoGetCsvOptions', columns);

    // Remove the utility columns
    const filteredColumns = columns.filter((col) => !COLUMNS_TO_REMOVE.includes(col.id as string));

    return () => ({
      filename: `table-${layerName.replaceAll(' ', '-')}`,
      fieldSeparator: ',',
      quoteStrings: true,
      decimalSeparator: '.',
      useBom: true,
      useKeysAsHeaders: false,
      columnHeaders: filteredColumns.map((c) => c.id as string),
    });
  }, [columns, layerName]);

  /**
   * Exports data table in CSV format.
   */
  const handleExportData = useCallback((): void => {
    // format the rows for csv.
    const csvRows = rows.map((row) => {
      const mappedRow = Object.keys(row).reduce(
        (acc, curr) => {
          // Only add the field if it's not a utility column
          if (!COLUMNS_TO_REMOVE.includes(curr)) {
            const value = row[curr];
            // Only extract value from TypeFieldEntry objects (not ReactElements)
            if (value && typeof value === 'object' && 'value' in value) {
              // eslint-disable-next-line no-param-reassign
              acc[curr] = String(value.value ?? '');
            }
          }
          return acc;
        },
        {} as Record<string, string>
      );
      return mappedRow;
    });
    const csvConfig = mkConfig(memoGetCsvOptions());
    const csv = generateCsv(csvConfig)(csvRows);
    download(csvConfig)(csv);
    setAnchorEl(null);
  }, [memoGetCsvOptions, rows]);

  return (
    <>
      <IconButton
        onClick={handleClick}
        aria-controls={open ? 'data-table-export-menu' : undefined}
        aria-expanded={open ? 'true' : 'false'}
        aria-haspopup="true"
        aria-label={t('dataTable.exportBtn')}
        className="buttonOutline"
      >
        <DownloadIcon />
      </IconButton>
      <Menu id="data-table-export-menu" anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleExportData}>{t('dataTable.downloadAsCSV')}</MenuItem>
        {children}
      </Menu>
    </>
  );
}

export default ExportButton;
