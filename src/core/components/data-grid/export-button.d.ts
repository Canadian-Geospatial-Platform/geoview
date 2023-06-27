/// <reference types="react" />
import { ButtonProps } from '@mui/material';
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
declare function ExportButton({ rows, layerKey, ...rest }: ExportButtonProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof ExportButton>;
export default _default;
