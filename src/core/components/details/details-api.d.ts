import { ReactElement } from 'react';
import { TypeArrayOfFeatureInfoEntries } from '../../../api/events/payloads/get-feature-info-payload';
import { FeatureInfoLayerSet } from '../../../geo/utils/feature-info-layer-set';
import { TypeArrayOfLayerData, DetailsStyleProps } from './details';
export interface TypeLayerDetailsProps {
    layerPath: string;
    features: TypeArrayOfFeatureInfoEntries;
}
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
     * @param {TypeLayerDetailsProps} layerDetailsProps the properties of the details to be created
     * @return {ReactElement} the details react element
     *
     */
    createDetails: (mapId: string, detailsElements: TypeArrayOfLayerData, detailsStyle: DetailsStyleProps) => ReactElement;
}
