import type { ReactElement } from 'react';
import { useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import type { Options } from 'export-to-csv';
import { ExportToCsv } from 'export-to-csv';

import type { MRT_ColumnDef as MRTColumnDef } from 'material-react-table';

import { IconButton, DownloadIcon, Menu, MenuItem } from '@/ui';
import { logger } from '@/core/utils/logger';
import type { ColumnsType } from './data-table-types';
import { useStoreLayerName } from '@/core/stores/store-interface-and-intial-values/layer-state';

/** Properties for the ExportButton component. */
interface ExportButtonProps {
  layerPath: string;
  rows: ColumnsType[];
  columns: MRTColumnDef<ColumnsType>[];
  children?: ReactElement | undefined;
}

/** The columns to remove from the data when exporting */
const COLUMNS_TO_REMOVE = ['ICON', 'ZOOM', 'DETAILS', 'geoviewID'];

/**
 * Renders an export button with a menu for downloading data table data.
 *
 * @param props - ExportButton properties
 * @returns The export button element
 */
function ExportButton({ layerPath, rows, columns, children }: ExportButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/export-button');

  const { t } = useTranslation<string>();
  const layerName = useStoreLayerName(layerPath) ?? '';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  /**
   * Builds CSV options for download.
   */
  const memoGetCsvOptions = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - EXPORT BUTTON - memoGetCsvOptions', columns);

    // Remove the utility columns
    const filteredColumns = columns.filter((col) => !COLUMNS_TO_REMOVE.includes(col.id as string));

    return (): Options => ({
      filename: `table-${layerName.replaceAll(' ', '-')}`,
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useBom: true,
      useKeysAsHeaders: false,
      headers: filteredColumns.map((c) => c.id as string),
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
            // eslint-disable-next-line no-param-reassign
            acc[curr] = row[curr]?.value ?? '';
          }
          return acc;
        },
        {} as Record<string, unknown>
      );
      return mappedRow;
    });
    const csvExporter = new ExportToCsv(memoGetCsvOptions());
    csvExporter.generateCsv(csvRows);
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
