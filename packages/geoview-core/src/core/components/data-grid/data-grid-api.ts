import { createElement, ReactElement } from 'react';

import { AbstractGeoViewVector, api } from '../../../app';
// import { getLocalizedValue } from '../../utils/utilities';

import { LayerDataGrid } from './layer-data-grid';
import { TypeDisplayLanguage, TypeListOfLayerEntryConfig } from '../../../geo/map/map-schema-types';

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
    // eslint-disable-next-line @typescript-eslint/ban-types
    let values: {}[] = [];
    const groupKeys: string[] = [];
    // eslint-disable-next-line @typescript-eslint/ban-types
    let groupValues: { layerValues: {}[] }[] = [];
    const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];
    if (geoviewLayerInstance.listOfLayerEntryConfig.length > 1) {
      const setGroupKeys = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig, parentLayerId: string) => {
        listOfLayerEntryConfig.forEach((LayerEntryConfig) => {
          if (
            LayerEntryConfig.entryType === 'group' &&
            LayerEntryConfig.listOfLayerEntryConfig !== undefined &&
            LayerEntryConfig.listOfLayerEntryConfig.length > 1
          ) {
            setGroupKeys(LayerEntryConfig.listOfLayerEntryConfig, `${parentLayerId}/${LayerEntryConfig.layerId}`);
          } else if (LayerEntryConfig.entryType !== 'group') {
            groupKeys.push(`${parentLayerId}/${LayerEntryConfig.layerId}`);
          }
        });
      };
      setGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId);

      groupValues = groupKeys.map((layerkey) => {
        const layerValues = (geoviewLayerInstance as AbstractGeoViewVector)?.getAllFeatureInfo(layerkey).map((feature) => {
          const { featureKey, featureInfo } = feature;
          return { featureKey, ...featureInfo };
        });
        return { layerkey, layerValues };
      });
    } else {
      const allFetureInfo = (geoviewLayerInstance as AbstractGeoViewVector)?.getAllFeatureInfo();
      if (Array.isArray(allFetureInfo)) {
        values = allFetureInfo.map((feature) => {
          const { featureKey, featureInfo } = feature;
          return { featureKey, ...featureInfo };
        });
      }
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    const setLayerDataGridProps = (layerValues: {}[]) => {
      // set columns
      const columnHeader = Object.keys(layerValues[0]);

      const columns = [];
      for (let i = 0; i < columnHeader.length; i++) {
        columns.push({
          field: columnHeader[i],
          headerName: columnHeader[i],
          width: 150,
          type: 'string',
          hide: columnHeader.length > 1 && columnHeader[i] === 'featureKey',
        });
      }

      // set rows
      const rows = layerValues;

      return {
        key: `${layerId}-datagrid`,
        columns,
        rows,
        pageSize: 50,
        rowsPerPageOptions: [25, 50, 100],
        autoHeight: true,
        rowId: 'featureKey',
        displayLanguage: this.displayLanguage,
      };
    };

    return createElement('div', {}, [
      groupKeys.length > 0 && [
        createElement(
          'select',
          { id: `${layerId}-groupLayerSelection`, style: { fontSize: '1em', margin: '1em', padding: '0.3em' } },
          groupKeys.map((layerkey) => {
            return createElement('option', {}, [layerkey]);
          })
        ),
        groupValues.map((groupValue, index) => {
          return createElement(
            'div',
            { class: `${layerId}-layer-datagrid-table`, style: { display: index === 0 ? 'block' : 'none' } },
            createElement(LayerDataGrid, setLayerDataGridProps(groupValue.layerValues))
          );
        }),
      ],
      values.length > 0 &&
        createElement('div', { id: `${layerId}-layer-datagrid-table` }, [createElement(LayerDataGrid, setLayerDataGridProps(values))]),
    ]);
  };
}
