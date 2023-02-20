import { createElement, ReactElement } from 'react';

import { AbstractGeoViewVector, api } from '../../../app';

import { LayerDataGrid } from './layer-data-grid';
import { TypeDisplayLanguage } from '../../../geo/map/map-schema-types';

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

  displayLanguage!: TypeDisplayLanguage;

  /**
   * initialize the data grid api
   *
   * @param mapId the id of the map this data grid belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
    this.displayLanguage = api.map(mapId).displayLanguage;
  }

  /**
   * Create a data grid
   *
   * @param {TypeLayerDataGridProps} layerDataGridProps the properties of the data grid to be created
   * @return {ReactElement} the data grid react element
   *
   */
  createDataGrid = (layerDataGridProps: TypeLayerDataGridProps): ReactElement => {
    const { layerId } = layerDataGridProps;
    const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId] as AbstractGeoViewVector;
    geoviewLayerInstance?.getAllFeatureInfo().then((arrayOfFeatureInfoEntries) => {
      if (arrayOfFeatureInfoEntries?.length) {
        // set values
        const values = arrayOfFeatureInfoEntries.map((feature) => {
          const { featureKey, fieldInfo } = feature;
          return { featureKey, ...fieldInfo };
        });

        // set columns
        const columnHeader = Object.keys(arrayOfFeatureInfoEntries[0].fieldInfo).map<string>((fieldName): string => {
          return arrayOfFeatureInfoEntries[0].fieldInfo[fieldName]!.alias;
        });

        const columns = [];
        for (let i = 0; i < columnHeader.length; i++) {
          columns.push({
            field: columnHeader[i],
            headerName: columnHeader[i],
            width: 150,
            type: 'string',
            hide: columnHeader[i] === 'fieldKey',
          });
        }

        // set rows
        const rows = values;

        return createElement('div', {}, [
          createElement(LayerDataGrid, {
            key: `${layerId}-datagrid`,
            columns,
            rows,
            pageSize: 50,
            rowsPerPageOptions: [25, 50, 100],
            autoHeight: true,
            rowId: 'featureKey',
            displayLanguage: this.displayLanguage,
          }),
        ]);
      }
      return createElement('div', {}, []);
    });
    return createElement('div', {}, []);
  };
}
