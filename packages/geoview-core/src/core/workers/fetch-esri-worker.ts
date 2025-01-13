import { AbstractWorker } from './abstract-worker';
import { QueryParams } from './fetch-esri-worker-script';
import { TypeJsonObject } from '@/api/config/types/config-types';

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

export class FetchEsriWorker extends AbstractWorker<FetchEsriWorkerType> {
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
