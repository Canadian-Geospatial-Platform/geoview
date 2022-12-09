import { ReactElement } from 'react';
export interface TypeLayerDetailsProps {
    layerId: string;
}
/**
 * API to manage details component
 *
 * @exports
 * @class DetailsAPI
 */
export declare class DetailsAPI {
    mapId: string;
    /**
     * initialize the details api
     *
     * @param mapId the id of the map this details belongs to
     */
    constructor(mapId: string);
    /**
     * Create a data grid
     *
     * @param {TypeLayerDetailsProps} layerDetailsProps the properties of the details to be created
     * @return {ReactElement} the details react element
     *
     */
    createDetails: (props: TypeLayerDetailsProps) => ReactElement;
}
