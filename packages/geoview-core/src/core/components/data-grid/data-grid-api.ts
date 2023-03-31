/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/no-array-index-key */
import { createElement, ReactElement, useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
import { toLonLat } from 'ol/proj';
import { Extent } from 'ol/extent';
import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';
import { AbstractGeoViewVector, api, TypeArrayOfFeatureInfoEntries, TypeDisplayLanguage, TypeListOfLayerEntryConfig } from '../../../app';

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
    // const { t } = useTranslation<string>();
    const [groupValues, setGroupValues] = useState<{ layerkey: string; layerValues: {}[] }[]>([]);
    const [groupKeys, setGroupKeys] = useState<string[]>([]);
    const { currentProjection } = api.map(this.mapId);
    const projectionConfig = api.projection.projections[currentProjection];

    /**
     * Create a geometry json
     *
     * @param {Geometry} geometry the geometry
     * @return {TypeJsonObject} the geometry json
     *
     */
    const buildGeometry = (geometry: Geometry) => {
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
     * Create a data grid rows
     *
     * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data grid to be created
     * @return {TypeJsonArray} the data grid rows
     *
     */
    const buildFeatureRows = (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries) => {
      return arrayOfFeatureInfoEntries.map((feature) => {
        const { featureKey, fieldInfo, geometry, featureIcon, extent } = feature;
        const featureInfo: Record<string, {}> = {};
        Object.entries(fieldInfo).forEach(([fieldKey, fieldInfoEntry]) => {
          const featureInfoKey = (fieldInfoEntry?.alias ? fieldInfoEntry?.alias : fieldKey) as string;
          const featureInfoValue = fieldInfoEntry?.value as string;
          const fieldType = fieldInfoEntry?.dataType as string;
          featureInfo[fieldKey] = { featureInfoKey, featureInfoValue, fieldType };
        });

        return {
          featureKey: { featureInfoKey: 'featureKey', featureInfoValue: featureKey, fieldType: 'string' },
          featureIcon: { featureInfoKey: 'Icon', featureInfoValue: featureIcon.toDataURL(), fieldType: 'string' },
          featureActions: { featureInfoKey: 'Zoom', featureInfoValue: '', fieldType: 'string' },
          geometry: buildGeometry(geometry?.getGeometry() as Geometry),
          extent,
          ...featureInfo,
        };
      });
    };

    // eslint-disable-next-line @typescript-eslint/ban-types
    const setLayerDataGridProps = (layerKey: string, layerValues: {}[]) => {
      const firstValue: Record<string, { featureInfoKey: string; featureInfoValue: string; fieldType: string }> = layerValues[0];
      // set columns
      const columnHeader = Object.keys(firstValue).filter((kn) => kn !== 'geometry' && kn !== 'extent');
      const columns = columnHeader.map((header) => {
        return {
          field: header,
          headerName: firstValue[header].featureInfoKey,
          width: header !== 'featureIcon' && header !== 'featureActions' ? 150 : 80,
          type: firstValue[header].fieldType ? firstValue[header].fieldType : 'string',
          hide: columnHeader.length > 1 && header === 'featureKey',
          hideable: header !== 'featureIcon' && header !== 'featureActions',
          filterable: header !== 'featureKey' && header !== 'featureIcon' && header !== 'featureActions',
          sortable: header !== 'featureIcon' && header !== 'featureActions',
          disableColumnMenu: header === 'featureIcon' || header === 'featureActions',
        };
      });

      // set rows
      const rows = layerValues.map((values) => {
        let geometry = {};
        let extent = [] as Extent;
        const featureInfo: Record<string, string> = {};
        Object.entries(values).forEach(([valueKey, valueInfoEntry]) => {
          if (valueKey === 'geometry') {
            geometry = valueInfoEntry as Geometry;
          } else if (valueKey === 'extent') {
            extent = valueInfoEntry as Extent;
          } else {
            featureInfo[valueKey] = (
              valueInfoEntry as { featureInfoKey: string; featureInfoValue: string; fieldType: string }
            ).featureInfoValue;
          }
        });

        return {
          geometry,
          extent,
          ...featureInfo,
        };
      });

      return {
        key: `${layerId}-datagrid`,
        mapId: this.mapId,
        layerKey,
        columns,
        rows,
        pageSize: 50,
        rowsPerPageOptions: [25, 50, 100],
        autoHeight: true,
        layerId,
        rowId: 'featureKey',
        displayLanguage: this.displayLanguage,
      };
    };

    useEffect(() => {
      const geoviewLayerInstance = api.map(this.mapId).layer.geoviewLayers[layerId];
      if (
        geoviewLayerInstance.listOfLayerEntryConfig.length > 0 &&
        (geoviewLayerInstance as AbstractGeoViewVector).getAllFeatureInfo !== undefined
      ) {
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
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId]);

    return createElement('div', {}, [
      groupKeys.length > 1 &&
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
    ]);
  };
}
