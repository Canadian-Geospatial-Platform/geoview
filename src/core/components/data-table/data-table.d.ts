/// <reference types="react" />
import { MappedLayerDataType } from './data-panel';
export interface FieldInfos {
    alias: string;
    dataType: string;
    domain?: string;
    fieldKey: number;
    value: string | null;
}
export interface ColumnsType {
    ICON: FieldInfos;
    ZOOM: FieldInfos;
    [key: string]: FieldInfos;
}
interface DataTableProps {
    data: MappedLayerDataType;
    layerPath: string;
    tableHeight: number;
}
/**
 * Build Data table from map.
 * @param {DataTableProps} data map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {number} tableHeight Height of the container which contains all rows.
 * @return {ReactElement} Data table as react element.
 */
declare function DataTable({ data, layerPath, tableHeight }: DataTableProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof DataTable>;
export default _default;
