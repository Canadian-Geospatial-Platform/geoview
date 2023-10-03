import React from 'react';
import { Projection } from 'ol/proj';
import { MapDataTableData as MapDataTableDataProps } from './map-data-table';
interface DatapanelProps {
    layerIds: string[];
    layerData: MapDataTableDataProps[];
    mapId: string;
    projectionConfig: Projection;
    layerKeys: string[];
}
/**
 * Build Data panel from map.
 * @param {MapDataTableProps} layerData map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @param {string} layerKeys list of keys of the layer.
 * @param {Projection} projectionConfig projection config to transfer lat long.
 * @return {ReactElement} Data table as react element.
 */
export declare function Datapanel({ layerData, mapId, projectionConfig, layerKeys, layerIds }: DatapanelProps): React.JSX.Element;
export {};
