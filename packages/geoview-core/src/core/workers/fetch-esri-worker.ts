import { AbstractWorker } from './abstract-worker';
import { QueryParams } from './fetch-esri-worker-script';
import { TypeJsonObject } from '@/api/config/types/config-types';

/**
 * How to create a new worker:
 *
 * 1. Define an interface for your worker's exposed methods (init, process and other is needed)
 * 2. Create a new class extending AbstractWorker (e.g. export class MyWorker extends AbstractWorker<MyWorkerType>)
 * 3. Create the actual worker script (my-worker-script.ts):
 * 4. Use your new worker in the main application:
 *    const myWorker = new MyWorker();
 *    const result1 = await myWorker.init('test');
 *    const result2 = await myWorker.process(42, true);
 */

/**
 * Interface defining the methods exposed by the fetch ESRI worker.
 */
export interface FetchEsriWorkerType {
  /**
   * Initializes the worker - empty for now.
   */
  init: () => Promise<void>;

  /**
   * Processes an ESRI query JSON export.
   * @param {QueryParams} queryParams - The query parameters for the fetch.
   * @returns {TypeJsonObject} A promise that resolves to the response fetch as JSON string.
   */
  process: (queryParams: QueryParams) => Promise<TypeJsonObject>;
}

/**
 * Class representing a fetch ESRI worker.
 * Extends AbstractWorker to handle fetch operations on ESRI ArcGIS server in a separate thread.
 */
export class FetchEsriWorker extends AbstractWorker<FetchEsriWorkerType> {
  /**
   * Creates an instance of FetchEsriWorker.
   * Initializes the worker with the 'fetch-esri' script.
   */
  constructor() {
    super('FetchEsriWorker', new Worker(new URL('./fetch-esri-worker-script.ts', import.meta.url)));
  }

  /**
   * Initializes the worker - empty for now.
   * @returns A promise that resolves when initialization is complete.
   */
  public async init(): Promise<void> {
    const result = await this.proxy.init();
    return result;
  }

  /**
   * Processes a JSON fetch for an esri query.
   * @param {QueryParams} queryParams - The query parameters for the fetch.
   * @returns A promise that resolves to the processed JSON string.
   */
  public async process(queryParams: QueryParams): Promise<TypeJsonObject> {
    const result = await this.proxy.process(queryParams);
    return result;
  }
}
