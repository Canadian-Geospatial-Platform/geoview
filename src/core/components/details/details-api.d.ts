import { ReactElement } from 'react';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { TypeArrayOfLayerData, DetailsProps } from './details';
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
     * @param {TypeLayerDetailsProps} mapId the map identifier
     * @param {TypeArrayOfLayerData} detailsElements the data to display in the Details element
     * @param {detailsSettings} DetailsProps the properties of the details to be created
     *
     * @return {ReactElement} the details react element
     *
     */
    createDetails: (mapId: string, detailsElements: TypeArrayOfLayerData, detailsSettings: DetailsProps) => ReactElement;
}
