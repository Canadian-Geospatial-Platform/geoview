import { createElement, ReactElement } from 'react';
import { TypeArrayOfFeatureInfoEntries } from '../../../api/events/payloads/get-feature-info-payload';
import { FeatureInfoLayerSet } from '../../../geo/utils/feature-info-layer-set';
import { api } from '../../../app';

import { Details, TypeArrayOfLayerData, DetailsProps } from './details';

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
export class DetailsAPI {
  mapId!: string;

  featureInfoLayerSet!: FeatureInfoLayerSet;

  /**
   * initialize the details api
   *
   * @param mapId the id of the map this details belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
    this.featureInfoLayerSet = api.createFeatureInfoLayerSet(mapId, `${mapId}-DetailsAPI`);
  }

  /**
   * Create a details as as an element
   *
   * @param {TypeLayerDetailsProps} layerDetailsProps the properties of the details to be created
   * @return {ReactElement} the details react element
   *
   */
  createDetails = (mapId: string, detailsElements: TypeArrayOfLayerData, detailsSettings: DetailsProps): ReactElement => {
    return createElement('div', {}, [
      createElement(Details, {
        key: `${mapId}-details-sets`,
        arrayOfLayerData: detailsElements,
        mapId,
        detailsSettings,
      }),
    ]);
  };
}
