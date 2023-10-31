/// <reference types="react" />
import { LegendsLayerSet } from '@/app';
import { TypeLegendProps } from '@/core/components/layers/types';
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
    createLegend: (props: TypeLegendProps) => import("react").FunctionComponentElement<import("./legend").LegendOverviewProps>;
}
