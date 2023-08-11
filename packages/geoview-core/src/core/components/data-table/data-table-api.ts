import { createElement, ReactElement } from 'react';
import { toLonLat, Projection } from 'ol/proj';
import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';

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
   * Create a geometry json
   *
   * @param {Geometry} geometry the geometry
   * @param {Projection} projectionConfig projection config to transfer lat long.
   * @return {TypeJsonObject} the geometry json
   *
   */
  buildGeometry = (geometry: Geometry, projectionConfig: Projection) => {
    if (geometry instanceof Polygon) {
      return {
        type: 'Polygon',
        coordinates: geometry.getCoordinates().map((coords) => {
          return coords.map((coord) => toLonLat(coord, projectionConfig));
        }),
      };
    }

    if (geometry instanceof LineString) {
      return { type: 'LineString', coordinates: geometry.getCoordinates().map((coord) => toLonLat(coord, projectionConfig)) };
    }

    if (geometry instanceof Point) {
      return { type: 'Point', coordinates: toLonLat(geometry.getCoordinates(), projectionConfig) };
    }

    if (geometry instanceof MultiPoint) {
      return { type: 'MultiPoint', coordinates: geometry.getCoordinates().map((coord) => toLonLat(coord, projectionConfig)) };
    }

    return {};
  };

  /**
   * Create a data table rows
   *
   * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data table to be created
   * @param {Projection} projectionConfig projection config to transfer lat long.
   * @return {TypeJsonArray} the data table rows
   */

  buildFeatureRows = (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries, projectionConfig: Projection) => {
    const features = arrayOfFeatureInfoEntries.map((feature) => {
      const { featureKey, fieldInfo, geometry, featureIcon, extent } = feature;

      return {
        featureKey: { featureInfoKey: 'featureKey', featureInfoValue: featureKey, fieldType: 'string' },
        featureIcon: { featureInfoKey: 'Icon', featureInfoValue: featureIcon.toDataURL(), fieldType: 'string' },
        featureActions: { featureInfoKey: 'Zoom', featureInfoValue: '', fieldType: 'string' },
        geometry: this.buildGeometry(geometry?.getGeometry() as Geometry, projectionConfig) as Geometry,
        extent,
        rows: Object.values(fieldInfo).reduce((acc, curr) => {
          if (curr) {
            acc[curr.alias] = curr.value as string;
          }
          return acc;
        }, {} as Record<string, string>),
      };
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
      features,
      fieldAliases: columns,
    };
  };

  /**
   * Create data table based on layer id from map.
   * @param {string} layerId layerId of the feature added on map.
   * @returns {Promise<ReactElement | null>} Promise of ReactElement.
   */

  createDataTableByLayerId = async ({ layerId, mapId }: TypeLayerDataGridProps): Promise<ReactElement | null> => {
    const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];
    const { currentProjection } = api.map(this.mapId);
    const projectionConfig = api.projection.projections[currentProjection];

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
            return this.buildFeatureRows(result.value, projectionConfig);
          });

        return createElement(MapDataTable, { data: data[0], layerId, mapId }, []);
      }
    }
    return null;
  };
}
