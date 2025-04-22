// GV This file is executed in another thread. Do not try to use our core framework too much as
// GV it tends to break the build for some reason to be investigated... e.g. we can't call delay(), see other GV note below.
// GV Similarly, we can't import fetch-helper with the Fetch class as it also ends up breaking the build. So we import a light
// GV version 'fetchWithTimeout' of a copycat in Fetch class.

import { expose } from 'comlink';

import { createWorkerLogger } from '@/core/workers/helper/logger-worker';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { AsyncSemaphore } from '@/core/utils/async-semaphore';
import { fetchWithTimeout } from '@/core/utils/fetch-worker-helper';

/**
 * This worker script is designed to be used with the FetchEsriWorker class.
 * It handles the transformation of fetch of features from ArcGIS server.
 *
 * The main operations are:
 * 1. Initialization: Set up the worker, empty for now.
 * 2. Processing: Fetch the server and return the JSON.
 */

/**
 * Interface for ESRI query parameters
 * @interface QueryParams
 * @property {string} url - The URL of the ESRI service endpoint
 * @property {string} geometryType - The type of geometry being queried
 * @property {number[]} objectIds - Array of object IDs to query
 * @property {boolean} queryGeometry - Whether to include geometry in the query
 * @property {number} projection - The spatial reference ID for the output
 * @property {number} maxAllowableOffset - The maximum allowable offset for geometry simplification
 * @property {number} maxRecordCount - The maximum number of records to return from service in one fetch
 */
export interface QueryParams {
  url: string;
  geometryType: string;
  objectIds: number[] | 'all';
  queryGeometry: boolean;
  projection: number;
  maxAllowableOffset: number;
  maxRecordCount: number;
}

// Initialize the worker logger
const logger = createWorkerLogger('FetchEsriWorker');

/**
 * Queries features from an ESRI service
 * @async
 * @param {QueryParams} params - The parameters for the ESRI query
 * @returns {Promise<TypeJsonObject>} A promise that resolves to the query results
 * @throws {Error} When the HTTP request fails
 */
async function queryEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
  // Move the ESRI query function directly into the worker to avoid circular dependencies
  const urlParam = `?objectIds=${params.objectIds}&outFields=*&returnGeometry=${params.queryGeometry}&outSR=${params.projection}&geometryPrecision=1&maxAllowableOffset=${params.maxAllowableOffset}&f=json`;

  const identifyResponse = await fetch(`${params.url}/query${urlParam}`);
  return identifyResponse.json();
}

/**
 * Processes a batch of ESRI feature requests concurrently while tracking progress
 * @param {number} batchIndex - The current batch index (0-based)
 * @param {number} startIdx - Starting index for the current batch of requests
 * @param {number} endIdx - Ending index for the current batch of requests
 * @param {string} baseUrl - Base URL for the ESRI REST service query
 * @param {number} resultRecordCount - Number of records to request per query
 * @param {number} totalCount - Total number of features to be retrieved
 * @param {number} currentProcessedFeatures - Current count of processed features
 * @returns {Promise<{features: TypeJsonObject[], processedCount: number}>} A promise that resolves to:
 *   - features: Array of feature objects from all queries in the batch
 *   - processedCount: Total number of features processed after this batch
 */
const processBatch = async (
  batchIndex: number,
  startIdx: number,
  endIdx: number,
  baseUrl: string,
  resultRecordCount: number,
  totalCount: number,
  currentProcessedFeatures: number
): Promise<{ features: TypeJsonObject[]; processedCount: number }> => {
  let localProcessedFeatures = currentProcessedFeatures;
  const promises = [];

  for (let i = 0; i < endIdx - startIdx; i++) {
    const requestIndex = startIdx + i;
    const offset = requestIndex * resultRecordCount;
    const queryUrl = `${baseUrl}&resultOffset=${offset}`;

    logger.logTrace('Creating request', {
      batch: batchIndex + 1,
      offset,
      url: queryUrl,
    });

    // Create a semaphore to update the local processed features variable
    const asyncSemaphore = new AsyncSemaphore(1);

    // Create promise without awaiting - this allows parallel execution
    const promise = fetch(queryUrl)
      .then((response) => response.json())
      // We keep the esLint but the value is taken care of by async semaphore
      // eslint-disable-next-line no-loop-func
      .then(async (json) => {
        // The current count
        const currentCount = json.features.length as number;

        // Use the semaphore to update the shared 'localProcessedFeatures' variable
        // eslint-disable-next-line no-await-in-loop
        await asyncSemaphore.withLock(() => {
          // Update localProcessedFeatures and log progress safely
          localProcessedFeatures += currentCount;
          return Promise.resolve();
        });

        logger.logTrace('progress', {
          processed: localProcessedFeatures,
          total: totalCount,
        });
        logger.sendMessage('info', {
          processed: localProcessedFeatures,
          total: totalCount,
        });

        return json.features;
      });

    promises.push(promise);
  }

  // Wait for all promises to complete at once
  const results = await Promise.all(promises);
  return {
    features: results.flat(),
    processedCount: localProcessedFeatures,
  };
};

