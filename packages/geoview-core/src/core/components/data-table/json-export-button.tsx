/* eslint-disable no-await-in-loop */
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

// import { Geometry, Point, Polygon, LineString, MultiPoint } from 'ol/geom';
// import { Geometry } from 'ol/geom';

import { MenuItem } from '@/ui';
// import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { TypeFeatureInfoEntry } from '@/geo/map/map-schema-types';
// import { TypeJsonObject } from '@/core/types/global-types';
import { useLayerStoreActions } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
// import { logger } from '@/core/utils/logger';

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
  // const { transformPoints } = useMapStoreActions();
  const { getLayer } = useLayerStoreActions();

  /**
   * Creates a geometry json
   * @param {Geometry} geometry - The geometry
   * @returns {TypeJsonObject} The geometry json
   */
  // const buildGeometry = useCallback(
  //   (geometry: Geometry): TypeJsonObject => {
  //     let builtGeometry = {};

  //     if (geometry instanceof Polygon) {
  //       builtGeometry = {
  //         type: 'Polygon',
  //         coordinates: geometry.getCoordinates().map((coords) => {
  //           return coords.map((coord) => transformPoints([coord], 4326)[0]);
  //         }),
  //       };
  //     } else if (geometry instanceof LineString) {
  //       builtGeometry = { type: 'LineString', coordinates: geometry.getCoordinates().map((coord) => transformPoints([coord], 4326)[0]) };
  //     } else if (geometry instanceof Point) {
  //       builtGeometry = { type: 'Point', coordinates: transformPoints([geometry.getCoordinates()], 4326)[0] };
  //     } else if (geometry instanceof MultiPoint) {
  //       builtGeometry = { type: 'MultiPoint', coordinates: geometry.getCoordinates().map((coord) => transformPoints([coord], 4326)[0]) };
  //     }

  //     return builtGeometry;
  //   },
  //   [transformPoints]
  // );

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

  const getJson = useCallback(
    async function* (): AsyncGenerator<string> {
      const worker = new Worker(new URL('./worker.ts', import.meta.url));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rowsIDSet = new Set(rows.map((row: any) => row?.geoviewID?.value).filter(Boolean));
      const chunkSize = 1000; // Adjust based on performance testing

      // Get projection information
      const projectionInfo = {
        sourceCRS: 'EPSG:3978', // Projection.getSourceCRS(), // Replace with actual method to get source CRS
        targetCRS: 'EPSG:4326', // Replace with actual method to get target CRS
        // Add any other necessary projection parameters
      };

      // Initialize worker with projection info
      worker.postMessage({ type: 'init', projectionInfo });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processChunk = async (chunk: any[], isFirst: boolean): Promise<string> => {
        return new Promise((resolve) => {
          worker.onmessage = (event) => resolve(event.data);
          worker.postMessage({ type: 'process', chunk, isFirst });
        });
      };

      try {
        for (let i = 0; i < features.length; i += chunkSize) {
          const chunk = features.slice(i, i + chunkSize);
          const serializedChunk = chunk
            .filter((feature) => rowsIDSet.has(feature.fieldInfo.geoviewID?.value))
            .map((feature) => ({
              geometry: serializeGeometry(feature.geometry?.getGeometry()?.clone()),
              properties: Object.fromEntries(
                Object.entries(feature.fieldInfo)
                  .filter(([key]) => key !== 'geoviewID')
                  .map(([key, value]) => [key, value?.value])
              ),
            }));

          if (serializedChunk.length > 0) {
            const result = await processChunk(serializedChunk, i === 0);
            yield result;
          }

          // Allow UI to update
          // eslint-disable-next-line no-promise-executor-return
          await new Promise((resolve) => setTimeout(resolve, 0));
        }

        yield ']}';
      } finally {
        worker.terminate();
      }
    },
    [features, rows]
  );

  const [isExporting, setIsExporting] = useState(false);
  const { addMessage } = useAppStoreActions();

  const handleExportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const jsonGenerator = getJson();
      const chunks = [];
      let i = 0;

      for await (const chunk of jsonGenerator) {
        chunks.push(chunk);
        i++;

        // Optionally update progress here
        addMessage('info', `Processing ${i * 1000} ... of ${rows.length}`);
      }

      const fullJson = chunks.join('');
      const blob = new Blob([fullJson], { type: 'application/json' });
      exportBlob(blob, `table-${getLayer(layerPath)?.layerName.replaceAll(' ', '-')}.json`);
      // Do something with the full JSON, e.g., save to file
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [getJson]);

  // const handleExportData = useCallback(async (): Promise<void> => {
  //   try {
  //     const jsonGenerator = getJson();

  //     const stream = new ReadableStream({
  //       async start(controller) {
  //         try {
  //           for await (const chunk of jsonGenerator) {
  //             controller.enqueue(new TextEncoder().encode(chunk));
  //           }
  //         } catch (error) {
  //           console.error('Error in stream processing:', error);
  //           controller.error(error);
  //         } finally {
  //           controller.close();
  //         }
  //       },
  //     });

  //     const response = new Response(stream);
  //     const blob = await response.blob();

  //     exportBlob(blob, `table-${getLayer(layerPath)?.layerName.replaceAll(' ', '-')}.json`);
  //   } catch (error) {
  //     console.error('Export failed:', error);
  //     // Optionally, display an error message to the user
  //   }
  // }, [exportBlob, getJson, getLayer, layerPath]);

  // const handleExportData = useCallback((): void => {
  //   try {
  //     const jsonString = getJson();
  //     const blob = new Blob([jsonString], { type: 'application/json' });
  //     exportBlob(blob, `table-${getLayer(layerPath)?.layerName.replaceAll(' ', '-')}.json`);
  //   } catch (error) {
  //     logger.logError('Table download as GeoJSON failed:', error);
  //   }
  // }, [exportBlob, getJson, getLayer, layerPath]);

  return (
    <MenuItem onClick={handleExportData} disabled={isExporting}>
      {t('dataTable.jsonExportBtn')}
    </MenuItem>
  );
}

export default JSONExportButton;
