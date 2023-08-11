import React from 'react';
import { Extent } from 'ol/extent';
import { Geometry } from 'ol/geom';
interface FeatureInfo {
    featureInfoKey: string;
    featureInfoValue: string | number;
    fieldType: string;
}
export interface Features {
    geometry: Geometry;
    extent?: Extent;
    featureKey?: FeatureInfo;
    featureIcon?: FeatureInfo;
    featureActions?: FeatureInfo;
    rows: Record<string, string>;
}
export interface MapDataTableData {
    features: Features[];
    fieldAliases: Record<string, string>;
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
}
/**
 * Build Data table from map.
 * @param {MapDataTableProps} data map data which will be used to build data table.
 * @param {string} layerId id of the layer
 * @param {string} mapId id of the map.
 * @return {ReactElement} Data table as react element.
 */
declare function MapDataTable({ data, layerId, mapId }: MapDataTableProps): React.JSX.Element;
export default MapDataTable;
