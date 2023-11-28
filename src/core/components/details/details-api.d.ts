import { ReactElement } from 'react';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
/**
 * API to manage details component
 *
 * @exports
 * @class DetailsAPI
 */
export declare class DetailsApi {
    mapId: string;
    featureInfoLayerSet: FeatureInfoLayerSet;
    /**
     * initialize the details api
     *
     * @param mapId the id of the map this details belongs to
     */
    constructor(mapId: string);
    /**
     * Create a details as an element
     *
     * @return {ReactElement} the details react element
     */
    createDetails: () => ReactElement;
}
