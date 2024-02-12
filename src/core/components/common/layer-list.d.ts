import { ReactNode } from 'react';
import { TypeLayerStatus, TypeQueryStatus } from '@/app';
export interface LayerListEntry {
    layerName: string;
    layerPath: string;
    layerStatus: TypeLayerStatus;
    queryStatus: TypeQueryStatus;
    layerFeatures?: ReactNode;
    mapFilteredIcon?: ReactNode;
    tooltip?: ReactNode;
    numOffeatures?: number;
}
interface LayerListProps {
    isEnlargeDataTable: boolean;
    layerList: LayerListEntry[];
    selectedLayerPath: string;
    handleListItemClick: (layer: LayerListEntry) => void;
}
/**
 * Create a list of layers
 * @param {LayerListEntry} layerList  Array of layer list entries.
 * @param {boolean} isEnlargeDataTable  Boolean value if right panel is enlarged or not.
 * @param {number} selectedLayerIndex  Current index of list item selected.
 * @param {string} selectedLayerPath  Selected path of the layer.
 * @param {Function} handleListItemClick  Callback function excecuted when list item is clicked.
 * @returns
 */
export declare function LayerList({ layerList, isEnlargeDataTable, selectedLayerPath, handleListItemClick }: LayerListProps): import("react").JSX.Element;
export {};
