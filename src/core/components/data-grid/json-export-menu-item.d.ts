/// <reference types="react" />
import { GridExportMenuItemProps } from '@mui/x-data-grid';
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
declare function JsonExportMenuItem({ hideMenu, rows, layerKey }: JsonExportMenuItemProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof JsonExportMenuItem>;
export default _default;
