/// <reference types="react" />
import { TypeFieldEntry, TypeFeatureInfoEntry } from '@/app';
export interface DataTableDataEntrys extends TypeFeatureInfoEntry {
    rows: Record<string, string>;
}
export interface DataTableData {
    features: DataTableDataEntrys[];
    fieldAliases: Record<string, TypeFieldEntry>;
}
export interface ColumnsType {
    ICON: string;
    ZOOM: string;
    [key: string]: string;
}
interface DataTableProps {
    data: DataTableData;
    layerId: string;
    mapId: string;
    layerKey: string;
    tableHeight: number;
}
/**
 * Build Data table from map.
 * @param {DataTableProps} data map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {number} tableHeight Height of the container which contains all rows.
 * @return {ReactElement} Data table as react element.
 */
declare function DataTable({ data, layerId, mapId, layerKey, tableHeight }: DataTableProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof DataTable>;
export default _default;
