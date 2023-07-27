import { createElement, ReactElement } from 'react';

import { FeatureInfoLayerSet } from '@/geo/utils/feature-info-layer-set';
import { api } from '@/app';

import { generateId } from '../../utils/utilities';

import { FeatureInfo } from './feature-info';
import { TypeFeatureInfoEntry } from '@/api/events/payloads';

/**
 * API to manage Feature Info component api
 *
 * @exports
 * @class FeatureInfoAPI
 */
export class FeatureInfoAPI {
  mapId!: string;

  featureInfoLayerSet!: FeatureInfoLayerSet;

  /**
   * initialize the feature info api
   *
   * @param {string} mapId the id of the map this feature info belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    // the featureInfoLayerSet can be used to automatically build the components on map click
    this.featureInfoLayerSet = api.getFeatureInfoLayerSet(mapId);
  }

  /**
   * Create a feature info single element or array of single elements
   *
   * @param {TypeFeatureInfoEntry} featureInfoEntries the data(s) to display in the feature info element
   *
   * @return {ReactElement} the feature info react element
   */
  createFeatureInfoItem = (featureInfoEntries: TypeFeatureInfoEntry[], startOpen = false): ReactElement[] => {
    // loop the array, create components and return the array of components
    const componentsArray: ReactElement[] = [];

    let len = featureInfoEntries.length;
    while (len--) {
      componentsArray.push(
        createElement(FeatureInfo, {
          key: `${this.mapId}-feature-${generateId()}`,
          mapId: this.mapId,
          feature: featureInfoEntries[len],
          startOpen,
        })
      );
    }

    return componentsArray;
  };
}
