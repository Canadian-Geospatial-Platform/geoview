import { createElement } from 'react';

import { AbstractGeoViewVector, api } from '../../../app';
import { getLocalizedValue } from '../../utils/utilities';

import { LayerDataGrid } from './layer-data-grid';

export interface TypeLayerDataGridProps {
  layerId: string;
}

/**
 * API to manage data grid component
 *
 * @exports
 * @class DataGridAPI
 */
export class DataGridAPI {
  mapId!: string;

  /**
   * initialize the data grid api
   *
   * @param mapId the id of the map this data grid belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a data grid
   *
   * @param {TypeLayerDataGridProps} layerDataGridProps the properties of the data grid to be created
   *
   */
  createDataGrid = (props: TypeLayerDataGridProps) => {
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
      createElement(LayerDataGrid, {
        key: `${layerId}-datagrid`,
        columns,
        rows,
        pageSize: 50,
        rowsPerPageOptions: [25, 50, 100],
        autoHeight: true,
      }),
    ]);
  };
}
