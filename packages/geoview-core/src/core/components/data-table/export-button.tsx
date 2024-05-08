import { ReactElement, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { ExportToCsv, Options } from 'export-to-csv';

import { type MRT_ColumnDef as MRTColumnDef } from 'material-react-table';

import { IconButton, DownloadIcon, Tooltip, Menu, MenuItem } from '@/ui';
import { logger } from '@/core/utils/logger';
import { ColumnsType } from './data-table';

interface ExportButtonProps {
  rows: ColumnsType[];
  columns: MRTColumnDef<ColumnsType>[];
  children?: ReactElement | undefined;
}

/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {ColumnsType} rows list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @param {ReactElement} children Menu item to be rendered in Menu.
 * @returns {JSX.Element} returns export button
 *
 */
function ExportButton({ rows, columns, children }: ExportButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/export-button');

  const { t } = useTranslation<string>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * Show export menu.
   */

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  /**
   * Close export menu.
   */

  const handleClose = (): void => {
    setAnchorEl(null);
  };

  /**
   * Build CSV Options for download.
   */
  const getCsvOptions = (): Options => {
    return {
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useBom: true,
      useKeysAsHeaders: false,
      headers: columns.map((c) => c.id as string),
    };
  };

  /**
   * Export data table in csv format.
   */
  const handleExportData = (): void => {
    // format the rows for csv.
    const csvRows = rows.map((row) => {
      const mappedRow = Object.keys(row).reduce((acc, curr) => {
        acc[curr] = row[curr]?.value ?? '';
        return acc;
      }, {} as Record<string, string | null>);
      return mappedRow;
    });
    const csvExporter = new ExportToCsv(getCsvOptions());
    csvExporter.generateCsv(csvRows);
  };

  return (
    <>
      <IconButton onClick={handleClick} className="style1">
        <Tooltip title={t('dataTable.exportBtn')} placement="bottom" enterDelay={100}>
          <DownloadIcon />
        </Tooltip>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={handleExportData}>{t('dataTable.downloadAsCSV')}</MenuItem>
        {children}
      </Menu>
    </>
  );
}

// TODO: Refactor - Remove defaltProps as it's no longer a good practice
ExportButton.defaultProps = { children: '' };

export default ExportButton;
