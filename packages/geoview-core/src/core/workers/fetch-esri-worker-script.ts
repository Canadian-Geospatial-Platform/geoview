import { expose } from 'comlink';

import { createWorkerLogger } from './helper/logger-worker';

import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeStyleGeometry } from '@/api/config/types/map-schema-types';

export interface QueryParams {
  url: string;
  geometryType: TypeStyleGeometry;
  objectIds: number[];
  queryGeometry: boolean;
  projection: number;
  maxAllowableOffset: number;
}

const logger = createWorkerLogger('FetchEsriWorker');

// Move the ESRI query function directly into the worker to avoid circular dependencies
async function queryEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
  const response = await fetch(`${params.url}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      f: 'json',
      geometryType: params.geometryType,
      objectIds: params.objectIds.join(','),
      outFields: '*',
      returnGeometry: params.queryGeometry.toString(),
      outSR: params.projection.toString(),
      maxAllowableOffset: params.maxAllowableOffset.toString(),
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

const worker = {
  // eslint-disable-next-line require-await
  async init(): Promise<void> {
    try {
      logger.logTrace('init worker', 'FetchEsriWorker initialized');
    } catch {
      logger.logError('init worker', 'FetchEsriWorker failed to initialize');
    }
  },

  async process(params: QueryParams): Promise<TypeJsonObject> {
    try {
      logger.logTrace('process worker - Starting query processing', params.url);
      const response = await queryEsriFeatures(params);
      logger.logDebug('process worker - Query completed');
      return response;
    } catch (error) {
      logger.logError('process worker - Query processing failed', error);
      throw error;
    }
  },
};

// Expose the worker methods to be accessible from the main thread
expose(worker);
export default {} as typeof Worker & { new (): Worker };
