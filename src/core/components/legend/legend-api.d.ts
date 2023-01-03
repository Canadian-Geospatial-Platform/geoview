/// <reference types="react" />
import { Legend } from './legend';
import { TypeLegendItemProps } from './legend-item';
export interface TypeLegendProps {
    layerIds: string[];
    isRemoveable?: boolean;
    canSetOpacity?: boolean;
    expandAll?: boolean;
    hideAll?: boolean;
}
/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export declare class LegendApi {
    mapId: string;
    /**
     * initialize the legend api
     *
     * @param mapId the id of the map this legend belongs to
     */
    constructor(mapId: string);
    /**
     * Create a legend as a component
     * @deprecated
     */
    createLegendComponent: () => typeof Legend;
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
