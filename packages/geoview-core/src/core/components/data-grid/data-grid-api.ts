/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/no-array-index-key */
import { createElement, ReactElement, useState, useEffect } from 'react';

import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';
import { AbstractGeoViewVector, api, TypeArrayOfFeatureInfoEntries } from '../../../app';

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

    const [values, setValues] = useState<{}[]>([]);
    const [groupValues, setGroupValues] = useState<{ layerkey: string; layerValues: {}[] }[]>([]);
    const [groupKeys, setGroupKeys] = useState<string[]>([]);

    /**
     * Create a geometry json
     *
     * @param {Geometry} geometry the geometry
     * @return {TypeJsonObject} the geometry json
     *
     */
    const buildGeometry = (geometry: Geometry) => {
      if (geometry instanceof Polygon) {
        return { type: 'Polygon', coordinates: geometry.getCoordinates() };
      }

      if (geometry instanceof LineString) {
        return { type: 'LineString', coordinates: geometry.getCoordinates() };
      }

      if (geometry instanceof Point) {
        return { type: 'Point', coordinates: geometry.getCoordinates() };
      }

      if (geometry instanceof MultiPoint) {
        return { type: 'MultiPoint', coordinates: geometry.getCoordinates() };
      }

      return {};
    };

    /**
     * Create a data grid rows
     *
     * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data grid to be created
     * @return {TypeJsonArray} the data grid rows
     *
     */
    const buildFeatureRows = (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries) => {
      return arrayOfFeatureInfoEntries.map((feature) => {
        const { featureKey, fieldInfo, geometry } = feature;
        const featureInfo: Record<string, string> = {};
        Object.entries(fieldInfo).forEach(([fieldKey, fieldInfoEntry]) => {
          const featureInfoKey = (fieldInfoEntry?.alias ? fieldInfoEntry?.alias : fieldKey) as string;
          featureInfo[featureInfoKey] = fieldInfoEntry?.value as string;
        });

        return { featureKey, geometry: buildGeometry(geometry?.getGeometry() as Geometry), ...featureInfo };
      });
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    const setLayerDataGridProps = (layerKey: string, layerValues: {}[]) => {
      // set columns
      // console.log(layerValues);
      const columnHeader = Object.keys(layerValues[0]).filter((kn) => kn !== 'geometry');

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
        layerKey,
        columns,
        rows,
        pageSize: 50,
        rowsPerPageOptions: [25, 50, 100],
        autoHeight: true,
        rowId: 'featureKey',
        displayLanguage: this.displayLanguage,
      };
    };

    useEffect(() => {
      const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];
      if (geoviewLayerInstance.listOfLayerEntryConfig.length > 1) {
        const grouplayerKeys: string[] = [];
        const grouplayerValues: { layerkey: string; layerValues: {}[] }[] = [];
        const getGroupKeys = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig, parentLayerId: string) => {
          listOfLayerEntryConfig.forEach((LayerEntryConfig) => {
            if (
              LayerEntryConfig.entryType === 'group' &&
              LayerEntryConfig.listOfLayerEntryConfig !== undefined &&
              LayerEntryConfig.listOfLayerEntryConfig.length > 1
            ) {
              getGroupKeys(LayerEntryConfig.listOfLayerEntryConfig, `${parentLayerId}/${LayerEntryConfig.layerId}`);
            } else if (LayerEntryConfig.entryType !== 'group') {
              grouplayerKeys.push(`${parentLayerId}/${LayerEntryConfig.layerId}`);
            }
          });
        };
        getGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId);

        let count = 0;
        grouplayerKeys.forEach((layerkey) => {
          // eslint-disable-next-line @typescript-eslint/ban-types
          let layerValues: {}[] = [];
          (geoviewLayerInstance as AbstractGeoViewVector)?.getAllFeatureInfo(layerkey).then((arrayOfFeatureInfoEntries) => {
            if (arrayOfFeatureInfoEntries?.length > 0) {
              // set values
              count++;
              layerValues = buildFeatureRows(arrayOfFeatureInfoEntries);
              grouplayerValues.push({ layerkey, layerValues });
            }
            if (count === grouplayerKeys.length) {
              setGroupKeys(grouplayerKeys);
              setGroupValues(grouplayerValues);
            }
          });
        });
      } else {
        (geoviewLayerInstance as AbstractGeoViewVector)?.getAllFeatureInfo().then((arrayOfFeatureInfoEntries) => {
          if (arrayOfFeatureInfoEntries?.length > 0) {
            // set values
            setValues(buildFeatureRows(arrayOfFeatureInfoEntries));
          }
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId]);

    return createElement('div', {}, [
      groupKeys.length > 0 && [
        createElement(
          'select',
          { id: `${layerId}-groupLayerSelection`, style: { fontSize: '1em', margin: '1em', padding: '0.3em' } },
          groupKeys.map((layerkey) => {
            return createElement('option', { key: layerkey }, [layerkey]);
          })
        ),
        groupValues.map((groupValue, index) => {
          if (groupValue.layerValues.length > 0) {
            return createElement(
              'div',
              {
                key: `${layerId}-layer-datagrid-table-${index}`,
                className: `${layerId}-layer-datagrid-table`,
                style: { display: index === 0 ? 'block' : 'none' },
              },
              createElement(LayerDataGrid, setLayerDataGridProps(groupKeys[index], groupValue.layerValues))
            );
          }
          return null;
        }),
      ],
      values.length > 0 &&
        createElement('div', { id: `${layerId}-layer-datagrid-table` }, [
          createElement(LayerDataGrid, setLayerDataGridProps(layerId, values)),
        ]),
    ]);
  };
}
