import type { ReactNode } from 'react';
import type { TypeFeatureInfoEntry, TypeQueryStatus } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
/** Represents an entry in the layer list. */
export interface LayerListEntry {
    content?: string | ReactNode;
    layerName: string;
    layerPath: string;
    layerStatus: TypeLayerStatus;
    queryStatus: TypeQueryStatus;
    layerFeatures?: string;
    mapFilteredIcon?: ReactNode;
    tooltip?: JSX.Element | string;
    numOffeatures?: number;
    features?: TypeFeatureInfoEntry[] | undefined;
    layerUniqueId?: string;
    isDisabled?: boolean;
}
/** Properties for the LayerList component. */
interface LayerListProps {
    layerList: LayerListEntry[];
    selectedLayerPath: string | undefined;
    onListItemClick: (layer: LayerListEntry) => void;
}
/** Properties for the LayerListItem component. */
interface LayerListItemProps {
    id: string;
    isSelected: boolean;
    layer: LayerListEntry;
    onListItemClick: (layer: LayerListEntry) => void;
}
/**
 * Renders a single layer list item with icon, status, and selection state.
 *
 * Memoized to avoid re-rendering all items when only the selected layer changes.
 *
 * @param props - LayerListItem properties
 * @returns The layer list item element
 */
export declare const LayerListItem: import("react").NamedExoticComponent<LayerListItemProps>;
/**
 * Renders a list of layers with selection and status indicators.
 *
 * @param props - LayerList properties
 * @returns The layer list element
 */
export declare const LayerList: import("react").NamedExoticComponent<LayerListProps>;
export {};
//# sourceMappingURL=layer-list.d.ts.map