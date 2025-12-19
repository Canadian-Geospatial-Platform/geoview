import type { ReactNode } from 'react';
import type { TypeFeatureInfoEntry, TypeQueryStatus } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
export interface LayerListEntry {
    content?: string | ReactNode;
    layerName: string;
    layerPath: string;
    layerStatus: TypeLayerStatus;
    queryStatus: TypeQueryStatus;
    layerFeatures?: ReactNode;
    mapFilteredIcon?: ReactNode;
    tooltip?: JSX.Element | string;
    numOffeatures?: number;
    features?: TypeFeatureInfoEntry[] | undefined | null;
    layerUniqueId?: string;
    isDisabled?: boolean;
}
interface LayerListProps {
    layerList: LayerListEntry[];
    selectedLayerPath: string | undefined;
    onListItemClick: (layer: LayerListEntry) => void;
}
interface LayerListItemProps {
    id: string;
    isSelected: boolean;
    layer: LayerListEntry;
    onListItemClick: (layer: LayerListEntry) => void;
}
export declare const LayerListItem: import("react").NamedExoticComponent<LayerListItemProps>;
/**
 * Create a list of layers
 * @param {LayerListEntry} layerList  Array of layer list entries.
 * @param {boolean} isEnlarged Boolean value if right panel is enlarged or not.
 * @param {number} selectedLayerIndex  Current index of list item selected.
 * @param {string} selectedLayerPath  Selected path of the layer.
 * @param {Function} onListItemClick  Callback function executed when list item is clicked.
 * @returns {JSX.Element}
 */
export declare const LayerList: import("react").NamedExoticComponent<LayerListProps>;
export {};
//# sourceMappingURL=layer-list.d.ts.map