import { ReactElement } from 'react';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { TypeArrayOfLayerData } from './details';
/**
 * API to manage details component
 *
 * @exports
 * @class DetailsAPI
 */
export declare class DetailsAPI {
    mapId: string;
    featureInfoLayerSet: FeatureInfoLayerSet;
    /**
     * initialize the details api
     *
     * @param mapId the id of the map this details belongs to
     */
    constructor(mapId: string);
    /**
     * Create a details as as an element
     *
     * @param {string} mapId the map identifier
     * @param {TypeArrayOfLayerData} detailsElements the data to display in the Details element
     * @return {ReactElement} the details react element
     */
    createDetailsFooter: (mapId: string, detailsElements: TypeArrayOfLayerData) => ReactElement;
}
