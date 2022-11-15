import { createElement, ReactElement } from 'react';

import { AbstractGeoViewVector, api } from '../../../app';
import { getLocalizedValue } from '../../utils/utilities';

import { LayerDetails } from './layer-details';

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
  createDetails = (props: TypeLayerDetailsProps): ReactElement => {
    const { layerId } = props;
    const rootGeoViewLayer = api.map(this.mapId).layer.geoviewLayers[layerId];
    const values = (rootGeoViewLayer as AbstractGeoViewVector).getAllFeatureInfo();

    // set columns
    const columnHeader = Object.keys(values[0]);
    const columns = [];
    for (let i = 0; i < columnHeader.length - 1; i++) {
      columns.push({
        field: columnHeader[i],
        headerName: columnHeader[i],
        width: 150,
        type: 'string',
      });
    }

    // set rows
    const rows = values;

    return createElement('div', {}, [
      createElement('h4', { key: `${layerId}-title` }, getLocalizedValue(rootGeoViewLayer.geoviewLayerName, this.mapId)),
      createElement(LayerDetails, {
        key: `${layerId}-details`,
        columns,
        rows,
        pageSize: 50,
        rowsPerPageOptions: [25, 50, 100],
        autoHeight: true,
      }),
    ]);
  };
}
