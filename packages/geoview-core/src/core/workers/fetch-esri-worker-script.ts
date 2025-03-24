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

/** ***************************************************************************************************************************
 * Fetch additional features from service with a max record count.
 *
 * @param {string} url - The base url for the service.
 * @param {number} maxRecordCount - The max record count from the service.
 * @param {number} resultOffset - The current offset to use for the features.
 * @returns {Promise<unknown[]>} An array of the response text for the features.
 * @private
 */
// async function getAdditionalFeatures(url: string, maxRecordCount: number, resultOffset?: number): Promise<unknown[]> {
//   const responseArray: unknown[] = [];
//   // Add resultOffset to layer query
//   const nextUrl = `${url}&resultOffset=${resultOffset || maxRecordCount}`;

//   logger.logTrace('', maxRecordCount, resultOffset);
//   try {
//     // Fetch response json and push features to array
//     const response = await fetch(nextUrl);
//     const jsonResponse = await response.json();
//     responseArray.push(jsonResponse.features);

//     // Check if there are additional features to fetch
//     if (jsonResponse.exceededTransferLimit)
//       responseArray.push(
//         ...(await getAdditionalFeatures(url, maxRecordCount, resultOffset ? resultOffset + maxRecordCount : 2 * maxRecordCount))
//       );
//   } catch (error) {
//     logger.logError(`Error loading additional features from ${nextUrl}`, error);
//   }

//   return responseArray;
// }

async function getAdditionalFeatures(url: string, maxRecordCount: number, resultOffset?: number): Promise<unknown[]> {
  const responseArray: unknown[] = [];
  const nextUrl = `${url}&resultOffset=${resultOffset || maxRecordCount}`;

  logger.logTrace('Getting additional features', { url: nextUrl, maxRecordCount, resultOffset });

  try {
    // Fetch first batch
    const response = await fetch(nextUrl);
    const jsonResponse = await response.json();
    responseArray.push(jsonResponse.features);

    if (jsonResponse.exceededTransferLimit) {
      // Calculate total records and number of additional requests needed
      const totalRecords = jsonResponse.count;
      const remainingRecords = totalRecords - (resultOffset || maxRecordCount);
      const numberOfRequests = Math.ceil(remainingRecords / maxRecordCount);

      logger.logTrace('Preparing concurrent requests', {
        totalRecords,
        remainingRecords,
        numberOfRequests,
      });

      // Create array of promises for concurrent requests
      const promises = Array.from({ length: numberOfRequests }, (_, index) => {
        const offset = (resultOffset || maxRecordCount) + (index + 1) * maxRecordCount;
        const queryUrl = `${url}&resultOffset=${offset}`;

        logger.logTrace('Fetching batch', { offset, url: queryUrl });

        return fetch(queryUrl)
          .then((response1) => response1.json())
          .then((json) => {
            // Report progress
            const progress = Math.min(((offset + maxRecordCount) / totalRecords) * 100, 100);
            logger.logInfo({
              type: 'progress',
              data: {
                processed: offset + maxRecordCount,
                total: totalRecords,
                percentage: Math.round(progress),
              },
            });
            return json.features;
          });
      });

      // Wait for all requests to complete
      const results = await Promise.all(promises);
      responseArray.push(...results);
    }
  } catch (error) {
    logger.logError('Error loading additional features', error);
    throw error;
  }

  return responseArray.flat();
}

/**
 * Queries all features from an ESRI service
 * @async
 * @param {QueryParams} params - The parameters for the ESRI query
 * @returns {Promise<TypeJsonObject>} A promise that resolves to the query results
 * @throws {Error} When the HTTP request fails
 */
// async function queryAllEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
//   // Move the ESRI query function directly into the worker to avoid circular dependencies
//   const url = `${params.url}/query?where=1=1&outFields=*&f=json&returnGeometry=false&resultRecordCount=1000`;
//   const identifyResponse = await fetch(url);
//   const identifyJsonResponse = await identifyResponse.json();

//   // Check if there are additional features and get them
//   if (identifyJsonResponse.features && identifyJsonResponse.exceededTransferLimit) {
//     const features = await getAdditionalFeatures(url, identifyJsonResponse.features.length);
//     (features as TypeJsonObject[][]).forEach((featureArray) => identifyJsonResponse.features.push(...featureArray));
//   } else if (!identifyJsonResponse.features) throw new Error('Error querying service. No features were returned.');

