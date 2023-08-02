import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, DownloadIcon, Tooltip } from '../../../ui';

interface JSONExportButtonProps {
  features: Record<string, string>[];
}

/**
 * Custom  export button which will help to download data table data in csv format.
 * @param {ColumnsType} dataTableData list of rows to be displayed in data table
 * @param {MRTColumnDef<ColumnsType>[]} columns array of object represent column header data.
 * @returns {JSX.Element} returns export button
 *
 */
function JSONExportButton({ features }: JSONExportButtonProps): JSX.Element {
  const { t } = useTranslation<string>();

  /**
   * build the JSON file
   * @return {JSON.stringify} Json file content
   *
   */
  const getJson = () => {
    // Stringify with some indentation
    return JSON.stringify(features, null, 2);
  };

  /**
   * export the blob to a file
   * @param {Blob} blob the blob to save to file
   * @param {string} filename file name
   */
  const exportBlob = (blob: Blob, filename: string) => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  /**
   * Export data table in csv format.
   */
  const handleExportData = () => {
    const jsonString = getJson();
    const blob = new Blob([jsonString], {
      type: 'text/json',
    });

    exportBlob(blob, `table.json`);
  };

  return (
    <IconButton onClick={handleExportData}>
      <Tooltip title={t('dataTable.jsonExportBtn')} placement="bottom" enterDelay={100}>
        <DownloadIcon />
      </Tooltip>
    </IconButton>
  );
}

export default JSONExportButton;
