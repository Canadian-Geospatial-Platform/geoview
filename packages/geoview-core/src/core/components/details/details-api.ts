import { createElement } from 'react';
import { api } from '../../../app';

import { Details } from './details';

export interface TypeLayerDetailsProps {
  layerId: string;
}

/**
 * API to manage details component
 *
 * @exports
 * @class DetailsAPI
 */
export class DetailsAPI {
  mapId!: string;

  /**
   * initialize the details api
   *
   * @param mapId the id of the map this details belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a data grid
   *
   * @param {TypeLayerDetailsProps} layerDetailsProps the properties of the details to be created
   * @return {ReactElement} the details react element
   *
   */
  createDetails = (detailsElements) => {
    return createElement('div', {}, [
      createElement(Details, {
        key: `details-grid`,
        details: detailsElements,
      }),
    ]);
  };
}
