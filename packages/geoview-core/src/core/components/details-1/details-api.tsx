import { createElement, ReactElement } from 'react';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { api } from '@/app';

import { DetailsFooter, TypeArrayOfLayerData } from './details';
// import { DetailsFooter } from './details-new';

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
    this.featureInfoLayerSet = api.getFeatureInfoLayerSet(mapId);
  }

  /**
   * Create a details as as an element
   *
   * @param {string} mapId the map identifier
   * @param {TypeArrayOfLayerData} detailsElements the data to display in the Details element
   * @return {ReactElement} the details react element
   */

  createDetailsFooter = (mapId: string, detailsElements: TypeArrayOfLayerData): ReactElement => {
    return createElement('div', {}, [
      createElement(DetailsFooter, {
        key: `${mapId}-details-sets`,
        arrayOfLayerData: detailsElements,
        mapId,
      }),
    ]);
  };
}
