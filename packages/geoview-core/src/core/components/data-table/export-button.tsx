import { ReactElement, useState, useCallback, useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import { ExportToCsv, Options } from 'export-to-csv';

import { type MRT_ColumnDef as MRTColumnDef } from 'material-react-table';

import { IconButton, DownloadIcon, Menu, MenuItem } from '@/ui';
import { logger } from '@/core/utils/logger';
import { ColumnsType } from './data-table-types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';

interface ExportButtonProps {
  layerPath: string;
  rows: ColumnsType[];
  columns: MRTColumnDef<ColumnsType>[];
  children?: ReactElement | undefined;
}

/** The columns to remove from the data when exporting */
const COLUMNS_TO_REMOVE = ['ICON', 'ZOOM', 'DETAILS', 'geoviewID'];

/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {string} layerPath id of the layer
 * @param {ColumnsType} rows list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @param {ReactElement} children Menu item to be rendered in Menu.
 * @returns {JSX.Element} returns export button
 *
 */
function ExportButton({ layerPath, rows, columns, children }: ExportButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/export-button');

  const { getLayer } = useLayerStoreActions();

  const { t } = useTranslation<string>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * Shows export menu.
   */
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    // Log
    logger.logTraceUseCallback('DATA-TABLE - EXPORT BUTTON - handleClick');

    setAnchorEl(event.currentTarget);
  }, []);

  /**
   * Closes export menu.
   */
  const handleClose = useCallback(() => {
    // Log
    logger.logTraceUseCallback('DATA-TABLE - EXPORT BUTTON - handleClose');

    setAnchorEl(null);
  }, []);

  /**
   * Builds CSV Options for download.
   */
  const getCsvOptions = useMemo(() => {
    // Log
    logger.logTraceUseMemo('DATA-TABLE - EXPORT BUTTON - getCsvOptions', columns);

    // Remove the utility columns
    const filteredColumns = columns.filter((col) => !COLUMNS_TO_REMOVE.includes(col.id as string));

    return (): Options => ({
      filename: `table-${getLayer(layerPath)?.layerName.replaceAll(' ', '-')}`,
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useBom: true,
      useKeysAsHeaders: false,
      headers: filteredColumns.map((c) => c.id as string),
    });
  }, [columns, getLayer, layerPath]);

  /**
   * Exports data table in csv format.
   */
  const handleExportData = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('DATA-TABLE - EXPORT BUTTON - handleExportData');

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
    const csvExporter = new ExportToCsv(getCsvOptions());
    csvExporter.generateCsv(csvRows);
    setAnchorEl(null);
  }, [getCsvOptions, rows]);

  return (
    <>
      <IconButton onClick={handleClick} tooltip={t('dataTable.exportBtn')!} className="buttonOutline">
        <DownloadIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleExportData}>{t('dataTable.downloadAsCSV')}</MenuItem>
        {children}
      </Menu>
    </>
  );
}

export default ExportButton;
