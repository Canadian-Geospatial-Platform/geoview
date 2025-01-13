import { AbstractWorkerPool } from './abstract-worker-pool';
import { FetchEsriWorker, FetchEsriWorkerType } from './fetch-esri-worker';
import { QueryParams } from './fetch-esri-worker-script';
import { createWorkerLogger } from './helper/logger-worker';

import { TypeJsonObject } from '@/api/config/types/config-types';

export class FetchEsriWorkerPool extends AbstractWorkerPool<FetchEsriWorkerType> {
  #logger = createWorkerLogger('FetchEsriWorkerPool');

  constructor(numWorkers = navigator.hardwareConcurrency || 4) {
    super('FetchEsriWorkerPool', FetchEsriWorker, numWorkers);
    this.#logger.logInfo('Worker pool created', `Number of workers: ${numWorkers}`);
  }

  public async init(): Promise<void> {
    try {
      this.#logger.logTrace('Initializing worker pool');
      await Promise.all(this.workers.map((worker) => worker.init()));
      this.#logger.logTrace('Worker pool initialized');
    } catch (error) {
      this.#logger.logError('Worker pool initialization failed', error);
      throw error;
    }
  }

  public async process(params: QueryParams): Promise<TypeJsonObject> {
    const availableWorker = this.workers.find((w) => !this.busyWorkers.has(w));
    if (!availableWorker) {
      throw new Error('No available workers');
    }

    const result = await availableWorker.process(params);
    return result as TypeJsonObject;
  }

  // /**
  //  * Process an ESRI query and transform features using a worker from the pool
  //  */
  // public async processQuery(params: QueryParams): Promise<TypeJsonObject> {
  //   try {
  //     this.#logger.logTrace('Starting query process', params.url);
  //     const result = await this.process(params);
  //     this.#logger.logTrace('Query process completed');
  //     return result as TypeJsonObject;
  //   } catch (error) {
  //     this.#logger.logError('Query process failed', error);
  //     throw error;
  //   }
  // }
}
