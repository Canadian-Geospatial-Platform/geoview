import { AbstractWorkerPool } from './abstract-worker-pool';
import type { FetchEsriWorkerType } from './fetch-esri-worker';
import type { QueryParams } from './fetch-esri-worker-script';
/**
 * Worker pool for managing ESRI fetch operations.
 *
 * Extends AbstractWorkerPool to handle concurrent ESRI service requests.
 */
export declare class FetchEsriWorkerPool extends AbstractWorkerPool<FetchEsriWorkerType> {
    #private;
    /**
     * Creates an instance of FetchEsriWorkerPool.
     *
     * @param numWorkers - Optional number of workers to create in the pool
     */
    constructor(numWorkers?: number);
    /**
     * Processes an ESRI query using an available worker from the pool.
     *
     * @param params - Parameters for the ESRI query
     * @returns A promise that resolves to the query results
     * @throws {Error} When no workers are available or query processing fails
     */
    process(params: QueryParams, signal?: AbortSignal): Promise<unknown>;
}
//# sourceMappingURL=fetch-esri-worker-pool.d.ts.map