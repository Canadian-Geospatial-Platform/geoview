import { ReactElement } from 'react';
import { FeatureInfoLayerSet } from '../../../geo/utils/feature-info-layer-set';
import { TypeFeatureInfoEntry } from '../../../api/events/payloads/get-feature-info-payload';
/**
 * API to manage Feature Info component api
 *
 * @exports
 * @class FeatureInfoAPI
 */
export declare class FeatureInfoAPI {
    mapId: string;
    featureInfoLayerSet: FeatureInfoLayerSet;
    /**
     * initialize the feature info api
     *
     * @param {string} mapId the id of the map this feature info belongs to
     */
    constructor(mapId: string);
    /**
     * Create a feature info single element or array of single elements
     *
     * @param {TypeFeatureInfoEntry} featureInfoEntries the data(s) to display in the feature info element
     *
     * @return {ReactElement} the feature info react element
     */
    createFeatureInfoItem: (featureInfoEntries: TypeFeatureInfoEntry[], startOpen?: boolean) => ReactElement[];
}