/**
 * Queries all features from an ESRI REST service by handling querying in batches
 * @param {QueryParams} params - The query parameters
 * @returns {Promise<TypeJsonObject>} A promise that resolves to an object containing:
 *   - features: Array of feature objects
 *   - count: Total number of features
 * @throws {Error} If the query fails
 */
async function queryAllEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
  const resultRecordCount = params.maxRecordCount > 10000 ? 10000 : params.maxRecordCount;
  const maxConcurrentRequests = Math.min(10, navigator.hardwareConcurrency * 2);
  const baseUrl = `${params.url}/query?where=1=1&outFields=*&f=json&returnGeometry=${params.queryGeometry}&resultRecordCount=${resultRecordCount}`;

  try {
    // Send message for starting fetching
    logger.sendMessage('info', {
      processed: 0,
      total: 0,
    });

    // Get total count with a timeout. This is a simple query and if it takes more then 7 seconds it means
    // the server is unresponsive and we should not continue. This will throw an error...
    const countUrl = `${params.url}/query?where=1=1&returnCountOnly=true&f=json`;
    const { count: totalCount } = await fetchWithTimeout<{ count: number }>(countUrl);
    logger.logTrace('Total features count:', totalCount);

    // Calculate total number of requests needed
    const totalRequests = Math.ceil(totalCount / resultRecordCount);
    const numberOfBatches = Math.ceil(totalRequests / maxConcurrentRequests);

    // Main processing loop
    let allFeatures: TypeJsonObject[] = [];
    let totalProcessedFeatures = 0;

    for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
      const startIdx = batchIndex * maxConcurrentRequests;
      const endIdx = Math.min((batchIndex + 1) * maxConcurrentRequests, totalRequests);

      // Batch a certain number of request and await in the loop before batching the next batch. This await in loop is by design
      // eslint-disable-next-line no-await-in-loop
      const batchResult = await processBatch(batchIndex, startIdx, endIdx, baseUrl, resultRecordCount, totalCount, totalProcessedFeatures);

      // GV: Add a delay to avoid server throtle error
      // GV: We cannot use delay from '@/core/utils/utilities', it breaks the build.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

      totalProcessedFeatures = batchResult.processedCount;
      allFeatures = [...allFeatures, ...batchResult.features];
    }
    const response = {
      features: allFeatures,
      count: totalCount,
    };

    return response as unknown as TypeJsonObject;
  } catch (error) {
    logger.logError('Error in queryAllEsriFeatures', error);
    logger.sendMessage('error');
    throw error;
  }
}

/**
 * The main worker object containing methods for initialization and processing.
 */
const worker = {
  /**
   * Initializes the worker.
   */
  init(): void {
    try {
      logger.logTrace('FetchEsriWorker initialized');
    } catch {
      logger.logError('FetchEsriWorker failed to initialize');
    }
  },

  /**
   * Processes an ESRI query request
   * @param {QueryParams} params - The parameters for the ESRI query
   * @returns {Promise<TypeJsonObject>} A promise that resolves to the query results
   * @throws {Error} When the query processing fails
   */
  process(params: QueryParams): Promise<TypeJsonObject> {
    try {
      logger.logTrace('Starting query processing', JSON.stringify(params));
      const response = params.objectIds === 'all' ? queryAllEsriFeatures(params) : queryEsriFeatures(params);
      return response;
    } catch (error) {
      logger.logError('Query processing failed', error);
      throw error;
    }
  },
};

// Expose the worker methods to be accessible from the main thread
expose(worker);
export default {} as typeof Worker & { new (): Worker };
