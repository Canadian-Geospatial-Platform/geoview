import { DataTableProps } from './data-table-types';
/**
 * Build Data table from map.
 * @param {DataTableProps} data map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {string} tableHeight Height of the container which contains all rows.
 * @returns {JSX.Element} Data table as react element.
 */
declare function DataTable({ data, layerPath, tableHeight }: DataTableProps): JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof DataTable>;
export default _default;
