import { ButtonProps } from '@mui/material';
import {
  GridCsvExportMenuItem,
  GridCsvExportOptions,
  GridPrintExportMenuItem,
  GridPrintExportOptions,
  GridToolbarExportContainer,
} from '@mui/x-data-grid';
import { memo } from 'react';
import JsonExportMenuItem from './json-export-menu-item';
import { Rows } from './menu-data-grid';

type ExportButtonProps = ButtonProps & {
  rows: Rows[];
  layerKey: string;
};

/**
 * Custom the export menu, adding the export json button
 * @param {ButtonProps} propsButton material ui button props.
 * @param {rows} rows list of rows to be displayed in data-grid table
 * @param {layerId} layerId unique id of layers rendered in map.
 * @return {GridToolbarExportContainer} export menu
 *
 */
function ExportButton({ rows, layerKey, ...rest }: ExportButtonProps) {
  const csvOptions: GridCsvExportOptions = { delimiter: ';' };
  const printOptions: GridPrintExportOptions = {};

  return (
    <GridToolbarExportContainer {...rest}>
      <GridCsvExportMenuItem options={csvOptions} />
      <JsonExportMenuItem rows={rows} layerKey={layerKey} />
      <GridPrintExportMenuItem options={printOptions} />
    </GridToolbarExportContainer>
  );
}

export default memo(ExportButton);
