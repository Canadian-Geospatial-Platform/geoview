import { useContext, useEffect, useState, memo } from 'react';
import { Typography, Box } from '@mui/material';
import { toLonLat } from 'ol/proj';
import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';
import { Extent } from 'ol/extent';
import { MapContext } from '../../app-start';
import {
  AbstractGeoViewVector,
  TypeArrayOfFeatureInfoEntries,
  TypeListOfLayerEntryConfig,
  api,
  getLocalizedValue,
  isVectorLayer,
} from '../../../app';
import LayerDataGrid from './layer-data-grid';
import DataLoader from './data-loader';

interface Features {
  featureInfoKey: string;
  featureInfoValue: string;
  fieldType: string;
}

interface GroupLayerData {
  layerId: string;
  layerKey: string;
  layerValues: Record<string, Features>[];
}

function DataTable() {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;
  const { currentProjection, displayLanguage } = api.map(mapId);
  const projectionConfig = api.projection.projections[currentProjection];

  const [dataLayers, setDataLayers] = useState<string[]>([]);
  const [groupLayersData, setGroupLayersData] = useState<GroupLayerData[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.event.on(
      api.eventNames.MAP.EVENT_MAP_LOADED,
      () => {
        setDataLayers(Object.keys(api.map(mapId!).layer.geoviewLayers));
      },
      mapId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
   * @param {TypeArrayOfFeatureInfoEntries} arrayOfFeatureInfoEntries the properties of the data grid to be created
   * @return {TypeJsonArray} the data grid rows
   *
   */
  const buildFeatureRows = (arrayOfFeatureInfoEntries: TypeArrayOfFeatureInfoEntries) => {
    return arrayOfFeatureInfoEntries.map((feature) => {
      const { featureKey, fieldInfo, geometry, featureIcon, extent } = feature;
      const featureInfo: Record<string, unknown> = {};

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

  /**
   * Create data grid props.
   * @param layerKey key value of layer config entry
   * @param layerValues data of layer config entry.
   * @param layerId layer id of feature entry config.
   * @returns array of data grid props.
   */
  const setLayerDataGridProps = (
    layerKey: string,
    layerValues: Record<string, { featureInfoKey: string; featureInfoValue: string; fieldType: string }>[],
    layerId: string
  ) => {
    const firstValue = layerValues[0];
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
          geometry = valueInfoEntry as unknown as Geometry;
        } else if (valueKey === 'extent') {
          extent = valueInfoEntry as unknown as Extent;
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
      key: `${layerId}-datagrid-${layerKey}`,
      mapId,
      layerKey,
      columns,
      rows,
      pageSize: 50,
      rowsPerPageOptions: [25, 50, 100],
      autoHeight: true,
      layerId,
      rowId: 'featureKey',
      displayLanguage,
    };
  };

  /**
   * Get group of keys from layer entry config.
   * @param listOfLayerEntryConfig List of layers. Corresponds to the layerList defined in the schema.
   * @param parentLayerId layer id
   * @param grouplayerKeys cache array of keys for recursion.
   * @returns
   */
  const getGroupKeys = (listOfLayerEntryConfig: TypeListOfLayerEntryConfig, parentLayerId: string, grouplayerKeys: string[]) => {
    listOfLayerEntryConfig.forEach((LayerEntryConfig) => {
      if (
        LayerEntryConfig.entryType === 'group' &&
        LayerEntryConfig.listOfLayerEntryConfig !== undefined &&
        LayerEntryConfig.listOfLayerEntryConfig.length > 1
      ) {
        getGroupKeys(LayerEntryConfig.listOfLayerEntryConfig, `${parentLayerId}/${LayerEntryConfig.layerId}`, grouplayerKeys);
      } else if (LayerEntryConfig.entryType !== 'group') {
        grouplayerKeys.push(`${parentLayerId}/${LayerEntryConfig.layerId}`);
      }
    });
    return grouplayerKeys;
  };

  /**
   * Get feature info entries for various layers.
   * @param featureInfoRequests - list of feature info entries promises.
   * @param groupLayerKeys - list of layer keys
   */
  const doRequest = async (featureInfoRequests: Promise<TypeArrayOfFeatureInfoEntries>[], groupLayerKeys: string[]) => {
    setIsLoading(true);
    await Promise.allSettled(featureInfoRequests).then((res) => {
      const layerValues = res
        .filter((result: { status: string }) => result.status === 'fulfilled')
        .map((result) => {
          /* @ts-expect-error value prop is part of promise, filter function already filter fullfilled promise, still thrown type error. */
          return buildFeatureRows(result.value);
        }) as unknown as Record<string, Features>[][];

      const data = groupLayerKeys.map((layerKey, index) => {
        return { layerId: layerKey.split('/')[0], layerKey, layerValues: layerValues[index] };
      });
      setIsLoading(false);
      setGroupLayersData(data);
    });
  };

  useEffect(() => {
    let groupLayerKeys: string[] = [];
    const featureInfoRequests: Promise<TypeArrayOfFeatureInfoEntries>[] = [];
    dataLayers.forEach((layerId) => {
      const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId];
      if (
        geoviewLayerInstance.listOfLayerEntryConfig.length > 0 &&
        (geoviewLayerInstance as AbstractGeoViewVector).getAllFeatureInfo !== undefined
      ) {
        const layerKeys = getGroupKeys(geoviewLayerInstance.listOfLayerEntryConfig, layerId, []);
        groupLayerKeys = [...groupLayerKeys, ...layerKeys];

        if (isVectorLayer(geoviewLayerInstance)) {
          layerKeys.forEach((layerKey) => {
            featureInfoRequests.push((geoviewLayerInstance as AbstractGeoViewVector)?.getAllFeatureInfo(layerKey));
          });
        }
      }
    });

    doRequest(featureInfoRequests, groupLayerKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLayers]);

  return (
    <Box sx={{ minHeight: '300px' }}>
      <Typography>DataTable</Typography>
      {isLoading ? (
        <DataLoader />
      ) : (
        <Box>
          {!!groupLayersData.length &&
            groupLayersData
              .filter(({ layerId, layerValues }) => !!api.map(mapId).layer.geoviewLayers[layerId] && layerValues.length > 0)
              .map(({ layerId, layerKey, layerValues }, index) => {
                const geoviewLayerInstance = api.map(mapId).layer.geoviewLayers[layerId] as AbstractGeoViewVector;
                const labelValue = getLocalizedValue(geoviewLayerInstance.geoviewLayerName, mapId);

                return (
                  <Box key={labelValue !== undefined ? `labelValue-${index}` : `data-${index}`}>
                    <Box>
                      {labelValue} - {layerKey}
                    </Box>
                    <Box key={`${layerKey}-layer-datagrid-table-${index.toString()}`}>
                      <LayerDataGrid {...setLayerDataGridProps(layerKey, layerValues, layerId)} />
                    </Box>
                  </Box>
                );
              })}
        </Box>
      )}
    </Box>
  );
}

export default memo(DataTable);
