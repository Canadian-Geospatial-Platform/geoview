import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Geometry, Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon } from 'ol/geom';
import { MenuItem } from '@/ui';

import { logger } from '@/core/utils/logger';
import { JsonExportWorker } from '@/core/workers/json-export-worker';
import { SerializedGeometry, TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapProjection } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';

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

  // get store action and map projection
  const { getLayer, queryLayerEsriDynamic } = useLayerStoreActions();
  const { addMessage } = useAppStoreActions();
  const mapProjection = useMapProjection();

  // Keep exporting state
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Helper function to serialize a json geometry to pass to the worker
   *
   * @param {Geometry} geometry - The geometry
   * @returns {SerializedGeometry} The serialized geometry json
   */
  const serializeGeometry = (geometry: Geometry): SerializedGeometry => {
    let builtGeometry = {} as SerializedGeometry;

    if (geometry instanceof Polygon) {
      builtGeometry = { type: 'Polygon', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof MultiPolygon) {
      builtGeometry = { type: 'MultiPolygon', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof LineString) {
      builtGeometry = { type: 'LineString', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof MultiLineString) {
      builtGeometry = { type: 'MultiLineString', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof Point) {
      // TODO: There is no proper support for esriDynamic MultiPoint issue 2589... this is a workaround
      if (GeometryApi.isArrayOfCoordinates(geometry.getCoordinates())) {
        builtGeometry = { type: 'MultiPoint', coordinates: geometry.getCoordinates() };
      } else {
        builtGeometry = { type: 'Point', coordinates: geometry.getCoordinates() };
      }
    } else if (geometry instanceof MultiPoint) {
      builtGeometry = { type: 'MultiPoint', coordinates: geometry.getCoordinates() };
    }

    return builtGeometry;
  };

  const fetchESRI = useCallback(
    (chunk: TypeFeatureInfoEntry[]): Promise<TypeFeatureInfoEntry[]> => {
      try {
        // Create a new promise that will resolved when features have been updated with their geometries
        return new Promise<TypeFeatureInfoEntry[]>((resolve, reject) => {
          // Get oid field
          const oidField = chunk[0].fieldInfo
            ? Object.keys(chunk[0].fieldInfo).find((key) => chunk[0].fieldInfo[key]!.dataType === 'oid') || 'OBJECTID'
            : 'OBJECTID';

          // Get the ids
          const objectids = chunk.map((record) => {
            return record.fieldInfo[oidField]?.value as number;
          });

          // Query
          queryLayerEsriDynamic(layerPath, objectids)
            .then((results) => {
              // For each result
              results.forEach((result) => {
                // Filter
                const recFound = chunk.filter((record) => record.feature?.get(oidField) === result.fieldInfo[oidField]?.value);

                // If found it
                if (recFound && recFound.length === 1) {
                  // Officially attribute the geometry to that particular record
                  recFound[0].feature?.setGeometry(result.geometry);
                  recFound[0].geometry = result.geometry;
                }
              });

              // Only now, resolve the promise
              resolve(chunk);
            })
            .catch(reject);
        });
      } catch (error: unknown) {
        // Handle error
        logger.logError('Failed to query the features to get their geometries. The output will not have the geometries.', error);
        return Promise.resolve(chunk); // Return the original chunk if there's an error
      }
    },
    [layerPath, queryLayerEsriDynamic]
  );

  /**
   * Callback function to get JSON data for export.
   * This function is memoized using useCallback to optimize performance.
   * It will only be recreated if the dependencies (in the empty array) change.
   *
   * @returns {Promise<string>} A promise that resolves to the JSON string to be exported.
   */
  const getJson = useCallback(
    // The function* is crucial here because this is a generator function, specifically an async generator function.
    //  - The * (asterisk) indicates that this is a generator function that can yield multiple values over time
    //  - async function* is the syntax for declaring an async generator function
    //  - The combination allows you to use both await and yield in the function body
    // eslint-disable-next-line func-names
    async function* (fetchGeometriesDuringProcess: boolean): AsyncGenerator<string> {
      // create a set with the geoviewID available for download and filteres the features
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowsIDSet = new Set(rows.map((row: any) => row?.geoviewID?.value).filter(Boolean));
      const filteredFeatures = features.filter((feature) => rowsIDSet.has(feature.fieldInfo.geoviewID?.value));

      // create the worker
      const worker = new JsonExportWorker();
      const chunkSize = 100; // Adjust based on performance testing

      try {
        // Initialize the worker
        await worker.init({
          sourceCRS: `EPSG:${mapProjection}`,
          targetCRS: 'EPSG:4326',
        });

        // Loop the chunk and get the JSON
        for (let i = 0; i < filteredFeatures.length; i += chunkSize) {
          let chunk = filteredFeatures.slice(i, i + chunkSize);

          // If must fetch the geometries during the process
          if (fetchGeometriesDuringProcess) {
            // eslint-disable-next-line no-await-in-loop
            chunk = await fetchESRI(chunk);
          }

          // Use rowsIDSet to get features that needs to be exported, then serialize geometry
          const serializedChunk = chunk
            .filter((feature) => rowsIDSet.has(feature.fieldInfo.geoviewID?.value))
            .map((feature) => ({
              geometry: serializeGeometry(feature.geometry!),
              properties: Object.fromEntries(
                Object.entries(feature.fieldInfo)
                  .filter(([key]) => key !== 'geoviewID')
                  .map(([key, value]) => [key, value?.value])
              ),
            }));

          if (serializedChunk.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            const result = await worker.process(serializedChunk, i === 0);
            yield result;
          }

          // Defers execution to the next event loop iteration. This allows other pending micro
          // and macro tasks to execute, preventing long-running operations from blocking the main thread.
          // eslint-disable-next-line no-promise-executor-return, no-await-in-loop
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
        yield ']}';
      } finally {
        worker.terminate();
      }
    },
    [features, fetchESRI, mapProjection, rows]
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

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const layer = getLayer(layerPath);
      const layerIsEsriDynamic = layer?.type === CONST_LAYER_TYPES.ESRI_DYNAMIC;

      const jsonGenerator = getJson(layerIsEsriDynamic);
      const chunks = [];
      let i = 0;

      addMessage('info', 'dataTable.downloadAsGeoJSONMessage', [`${t('general.started')}...`]);
      for await (const chunk of jsonGenerator) {
        chunks.push(chunk);
        i++;

        // Update progress here
        const count = i * 100 < rows.length ? i * 100 : rows.length;
        addMessage('info', 'general.processing', [String(count), String(rows.length)]);
      }

      const fullJson = chunks.join('');
      const blob = new Blob([fullJson], { type: 'application/json' });
      exportBlob(blob, `table-${getLayer(layerPath)?.layerName.replaceAll(' ', '-')}.json`);
    } catch (error: unknown) {
      addMessage('error', 'dataTable.downloadAsGeoJSONMessage', [t('general.failed')]);
      logger.logError('Download GeoJSON failed:', error);
    } finally {
      setIsExporting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getJson]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <MenuItem onClick={handleExportData} disabled={isExporting}>
      {t('dataTable.downloadAsGeoJSON')}
    </MenuItem>
  );
}

export default JSONExportButton;
