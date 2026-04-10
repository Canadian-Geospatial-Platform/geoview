import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Geometry } from 'ol/geom';
import { Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon } from 'ol/geom';
import { MenuItem } from '@/ui';

import { JsonExportWorker } from '@/core/workers/json-export-worker';
import type { SerializedGeometry, TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { useStoreLayerName, useStoreLayerSchemaTag } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useStoreMapCurrentProjectionEPSG } from '@/core/stores/store-interface-and-intial-values/map-state';
import { GeometryApi } from '@/geo/layer/geometry/geometry';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { TIMEOUT } from '@/core/utils/constant';
import { logger } from '@/core/utils/logger';
import { useLayerController, useUIController } from '@/core/controllers/use-controllers';

/** Properties for the JSONExportButton component. */
interface JSONExportButtonProps {
  layerPath: string;
  rows: unknown[];
  features: TypeFeatureInfoEntry[];
}

/**
 * Renders a GeoJSON export menu item for downloading data table data.
 *
 * @param props - JSONExportButton properties
 * @returns The GeoJSON export menu item element
 */
function JSONExportButton({ rows, features, layerPath }: JSONExportButtonProps): JSX.Element {
  // Log
  logger.logTraceRender('components/data-table/json-export-button');

  const { t } = useTranslation<string>();

  // get store action and map projection
  const uiController = useUIController();
  const mapProjectionEPSG = useStoreMapCurrentProjectionEPSG();
  const layerName = useStoreLayerName(layerPath) ?? '';
  const schemaTag = useStoreLayerSchemaTag(layerPath);
  const layerController = useLayerController();

  // Keep exporting state
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Serializes a geometry to a JSON-compatible format for the worker.
   *
   * @param geometry - The geometry to serialize
   * @returns The serialized geometry JSON
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

  /**
   * Fetches geometries for a chunk of ESRI Dynamic features.
   *
   * @param chunk - The features to fetch geometries for
   * @returns A promise that resolves with the features updated with their geometries
   */
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
          layerController
            .queryLayerEsriDynamic(layerPath, objectids)
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
    [layerPath, layerController]
  );

  /**
   * Generates GeoJSON data as an async generator yielding string chunks.
   *
   * @param fetchGeometriesDuringProcess - Whether to fetch geometries from the server during export
   * @returns An async generator that yields GeoJSON string chunks
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
          sourceCRS: mapProjectionEPSG,
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
          await new Promise((resolve) => setTimeout(resolve, TIMEOUT.deferExecution));
        }
        yield ']}';
      } finally {
        worker.terminate();
      }
    },
    [features, fetchESRI, mapProjectionEPSG, rows]
  );

  /**
   * Exports a blob to a downloadable file.
   *
   * @param blob - The blob to save
   * @param filename - The file name
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
   * Handles exporting data table data in GeoJSON format.
   *
   * @returns A promise that resolves when the export completes
   */
  const handleExportData = useCallback(async (): Promise<void> => {
    setIsExporting(true);
    try {
      const layerIsEsriDynamic = schemaTag === CONST_LAYER_TYPES.ESRI_DYNAMIC;
      const jsonGenerator = getJson(layerIsEsriDynamic);
      const chunks = [];
      let i = 0;

      uiController.addMessage('info', 'dataTable.downloadAsGeoJSONMessage', [`${t('general.started')}...`]);
      for await (const chunk of jsonGenerator) {
        chunks.push(chunk);
        i++;

        // Update progress here
        const count = i * 100 < rows.length ? i * 100 : rows.length;
        uiController.addMessage('info', 'general.processing', [String(count), String(rows.length)]);
      }

      const fullJson = chunks.join('');
      const blob = new Blob([fullJson], { type: 'application/json' });
      exportBlob(blob, `table-${layerName.replaceAll(' ', '-')}.json`);
    } catch (error: unknown) {
      uiController.addMessage('error', 'dataTable.downloadAsGeoJSONMessage', [t('general.failed')]);
      logger.logError('Download GeoJSON failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [uiController, exportBlob, getJson, layerName, schemaTag, rows.length, t]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <MenuItem onClick={handleExportData} disabled={isExporting}>
      {t('dataTable.downloadAsGeoJSON')}
    </MenuItem>
  );
}

export default JSONExportButton;
