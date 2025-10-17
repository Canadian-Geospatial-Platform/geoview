import { AbstractWorkerPool } from './abstract-worker-pool';
import type { FetchEsriWorkerType } from './fetch-esri-worker';
import type { QueryParams } from './fetch-esri-worker-script';
/**
 * Worker pool for managing ESRI fetch operations.
 * Extends AbstractWorkerPool to handle concurrent ESRI service requests.
 *
 * @class FetchEsriWorkerPool
 * @extends {AbstractWorkerPool<FetchEsriWorkerType>}
 */
export declare class FetchEsriWorkerPool extends AbstractWorkerPool<FetchEsriWorkerType> {
    #private;
    /**
     * Creates an instance of FetchEsriWorkerPool.
     * @param {number} [numWorkers = 2] - Number of workers to create in the pool
     */
    constructor(numWorkers?: number);
    /**
     * Initializes all workers in the pool.
     * @async
     * @returns {Promise<void>}
     * @throws {Error} When worker initialization fails
     */
    init(): Promise<void>;
    /**
     * Processes an ESRI query using an available worker from the pool.
     * @param {QueryParams} params - Parameters for the ESRI query
     * @returns {Promise<unknown>} The query results
     * @throws {Error} When no workers are available or query processing fails
     */
    process(params: QueryParams): Promise<unknown>;
}
//# sourceMappingURL=fetch-esri-worker-pool.d.ts.map