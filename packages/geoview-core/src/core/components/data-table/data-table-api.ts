import { createElement, ReactElement } from 'react';
import DataTable, { DataTableData } from './data-table';

import { api, TypeListOfLayerEntryConfig, isVectorLayer, TypeArrayOfFeatureInfoEntries, TypeFieldEntry } from '@/app';
import MapDataTable from './map-data-table';
import { Datapanel } from './data-panel';

interface CreataDataTableProps {
  layerId: string;
  layerKey: string;
}

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
    const features = arrayOfFeatureInfoEntries!.map((feature) => {
      return {
        ...feature,
        rows: Object.keys(feature.fieldInfo).reduce((acc, curr) => {
          if (curr) {
            acc[curr] = feature.fieldInfo[curr]?.value as string;
          }
          return acc;
        }, {} as Record<string, string>),
      };
    });

    const columns = arrayOfFeatureInfoEntries!.reduce((acc, curr) => {
      const keys = Object.keys(curr.fieldInfo);

      keys.forEach((key) => {
        // TODO: figure out why myImages from polygons.json is breaking.
        if (!acc[key] && key !== 'myImages') {
          acc[key] = curr.fieldInfo[key] as TypeFieldEntry;
        }
      });
      return acc;
    }, {} as Record<string, TypeFieldEntry>);

    return {
      features,
      fieldAliases: columns,
    };
  };

  /**
   * Create data table based on layer id from map.
   * @param {string} layerId layerId of the feature added on map.
   * @param {string} layerKey layerKey of the feature added on map.
   * @returns {Promise<ReactElement | null>} Promise of ReactElement.
   */

  createDataTableByLayerId = async ({ layerId, layerKey }: CreataDataTableProps): Promise<ReactElement | null> => {
    const geoviewLayerInstance = api.maps[this.mapId].layer.geoviewLayers[layerId];
    const { currentProjection } = api.maps[this.mapId];
    const projectionConfig = api.projection.projections[currentProjection];

    if (geoviewLayerInstance.listOfLayerEntryConfig.length > 0) {
      const groupLayerKeys = this.getGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId, []);

      if (isVectorLayer(geoviewLayerInstance)) {
        const requests = groupLayerKeys.map((groupLayerKey) => {
          return geoviewLayerInstance.getFeatureInfo('all', groupLayerKey);
        });

        const response = await Promise.allSettled(requests);
        const data = response
          .filter((req) => req.status === 'fulfilled')
          .map((result) => {
            /* @ts-expect-error value prop is part of promise, filter function already filter fullfilled promise, still thrown type error. */
            return this.buildFeatureRows(result.value);
          });
        return createElement(MapDataTable, { data: data[0], layerId, mapId: this.mapId, layerKey, projectionConfig }, []);
      }
    }
    return null;
  };

  /**
   * Create data panel for various layers.
   *
   * @returns {Promise<ReactElement | null>} Promise of ReactElement.
   */
  createDataPanel = async (): Promise<ReactElement | null> => {
    let layerIds: string[] = [];
    let layerKeys: string[] = [];

    const { currentProjection } = api.maps[this.mapId];
    const projectionConfig = api.projection.projections[currentProjection];
    const geoLayers = Object.keys(api.maps[this.mapId].layer.geoviewLayers);

    geoLayers.forEach((layerId: string) => {
      const geoviewLayerInstance = api.maps[this.mapId].layer.geoviewLayers[layerId];
      if (geoviewLayerInstance.listOfLayerEntryConfig.length > 0) {
        const groupLayerKeys = this.getGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId, []);
        layerKeys = [...layerKeys, ...groupLayerKeys];
        layerIds = [...layerIds, ...groupLayerKeys.fill(layerId)];
      }
    });

    const requests = layerKeys.map((layerKey, index) => {
      const layerId = layerIds[index];
      const geoviewLayerInstance = api.maps[this.mapId].layer.geoviewLayers[layerId];
      return geoviewLayerInstance.getFeatureInfo('all', layerKey);
    });

    const response = await Promise.allSettled(requests);

    const data = response
      .filter((req) => req.status === 'fulfilled')
      .map((result) => {
        /* @ts-expect-error value prop is part of promise, filter function already filter fullfilled promise, still thrown type error. */
        return this.buildFeatureRows(result.value);
      });

    return createElement(Datapanel, { layerData: data, layerIds, mapId: this.mapId, layerKeys, projectionConfig }, null);
  };
}
