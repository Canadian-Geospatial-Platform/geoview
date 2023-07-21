import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExportToCsv } from 'export-to-csv';
import { type MRT_ColumnDef as MRTColumnDef } from 'material-react-table';
import { IconButton, DownloadIcon, Tooltip } from '../../../ui';
import { ColumnsType } from './data-table';

interface ExportButtonProps {
  dataTableData: ColumnsType[];
  columns: MRTColumnDef<ColumnsType>[];
}

/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {ColumnsType} dataTableData list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @returns {JSX.Element} returns export button
 *
 */
function ExportButton({ dataTableData, columns }: ExportButtonProps): JSX.Element {
  const { t } = useTranslation<string>();
  /**
   * Build CSV Options for download.
   */
  const getCsvOptions = () => ({
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    useBom: true,
    useKeysAsHeaders: false,
    headers: columns.map((c) => c.header),
  });

  /**
   * Export data table in csv format.
   */
  const handleExportData = () => {
    const csvExporter = new ExportToCsv(getCsvOptions());
    csvExporter.generateCsv(dataTableData);
  };

  return (
    <IconButton onClick={handleExportData}>
      <Tooltip title={t('dataTable.exportBtn')} placement="bottom" enterDelay={100}>
        <DownloadIcon />
      </Tooltip>
    </IconButton>
  );
}

export default ExportButton;
