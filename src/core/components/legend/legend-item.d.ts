/// <reference types="react" />
import { AbstractGeoViewLayer, TypeLayerEntryConfig } from '../../../app';
export interface TypeLegendItemProps {
    layerId: string;
    geoviewLayerInstance: AbstractGeoViewLayer;
    subLayerId?: string;
    layerConfigEntry?: TypeLayerEntryConfig;
    isRemoveable?: boolean;
    canSetOpacity?: boolean;
    isParentVisible?: boolean;
    toggleParentVisible?: () => void;
    expandAll?: boolean;
    hideAll?: boolean;
}
/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export declare function LegendItem(props: TypeLegendItemProps): JSX.Element;
