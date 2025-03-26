import { expose } from 'comlink';

import { createWorkerLogger } from './helper/logger-worker';
import { TypeJsonObject } from '@/api/config/types/config-types';

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
  const identifyJsonResponse = await identifyResponse.json();

  return identifyJsonResponse;
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
 *
 * Note on ESLint warning for localProcessedFeatures:
 *
 * The ESLint rule warns about functions in loops referencing outer scope variables
 * because it can lead to unexpected behavior when the referenced variable changes
 * between the function's creation and execution time.
 *
 * However, in this specific case it's safe because:
 * 1. Each promise execution is independent and tracks its own progress
 * 2. The variable is used for progress tracking only, not critical business logic
 * 3. While the final count might have race conditions, it will be accurate
 *    once all promises complete since Promise.all() ensures all operations finish
 * 4. The main return value (features array) is not affected by this counter
 *
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

    // Create promise without awaiting - this allows parallel execution
    const promise = fetch(queryUrl)
      .then((response) => response.json())
      // eslint-disable-next-line no-loop-func
      .then((json) => {
        // Create atomic update for the counter
        const currentCount = localProcessedFeatures + json.features.length;
        localProcessedFeatures = currentCount;

        logger.logTrace({
          type: 'progress',
          data: {
            processed: currentCount,
            total: totalCount,
          },
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
  const maxConcurrentRequests = 10; // Math.min(25, navigator.hardwareConcurrency * 2);
  const baseUrl = `${params.url}/query?where=1=1&outFields=*&f=json&returnGeometry=${params.queryGeometry}&resultRecordCount=${resultRecordCount}`;

  try {
    // Get total count
    const countUrl = `${params.url}/query?where=1=1&returnCountOnly=true&f=json`;
    const countResponse = await fetch(countUrl);
    const { count: totalCount } = await countResponse.json();

    logger.logTrace('Total features count:', totalCount);
    logger.logTrace({
      type: 'progress',
      data: {
        processed: 0,
        total: totalCount,
      },
    });

    // Calculate total number of requests needed
    const totalRequests = Math.ceil(totalCount / resultRecordCount);
    const numberOfBatches = Math.ceil(totalRequests / maxConcurrentRequests);

    // Main processing loop
    let allFeatures: TypeJsonObject[] = [];
    let totalProcessedFeatures = 0;

    for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
      const startIdx = batchIndex * maxConcurrentRequests;
      const endIdx = Math.min((batchIndex + 1) * maxConcurrentRequests, totalRequests);

      // eslint-disable-next-line no-await-in-loop
      const batchResult = await processBatch(batchIndex, startIdx, endIdx, baseUrl, resultRecordCount, totalCount, totalProcessedFeatures);

      totalProcessedFeatures = batchResult.processedCount;
      allFeatures = [...allFeatures, ...batchResult.features];

      // Log the total progress after each batch
      logger.logTrace({
        type: 'progress',
        data: {
          processed: totalProcessedFeatures,
          total: totalCount,
        },
      });
    }
    const response = {
      features: allFeatures,
      count: totalCount,
    };

    return response as unknown as TypeJsonObject;
  } catch (error) {
    logger.logError('Error in queryAllEsriFeatures', error);
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
      logger.logTrace('Query completed');
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
