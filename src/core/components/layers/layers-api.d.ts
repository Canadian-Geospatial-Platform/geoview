/// <reference types="react" />
import { LegendsLayerSet } from '@/app';
import { TypeLegendProps } from './types';
/**
 * API to manage legend component
 *
 * @exports
 * @class
 */
export declare class LayersApi {
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
    createLayers: (props: TypeLegendProps) => import("react").FunctionComponentElement<import("./types").LegendItemsDetailsProps>;
}
