import React from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem } from '../../../ui';
import { Features } from './map-data-table';

interface JSONExportButtonProps {
  features: Features[];
  layerId: string;
}

/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {Features} features list of rows to be displayed in data table
 * @param {string} layerId id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
function JSONExportButton({ features, layerId }: JSONExportButtonProps): JSX.Element {
  const { t } = useTranslation<string>();

  /**
   * build the JSON file
   * @return {JSON.stringify} Json file content
   *
   */
  const getJson = () => {
    const geoData = features.map((feature) => {
      const { geometry, rows } = feature;
      return {
        type: 'Feature',
        geometry,
        properties: rows,
      };
    });

    // Stringify with some indentation
    return JSON.stringify({ type: 'FeatureCollection', features: geoData }, null, 2);
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

    exportBlob(blob, `table-${layerId}.json`);
  };

  return <MenuItem onClick={handleExportData}>{t('dataTable.jsonExportBtn')}</MenuItem>;
}

export default JSONExportButton;
