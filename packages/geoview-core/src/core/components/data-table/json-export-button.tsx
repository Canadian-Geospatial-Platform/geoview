import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Geometry, Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon } from 'ol/geom';
import { MenuItem } from '@/ui';

import { logger } from '@/core/utils/logger';
import { JsonExportWorker } from '@/core/workers/json-export-worker';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { TypeJsonObject } from '@/core/types/global-types';
import { useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useMapProjection } from '@/core/stores/store-interface-and-intial-values/map-state';

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
  const { getLayer } = useLayerStoreActions();
  const { addMessage } = useAppStoreActions();
  const mapProjection = useMapProjection();

  // Keep exporting state
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Helper function to serialize a json geometry to pass to the worker
   *
   * @param {Geometry} geometry - The geometry
   * @returns {TypeJsonObject} The serialize geometry json
   */
  const serializeGeometry = (geometry: Geometry): TypeJsonObject => {
    let builtGeometry = {};

    if (geometry instanceof Polygon) {
      builtGeometry = { type: 'Polygon', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof MultiPolygon) {
      builtGeometry = { type: 'MultiPolygon', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof LineString) {
      builtGeometry = { type: 'LineString', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof MultiLineString) {
      builtGeometry = { type: 'MultiLineString', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof Point) {
      builtGeometry = { type: 'Point', coordinates: geometry.getCoordinates() };
    } else if (geometry instanceof MultiPoint) {
      builtGeometry = { type: 'MultiPoint', coordinates: geometry.getCoordinates() };
    }

    return builtGeometry;
  };

  /**
   * Callback function to get JSON data for export.
   * This function is memoized using useCallback to optimize performance.
   * It will only be recreated if the dependencies (in the empty array) change.
   *
   * @returns {Promise<string>} A promise that resolves to the JSON string to be exported.
   */
  const getJson = useCallback(
    // eslint-disable-next-line func-names
    async function* (): AsyncGenerator<string> {
      // create a set with the geoviewID available for download
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowsIDSet = new Set(rows.map((row: any) => row?.geoviewID?.value).filter(Boolean));

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
        for (let i = 0; i < features.length; i += chunkSize) {
          const chunk = features.slice(i, i + chunkSize);

          // Use rowsIDSet to get features that needs to be ecxported, then serialize geometry
          const serializedChunk = chunk
            .filter((feature) => rowsIDSet.has(feature.fieldInfo.geoviewID?.value))
            .map((feature) => ({
              geometry: serializeGeometry(feature.geometry?.getGeometry()?.clone() as Geometry),
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
    [features, mapProjection, rows]
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
      const jsonGenerator = getJson();
      const chunks = [];
      let i = 0;

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
    } catch (error) {
      logger.logError('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getJson]);

  return (
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    <MenuItem onClick={handleExportData} disabled={isExporting}>
      {t('dataTable.jsonExportBtn')}
    </MenuItem>
  );
}

export default JSONExportButton;
