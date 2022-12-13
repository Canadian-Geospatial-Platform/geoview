/// <reference types="react" />
import { Legend } from './legend';
import { TypeLegendItemProps } from './legend-item';
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
     * Create a legend
     *
     */
    createLegend: () => typeof Legend;
    /**
     * Create an individual legend item
     *
     */
    createLegendItem: (props: TypeLegendItemProps) => import("react").FunctionComponentElement<TypeLegendItemProps>;
}
