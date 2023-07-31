import { createElement, ReactElement } from 'react';
import DataTable, { DataTableData } from './data-table';

import {
  AbstractGeoViewVector,
  api,
  TypeLayerDataGridProps,
  TypeListOfLayerEntryConfig,
  isVectorLayer,
  TypeArrayOfFeatureInfoEntries,
  TypeFieldEntry,
} from '@/app';
import MapDataTable from './map-data-table';

export class DataTableApi {
  mapId!: string;

  /**
   * initialize the data table api
   *
   * @param mapId the id of the map this data table belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Create a data table as an element
   *
   * @param { 'materialReactDataTable'} tableType type of table that user want to create.
   * @return {ReactElement} the data table react element
   */
  createDataTable = ({ data }: { data: DataTableData }): ReactElement => {
    return createElement(DataTable, { data }, []);
  };

  /**
   * Create group layer keys based on layer rendered on map
   *
   * @param {TyepListOfLayerEntryConfig} listOfLayerEntryConfig list of layers configured to be rendered on map.
   * @param {string} parentLayerId layer id
   * @param {string[]} grouplayerKeys list of keys already exists.
   * @returns {string[]} array of layer keys
   */

  getGroupKeys = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig, parentLayerId: string, grouplayerKeys: string[]) => {
    listOfLayerEntryConfig.forEach((LayerEntryConfig) => {
      if (
        LayerEntryConfig.entryType === 'group' &&
        LayerEntryConfig.listOfLayerEntryConfig !== undefined &&
        LayerEntryConfig.listOfLayerEntryConfig.length > 1
      ) {
        this.getGroupKeys(LayerEntryConfig.listOfLayerEntryConfig, `${parentLayerId}/${LayerEntryConfig.layerId}`, grouplayerKeys);
      } else if (LayerEntryConfig.entryType !== 'group') {
        grouplayerKeys.push(`${parentLayerId}/${LayerEntryConfig.layerId}`);
      }
    });
    return grouplayerKeys;
  };

  /**
   * Create a data table rows
   *
   * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data table to be created
   * @return {TypeJsonArray} the data table rows
   */

  buildFeatureRows = (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries) => {
    const rows = arrayOfFeatureInfoEntries.map((entries) => {
      return Object.values(entries.fieldInfo).reduce((acc, curr) => {
        if (curr) {
          acc[curr.alias] = curr.value as string;
        }

        return acc;
      }, {} as Record<string, string>);
    });

    const columns = arrayOfFeatureInfoEntries.reduce((acc, curr) => {
      const entries = Object.values(curr.fieldInfo) as TypeFieldEntry[];
      entries.forEach((entry) => {
        if (entry) {
          acc[entry.alias] = entry.alias;
        }
      });
      return acc;
    }, {} as Record<string, string>);

    return {
      features: rows,
      fieldAliases: columns,
    };
  };

  /**
   * Create data table based on layer id from map.
   * @param {string} layerId layerId of the feature added on map.
   * @returns {Promise<ReactElement | null>} Promise of ReactElement.
   */

  createDataTableByLayerId = async ({ layerId }: TypeLayerDataGridProps): Promise<ReactElement | null> => {
    const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];

    if (
      geoviewLayerInstance.listOfLayerEntryConfig.length > 0 &&
      (geoviewLayerInstance as AbstractGeoViewVector).getAllFeatureInfo !== undefined
    ) {
      const groupLayerKeys = this.getGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId, []);

      if (isVectorLayer(geoviewLayerInstance)) {
        const requests = groupLayerKeys.map((layerKey) => {
          return (geoviewLayerInstance as AbstractGeoViewVector)?.getAllFeatureInfo(layerKey);
        });

        const response = await Promise.allSettled(requests);
        const data = response
          .filter((req) => req.status === 'fulfilled')
          .map((result) => {
            /* @ts-expect-error value prop is part of promise, filter function already filter fullfilled promise, still thrown type error. */
            return this.buildFeatureRows(result.value);
          });

        return createElement(MapDataTable, { data: data[0] }, []);
      }
    }
    return null;
  };
}
