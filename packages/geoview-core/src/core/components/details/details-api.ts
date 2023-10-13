import { createElement, ReactElement } from 'react';
import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { api } from '@/app';
import { Details, TypeArrayOfLayerData, DetailsProps } from './details';

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
   * Create a details as an element
   *
   * @param {TypeLayerDetailsProps} mapId the map identifier
   * @param {TypeArrayOfLayerData} detailsElements the data to display in the Details element
   * @param {detailsSettings} DetailsProps the properties of the details to be created
   *
   * @return {ReactElement} the details react element
   *
   */
  createDetails = (mapId: string, detailsElements: TypeArrayOfLayerData, detailsSettings: DetailsProps): ReactElement => {
    return createElement('div', {}, [
      createElement(Details, {
        key: `${mapId}-details-sets`,
        arrayOfLayerData: detailsElements,
        detailsSettings,
      }),
    ]);
  };
}