//   return identifyJsonResponse;
// }
// async function queryAllEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
//   const resultRecordCount = 10000; // Your max record count per request
//   const baseUrl = `${params.url}/query?where=1=1&outFields=*&f=json&returnGeometry=false&resultRecordCount=${resultRecordCount}`;

//   try {
//     // First get the total count
//     const countUrl = `${params.url}/query?where=1=1&returnCountOnly=true&f=json`;
//     const countResponse = await fetch(countUrl);
//     const { count: totalCount } = await countResponse.json();

//     logger.logTrace('Total features count:', totalCount);

//     // Calculate number of requests needed
//     const numberOfRequests = Math.ceil(totalCount / resultRecordCount);

//     // Create all promises at once
//     const promises = Array.from({ length: numberOfRequests }, (_, index) => {
//       const offset = index * resultRecordCount;
//       const queryUrl = `${baseUrl}&resultOffset=${offset}`;

//       logger.logTrace('Creating request', { offset, url: queryUrl });

//       return fetch(queryUrl)
//         .then((response) => response.json())
//         .then((json) => {
//           // Report progress
//           const progress = Math.min(((offset + resultRecordCount) / totalCount) * 100, 100);
//           logger.logTrace({
//             type: 'progress',
//             data: {
//               processed: offset + Math.min(resultRecordCount, totalCount - offset),
//               total: totalCount,
//               percentage: Math.round(progress),
//             },
//           });
//           return json.features;
//         });
//     });

//     // Execute all requests concurrently
//     const results = await Promise.all(promises);

//     // Combine all results
//     const allFeatures = results.flat();

//     // Create final response
//     const response = {
//       features: allFeatures,
//       count: totalCount,
//       exceededTransferLimit: false, // We've fetched everything
//     };

//     return response;
//   } catch (error) {
//     logger.logError('Error in queryAllEsriFeatures', error);
//     throw error;
//   }
// }
async function queryAllEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
  const resultRecordCount = params.maxRecordCount;
  const maxConcurrentRequests = 10;
  const baseUrl = `${params.url}/query?where=1=1&outFields=*&f=json&returnGeometry=false&resultRecordCount=${resultRecordCount}`;

  try {
    // Get total count
    const countUrl = `${params.url}/query?where=1=1&returnCountOnly=true&f=json`;
    const countResponse = await fetch(countUrl);
    const { count: totalCount } = await countResponse.json();

    logger.logTrace('Total features count:', totalCount);

    // Calculate total number of requests needed
    const totalRequests = Math.ceil(totalCount / resultRecordCount);
    const numberOfBatches = Math.ceil(totalRequests / maxConcurrentRequests);

    // Process in batches
    let processedFeatures = 0;
    let allFeatures: TypeJsonObject[] = [];
    for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
      const startIdx = batchIndex * maxConcurrentRequests;
      const endIdx = Math.min((batchIndex + 1) * maxConcurrentRequests, totalRequests);

      // eslint-disable-next-line no-loop-func
      const batchPromises = Array.from({ length: endIdx - startIdx }, (_, index) => {
        const requestIndex = startIdx + index;
        const offset = requestIndex * resultRecordCount;
        const queryUrl = `${baseUrl}&resultOffset=${offset}`;

        logger.logTrace('Creating request', {
          batch: batchIndex + 1,
          offset,
          url: queryUrl,
        });

        return fetch(queryUrl)
          .then((response) => response.json())
          .then((json) => {
            // Update processed count and emit progress
            processedFeatures += json.features.length;

            // Log progression of fetching with a trace of type 'progress'.
            // this type will be trapped by fetchWorkerPool.addMessageHandler and propagete to ui.
            logger.logTrace({
              type: 'progress',
              data: {
                processed: processedFeatures,
                total: totalCount,
              },
            });
            return json.features;
          });
      });

      // Execute batch
      // eslint-disable-next-line no-await-in-loop
      const batchResults = await Promise.all(batchPromises);
      allFeatures = [...allFeatures, ...batchResults.flat()];
    }

    const response = {
      features: allFeatures,
      count: totalCount,
      exceededTransferLimit: false,
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
