import { AbstractWorkerPool } from './abstract-worker-pool';
import type { FetchEsriWorkerType } from './fetch-esri-worker';
import { FetchEsriWorker } from './fetch-esri-worker';
import type { QueryParams } from './fetch-esri-worker-script';
import { createWorkerLogger } from './helper/logger-worker';

/**
 * Worker pool for managing ESRI fetch operations.
 *
 * Extends AbstractWorkerPool to handle concurrent ESRI service requests.
 */
export class FetchEsriWorkerPool extends AbstractWorkerPool<FetchEsriWorkerType> {
  /** Logger instance for the fetch ESRI worker pool. */
  #logger = createWorkerLogger('FetchEsriWorkerPool');

  /**
   * Creates an instance of FetchEsriWorkerPool.
   *
   * @param numWorkers - Optional number of workers to create in the pool
   */
  constructor(numWorkers = 2) {
    super('FetchEsriWorkerPool', FetchEsriWorker, numWorkers);
    this.#logger.logInfo('Worker pool created', `Number of workers: ${numWorkers}`);
  }

  /**
   * Processes an ESRI query using an available worker from the pool.
   *
   * @param params - Parameters for the ESRI query
   * @returns A promise that resolves to the query results
   * @throws {Error} When no workers are available or query processing fails
   */
  process(params: QueryParams, signal?: AbortSignal): Promise<unknown> {
    return this.runWithWorker((worker) => worker.process(params), signal);
  }
}
