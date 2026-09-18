import type { AbstractWorker } from './abstract-worker';
/**
 * Abstract base class for managing a pool of workers.
 *
 * Provides common functionality for worker pool management.
 *
 * @template T - The type of worker being managed
 */
export declare abstract class AbstractWorkerPool<T> {
    #private;
    /** Array of worker instances in the pool. */
    protected workers: AbstractWorker<T>[];
    /** Set of currently busy workers. */
    protected busyWorkers: Set<AbstractWorker<T>>;
    /** Constructor function for creating new worker instances. */
    protected readonly WorkerClass: new () => AbstractWorker<T>;
    /** Name identifier for the worker pool. */
    protected readonly name: string;
    /**
     * Creates an instance of AbstractWorkerPool.
     *
     * @param name - Name identifier for the worker pool
     * @param workerClass - Constructor for creating worker instances
     * @param numWorkers - Optional number of workers to initialize in the pool
     */
    constructor(name: string, workerClass: new () => AbstractWorker<T>, numWorkers?: number);
    /**
     * Initializes every worker in the pool.
     *
     * @param args - Arguments passed to each worker's initializer
     * @returns A promise that resolves when all workers are initialized
     */
    init(...args: unknown[]): Promise<void>;
    /**
     * Gets an available worker from the pool.
     *
     * @returns The first non-busy worker, or undefined if all are busy
     */
    protected getAvailableWorker(): AbstractWorker<T> | undefined;
    /**
     * Runs an operation on an available worker and aborts the worker when the signal fires.
     *
     * An aborted worker is terminated and replaced because a worker cannot safely resume
     * after its in-flight operation has been cancelled.
     *
     * @param operation - Operation to execute on the selected worker
     * @param signal - Optional signal used to cancel the operation
     * @returns A promise that resolves with the worker result
     * @throws {Error} When no workers are available
     * @throws {RequestAbortedError} When the operation is aborted
     */
    protected runWithWorker<TResult>(operation: (worker: AbstractWorker<T>) => Promise<TResult>, signal?: AbortSignal): Promise<TResult>;
    /** Aborts every active operation in the pool. */
    abort(): void;
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