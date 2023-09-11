import React from 'react';
import { Projection } from 'ol/proj';
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
    projectionConfig: Projection;
}
/**
 * Build Data table from map.
 * @param {MapDataTableProps} data map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @param {string} layerKey key of the layer.
 * @param {Projection} projectionConfig projection config to transfer lat long.
 * @return {ReactElement} Data table as react element.
 */
declare function MapDataTable({ data, layerId, mapId, layerKey, projectionConfig }: MapDataTableProps): React.JSX.Element;
export default MapDataTable;
