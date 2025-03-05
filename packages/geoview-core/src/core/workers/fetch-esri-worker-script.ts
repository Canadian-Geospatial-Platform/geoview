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
 */
export interface QueryParams {
  url: string;
  geometryType: string;
  objectIds: number[] | 'all';
  queryGeometry: boolean;
  projection: number;
  maxAllowableOffset: number;
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
async function getAdditionalFeatures(url: string, maxRecordCount: number, resultOffset?: number): Promise<unknown[]> {
  const responseArray: unknown[] = [];
  // Add resultOffset to layer query
  const nextUrl = `${url}&resultOffset=${resultOffset || maxRecordCount}`;

  try {
    // Fetch response json and push features to array
    const response = await fetch(nextUrl);
    const jsonResponse = await response.json();
    responseArray.push(jsonResponse.features);

    // Check if there are additional features to fetch
    if (jsonResponse.exceededTransferLimit)
      responseArray.push(
        ...(await getAdditionalFeatures(url, maxRecordCount, resultOffset ? resultOffset + maxRecordCount : 2 * maxRecordCount))
      );
  } catch (error) {
    logger.logError(`Error loading additional features from ${nextUrl}`, error);
  }

  return responseArray;
}

/**
 * Queries all features from an ESRI service
 * @async
 * @param {QueryParams} params - The parameters for the ESRI query
 * @returns {Promise<TypeJsonObject>} A promise that resolves to the query results
 * @throws {Error} When the HTTP request fails
 */
async function queryAllEsriFeatures(params: QueryParams): Promise<TypeJsonObject> {
  // Move the ESRI query function directly into the worker to avoid circular dependencies
  const url = `${params.url}/query?where=1=1&outFields=*&f=json&returnGeometry=false`;
  const identifyResponse = await fetch(url);
  const identifyJsonResponse = await identifyResponse.json();

  // Check if there are additional features and get them
  if (identifyJsonResponse.features && identifyJsonResponse.exceededTransferLimit) {
    const features = await getAdditionalFeatures(url, identifyJsonResponse.features.length);
    (features as TypeJsonObject[][]).forEach((featureArray) => identifyJsonResponse.features.push(...featureArray));
  } else if (!identifyJsonResponse.features) throw new Error('Error querying service. No features were returned.');

  return identifyJsonResponse;
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
