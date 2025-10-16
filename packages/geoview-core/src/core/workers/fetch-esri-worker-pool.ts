import { AbstractWorkerPool } from './abstract-worker-pool';
import type { FetchEsriWorkerType } from './fetch-esri-worker';
import { FetchEsriWorker } from './fetch-esri-worker';
import type { QueryParams } from './fetch-esri-worker-script';
import { createWorkerLogger } from './helper/logger-worker';

/**
 * Worker pool for managing ESRI fetch operations.
 * Extends AbstractWorkerPool to handle concurrent ESRI service requests.
 *
 * @class FetchEsriWorkerPool
 * @extends {AbstractWorkerPool<FetchEsriWorkerType>}
 */
export class FetchEsriWorkerPool extends AbstractWorkerPool<FetchEsriWorkerType> {
  // Logger instance for the fetch ESRI worker pool
  #logger = createWorkerLogger('FetchEsriWorkerPool');

  /**
   * Creates an instance of FetchEsriWorkerPool.
   * @param {number} [numWorkers = 2] - Number of workers to create in the pool
   */
  constructor(numWorkers: number = 2) {
    super('FetchEsriWorkerPool', FetchEsriWorker, numWorkers);
    this.#logger.logInfo('Worker pool created', `Number of workers: ${numWorkers}`);
  }

  /**
   * Initializes all workers in the pool.
   * @async
   * @returns {Promise<void>}
   * @throws {Error} When worker initialization fails
   */
  public async init(): Promise<void> {
    try {
      await Promise.all(this.workers.map((worker) => worker.init()));
      this.#logger.logTrace('Worker pool initialized');
    } catch (error: unknown) {
      this.#logger.logError('Worker pool initialization failed', error);
      throw error;
    }
  }

  /**
   * Processes an ESRI query using an available worker from the pool.
   * @param {QueryParams} params - Parameters for the ESRI query
   * @returns {Promise<unknown>} The query results
   * @throws {Error} When no workers are available or query processing fails
   */
  public async process(params: QueryParams): Promise<unknown> {
    const availableWorker = this.getAvailableWorker();
    if (!availableWorker) {
      throw new Error('No available workers');
    }

    try {
      this.busyWorkers.add(availableWorker);
      const result = await availableWorker.process(params);
      return result;
    } finally {
      this.busyWorkers.delete(availableWorker);
    }
  }
}
