import { memo } from 'react';
import { MenuItem } from '@mui/material';
import { GridExportMenuItemProps, useGridApiContext, gridFilteredSortedRowIdsSelector, GridRowId } from '@mui/x-data-grid';
import { t } from 'i18next';
import { Rows } from './menu-data-grid';

interface JsonExportMenuItemProps extends GridExportMenuItemProps<object> {
  rows: Rows[];
  layerKey: string;
}

/**
 * the export Json item added in menu
 * @param {hideMenu} hideMenu function to be called after export of json is done.
 * @param {rows} Rows to be displayed in data grid
 * @param {layerId} layerId unique id of layers rendered in map.
 * @returns {MenuItem} item to be dispayed.
 */

function JsonExportMenuItem({ hideMenu, rows, layerKey }: JsonExportMenuItemProps) {
  const apiRef = useGridApiContext();
  /**
   * build the JSON file
   * @param {GridRowId} gridRowIds the array of the rowId
   * @return {JSON.stringify} Json gile content
   *
   */
  const getJson = (gridRowIds: GridRowId[]) => {
    const geoData = gridRowIds.map((gridRowId) => {
      const { geometry, ...featureInfo } = rows[gridRowId as number];
      delete featureInfo.featureKey;
      delete featureInfo.featureIcon;
      delete featureInfo.featureActions;
      delete featureInfo.extent;
      return {
        type: 'Feature',
        geometry,
        properties: featureInfo,
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
   * Export blob when menu item clicked.
   */
  const onMenuItemClick = () => {
    const jsonString = getJson(gridFilteredSortedRowIdsSelector(apiRef));
    const blob = new Blob([jsonString], {
      type: 'text/json',
    });
    exportBlob(blob, `DataGrid_${layerKey.replaceAll('/', '-').replaceAll('.', '-')}.json`);
    // Hide the export menu after the export
    hideMenu?.();
  };

  return <MenuItem onClick={() => onMenuItemClick()}>{t('datagrid.exportJson')}</MenuItem>;
}

export default memo(JsonExportMenuItem);
