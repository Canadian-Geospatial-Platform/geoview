/// <reference types="react" />
import { LegendsLayerSet } from '@/app';
import { TypeLegendItemProps } from './legend-item';
export interface TypeLegendProps {
    layerIds: string[];
    isRemoveable?: boolean;
    canSetOpacity?: boolean;
    expandAll?: boolean;
    hideAll?: boolean;
    canZoomTo?: boolean;
}
/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export declare class LegendApi {
    mapId: string;
    legendLayerSet: LegendsLayerSet;
    /**
     * initialize the legend api
     *
     * @param mapId the id of the map this legend belongs to
     */
    constructor(mapId: string);
    /**
     * Create a legend as an element
     *
     */
    createLegend: (props: TypeLegendProps) => import("react").DetailedReactHTMLElement<{}, HTMLElement>;
    /**
     * Create an individual legend item
     *
     */
    createLegendItem: (props: TypeLegendItemProps) => import("react").FunctionComponentElement<TypeLegendItemProps>;
}
