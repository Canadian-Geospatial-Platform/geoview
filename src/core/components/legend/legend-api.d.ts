/// <reference types="react" />
import { LegendsLayerSet } from '@/app';
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
    createLegend: () => import("react").FunctionComponentElement<{}>;
}
