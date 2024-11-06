import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';

import { Geometry, Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon } from 'ol/geom';

import { MenuItem } from '@/ui';
import { logger } from '@/core/utils/logger';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { TypeJsonObject } from '@/core/types/global-types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';

interface JSONExportButtonProps {
  rows: unknown[];
  features: TypeFeatureInfoEntry[];
  layerPath: string;
}

/**
 * Custom  GeoJson export button which will help to download data table data in geojson format.
 * @param {TypeFeatureInfoEntry[]} features list of rows to be displayed in data table
 * @param {string} layerPath id of the layer
 * @returns {JSX.Element} returns Menu Item
 *
 */
function JSONExportButton({ rows, features, layerPath }: JSONExportButtonProps): JSX.Element {
  const { t } = useTranslation<string>();

  // get store value - projection config to transfer lat long and layer
  const { transformPoints } = useMapStoreActions();
  const { getLayer, queryLayerEsriDynamic } = useLayerStoreActions();

  /**
   * Creates a geometry json
   * @param {Geometry} geometry - The geometry
   * @returns {TypeJsonObject} The geometry json
   */
  const buildGeometry = useCallback(
    (geometry: Geometry): TypeJsonObject => {
      let builtGeometry = {};

      if (geometry instanceof Polygon) {
        // coordinates are in the form of Coordinate[][]
        builtGeometry = {
          type: 'Polygon',
          coordinates: geometry.getCoordinates().map((coords) => {
            return coords.map((coord) => transformPoints([coord], 4326)[0]);
          }),
        };
      } else if (geometry instanceof MultiPolygon) {
        // coordinates are in the form of Coordinate[][][]
        builtGeometry = {
          type: 'MultiPolygon',
          coordinates: geometry.getCoordinates().map((coords1) => {
            return coords1.map((coords2) => {
              return coords2.map((coord) => transformPoints([coord], 4326)[0]);
            });
          }),
        };
      } else if (geometry instanceof LineString) {
        // coordinates are in the form of Coordinate[]
        builtGeometry = { type: 'LineString', coordinates: geometry.getCoordinates().map((coord) => transformPoints([coord], 4326)[0]) };
      } else if (geometry instanceof MultiLineString) {
        // coordinates are in the form of Coordinate[][]
        builtGeometry = {
          type: 'MultiLineString',
          coordinates: geometry.getCoordinates().map((coords) => {
            return coords.map((coord) => transformPoints([coord], 4326)[0]);
          }),
        };
      } else if (geometry instanceof Point) {
        // coordinates are in the form of Coordinate
        builtGeometry = { type: 'Point', coordinates: transformPoints([geometry.getCoordinates()], 4326)[0] };
      } else if (geometry instanceof MultiPoint) {
        // coordinates are in the form of Coordinate[]
        builtGeometry = { type: 'MultiPoint', coordinates: geometry.getCoordinates().map((coord) => transformPoints([coord], 4326)[0]) };
      }

      return builtGeometry;
    },
    [transformPoints]
  );

  // Helper function to serialize geometry
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializeGeometry = (geometry: any) => {
    if (!geometry) return null;
    return {
      type: geometry.getType(),
      coordinates: geometry.getCoordinates(),
      // Add any other properties that might be needed
    };
  };

  /**
   * Builds the JSON features section of the file
   * @returns {string} Json file content as string
   */
  const getJsonFeatures = useCallback(
    (theFeatures: TypeFeatureInfoEntry[]): TypeJsonObject[] => {
      // Create GeoJSON feature
      return theFeatures.map((feature) => {
        const { geometry, fieldInfo } = feature;

        // Format the feature info to extract only value and remove the geoviewID field
        const formattedInfo: Record<string, unknown>[] = [];
        Object.keys(fieldInfo).forEach((key) => {
          if (key !== 'geoviewID') {
            const tmpObj: Record<string, unknown> = {};
            tmpObj[key] = fieldInfo[key]!.value;
            formattedInfo.push(tmpObj);
          }
        });

        return {
          type: 'Feature',
          geometry: buildGeometry(geometry?.getGeometry() as Geometry),
          properties: formattedInfo,
        } as unknown as TypeJsonObject;
      });
    },
    [buildGeometry]
  );

  /**
   * Builds the JSON file
   * @returns {string} Json file content as string
   */
  const getJson = useCallback(
    async (fetchGeometriesDuringProcess: boolean): Promise<string | undefined> => {
      // Filter features from filtered rows
      const rowsID = rows.map((row) => {
        if (
          typeof row === 'object' &&
          row !== null &&
          'geoviewID' in row &&
          typeof row.geoviewID === 'object' &&
          row.geoviewID !== null &&
          'value' in row.geoviewID
        ) {
          return row.geoviewID.value;
        }
        return '';
      });

      const filteredFeatures = features.filter((feature) => rowsID.includes(feature.fieldInfo.geoviewID!.value));

      // If must fetch the geometries during the process
      if (fetchGeometriesDuringProcess) {
        try {
          // Split the array in arrays of 100 features maximum
          const sublists = _.chunk(filteredFeatures, 100);

          // For each sub list
          const promises = sublists.map((sublist) => {
            // Create a new promise that will resolved when features have been updated with their geometries
            return new Promise<void>((resolve, reject) => {
              // Get the ids
              const objectids = sublist.map((record) => {
                return record.geometry?.get('OBJECTID') as number;
              });

              // Query
              queryLayerEsriDynamic(layerPath, objectids)
                .then((results) => {
                  // For each result
                  results.forEach((result) => {
                    // Filter
                    const recFound = filteredFeatures.filter(
                      (record) => record.geometry?.get('OBJECTID') === result.fieldInfo?.OBJECTID?.value
                    );

                    // If found it
                    if (recFound && recFound.length === 1) {
                      // Officially attribute the geometry to that particular record
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (recFound[0].geometry as any).setGeometry(result.geometry);
                    }
                  });

                  // Only now, resolve the promise
                  resolve();
                })
                .catch(reject);
            });
          });

          // Once all promises complete
          await Promise.all(promises);
        } catch (err) {
          // Handle error
          logger.logError('Failed to query the features to get their geometries. The output will not have the geometries.', err);
        }
      }

      // Get the Json Features
      const geoData = getJsonFeatures(filteredFeatures);

      // Stringify with some indentation
      return JSON.stringify({ type: 'FeatureCollection', features: geoData }, null, 2);
    },
    [layerPath, features, rows, getJsonFeatures, queryLayerEsriDynamic]
  );

  /**
   * Exports the blob to a file
   * @param {Blob} blob - The blob to save to file
   * @param {string} filename - File name
   */
  const exportBlob = useCallback((blob: Blob, filename: string): void => {
    // Save the blob in a json file
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }, []);

  /**
   * Exports data table in csv format.
   */
  const handleExportData = useCallback((): void => {
    const layer = getLayer(layerPath);
    const layerIsEsriDynamic = layer?.type === 'esriDynamic';

    // Get the Json content for the layer
    getJson(layerIsEsriDynamic)
      .then((jsonString: string | undefined) => {
        // If defined
        if (jsonString) {
          const blob = new Blob([jsonString], {
            type: 'text/json',
          });

          exportBlob(blob, `table-${layer?.layerName.replaceAll(' ', '-')}.json`);
        }
      })
      .catch((err) => {
        // Log
        logger.logPromiseFailed('Not able to export', err);
      });
  }, [exportBlob, getJson, getLayer, layerPath]);

  return <MenuItem onClick={handleExportData}>{t('dataTable.jsonExportBtn')}</MenuItem>;
}

export default JSONExportButton;
