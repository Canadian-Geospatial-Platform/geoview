/// <reference types="react" />
import { LegendsLayerSet } from '@/app';
import { TypeLegendItemProps } from './legend-items/legend-item';
import { TypeLegendProps } from './types';
/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export declare class Legend2Api {
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
    createLegend: (props: TypeLegendProps) => import("react").FunctionComponentElement<import("./types").LegendItemsDetailsProps>;
    /**
     * Create an individual legend item
     *
     */
    createLegendItem: (props: TypeLegendItemProps) => import("react").FunctionComponentElement<TypeLegendItemProps>;
}
