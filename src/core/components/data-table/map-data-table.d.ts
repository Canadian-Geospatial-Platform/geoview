/// <reference types="react" />
import { TypeFieldEntry, TypeFeatureInfoEntry } from '@/app';
export interface MapDataTableDataEntrys extends TypeFeatureInfoEntry {
    rows: Record<string, string>;
}
export interface MapDataTableData {
    features: MapDataTableDataEntrys[];
    fieldAliases: Record<string, TypeFieldEntry>;
}
export interface ColumnsType {
    ICON: string;
    ZOOM: string;
    [key: string]: string;
}
interface MapDataTableProps {
    data: MapDataTableData;
    layerId: string;
    mapId: string;
    layerKey: string;
}
/**
 * Build Data table from map.
 * @param {MapDataTableProps} data map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @return {ReactElement} Data table as react element.
 */
declare function MapDataTable({ data, layerId, mapId, layerKey }: MapDataTableProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof MapDataTable>;
export default _default;
