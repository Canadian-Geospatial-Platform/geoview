/// <reference types="react" />
import { MapDataTableData as MapDataTableDataProps } from './map-data-table';
import { GroupLayers } from './data-table-api';
import { TypeDisplayLanguage } from '@/geo/map/map-schema-types';
export interface LayersDataType extends MapDataTableDataProps, GroupLayers {
}
interface DatapanelProps {
    layerData: LayersDataType[];
    mapId: string;
    language: TypeDisplayLanguage;
}
/**
 * Build Data panel from map.
 * @param {LayersDataType[]} layerData map data which will be used to build data table.
 * @param {string} mapId id of the map.
 * @return {ReactElement} Data table as react element.
 */
export declare function Datapanel({ layerData, mapId, language }: DatapanelProps): import("react").JSX.Element;
export {};
