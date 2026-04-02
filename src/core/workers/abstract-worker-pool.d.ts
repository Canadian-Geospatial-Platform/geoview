import type { AbstractWorker } from './abstract-worker';
/**
 * Abstract base class for managing a pool of workers.
 *
 * Provides common functionality for worker pool management.
 *
 * @template T - The type of worker being managed
 */
export declare abstract class AbstractWorkerPool<T> {
    /** Array of worker instances in the pool. */
    protected workers: AbstractWorker<T>[];
    /** Set of currently busy workers. */
    protected busyWorkers: Set<AbstractWorker<T>>;
    /** Constructor function for creating new worker instances. */
    protected WorkerClass: new () => AbstractWorker<T>;
    /** Name identifier for the worker pool. */
    protected name: string;
    /**
     * Creates an instance of AbstractWorkerPool.
     *
     * @param name - Name identifier for the worker pool
     * @param workerClass - Constructor for creating worker instances
     * @param numWorkers - Optional number of workers to initialize in the pool
     */
    constructor(name: string, workerClass: new () => AbstractWorker<T>, numWorkers?: number);
    /**
     * Initializes the specified number of workers in the pool.
     *
     * @param numWorkers - Number of workers to create
     */
    protected initializeWorkers(numWorkers: number): void;
    /**
     * Gets an available worker from the pool.
     *
     * @returns The first non-busy worker, or undefined if all are busy
     */
    protected getAvailableWorker(): AbstractWorker<T> | undefined;
    /**
     * Adds a message handler to all workers in the pool.
     *
     * @param handler - The message handler to add
     */
    addMessageHandler(handler: (event: MessageEvent) => void): void;
    /**
     * Removes a message handler from all workers in the pool.
     *
     * @param handler - The message handler to remove
     */
    removeMessageHandler(handler: (event: MessageEvent) => void): void;
    /**
     * Terminates all workers in the pool and clears internal state.
     */
    terminate(): void;
}
//# sourceMappingURL=abstract-worker-pool.d.ts.map