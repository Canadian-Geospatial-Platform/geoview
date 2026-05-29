import type { ReactNode } from 'react';
import type { TypeFeatureInfoEntry, TypeQueryStatus } from '@/api/types/map-schema-types';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
/** Represents an entry in the layer list. */
export interface LayerListEntry {
    /** Optional content to render inside the item. */
    content?: string | ReactNode;
    /** Display name of the layer. */
    layerName: string;
    /** Unique path identifying the layer. */
    layerPath: string;
    /** Current load status of the layer. */
    layerStatus: TypeLayerStatus;
    /** Current query status of the layer. */
    queryStatus: TypeQueryStatus;
    /** Formatted feature count string. */
    layerFeatures?: string;
    /** Optional icon indicating map filter is active. */
    mapFilteredIcon?: ReactNode;
    /** Optional tooltip content. */
    tooltip?: JSX.Element | string;
    /** Number of features in the layer. */
    numOffeatures?: number;
    /** Array of feature info entries. */
    features?: TypeFeatureInfoEntry[];
    /** Unique DOM id for the layer list item. */
    layerUniqueId?: string;
    /** Whether the layer item is disabled. */
    isDisabled?: boolean;
}
/** Properties for the LayerList component. */
interface LayerListProps {
    /** Array of layer entries to render. */
    layerList: LayerListEntry[];
    /** Path of the currently selected layer. */
    selectedLayerPath: string | undefined;
    /** Callback invoked when a layer item is clicked. */
    onListItemClick: (layer: LayerListEntry) => void;
}
/** Properties for the LayerListItem component. */
interface LayerListItemProps {
    /** The unique DOM id for this list item. */
    id: string;
    /** Whether this item is currently selected. */
    isSelected: boolean;
    /** The layer entry data to render. */
    layer: LayerListEntry;
    /** Callback invoked when the item is clicked. */
    onListItemClick: (layer: LayerListEntry) => void;
}
/**
 * Renders a single layer list item with icon, status, and selection state.
 *
 * Memoized to avoid re-rendering all items when only the selected layer changes.
 *
 * @param props - Properties defined in LayerListItemProps interface
 * @returns The layer list item element
 */
export declare const LayerListItem: import("react").MemoExoticComponent<({ id, isSelected, layer, onListItemClick }: LayerListItemProps) => JSX.Element>;
/**
 * Renders a list of layers with selection and status indicators.
 *
 * Memoized to prevent re-rendering when unrelated parent state changes.
 * Note: Props (selectedLayerPath, layerList) do change frequently on layer interaction.
 * Kept for now to protect against parent component re-renders; can be removed
 * if profiling shows overhead exceeds benefits.
 *
 * @param props - Properties defined in LayerListProps interface
 * @returns The layer list element
 */
export declare const LayerList: import("react").MemoExoticComponent<({ layerList, selectedLayerPath, onListItemClick }: LayerListProps) => JSX.Element>;
export {};
//# sourceMappingURL=layer-list.d.ts.map