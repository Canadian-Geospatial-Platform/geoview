/// <reference types="react" />
import { AbstractGeoViewLayer } from '../../../geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeLayerEntryConfig } from '../../../geo/map/map-schema-types';
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
    canZoomTo?: boolean;
}
/**
 * Legend Item for a Legend list
 *
 * @returns {JSX.Element} the legend list item
 */
export declare function LegendItem(props: TypeLegendItemProps): JSX.Element;
