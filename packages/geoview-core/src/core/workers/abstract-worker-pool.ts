import type { AbstractWorker } from './abstract-worker';

/**
 * Abstract base class for managing a pool of workers.
 *
 * Provides common functionality for worker pool management.
 *
 * @template T - The type of worker being managed
 */
export abstract class AbstractWorkerPool<T> {
  /** Array of worker instances in the pool. */
  protected workers: AbstractWorker<T>[] = [];

  /** Set of currently busy workers. */
  protected busyWorkers = new Set<AbstractWorker<T>>();

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
  constructor(name: string, workerClass: new () => AbstractWorker<T>, numWorkers: number = navigator.hardwareConcurrency || 2) {
    this.name = name;
    this.WorkerClass = workerClass;
    this.initializeWorkers(numWorkers);
  }

  /**
   * Initializes the specified number of workers in the pool.
   *
   * @param numWorkers - Number of workers to create
   */
  protected initializeWorkers(numWorkers: number): void {
    for (let i = 0; i < numWorkers; i++) {
      const worker = new this.WorkerClass();
      this.workers.push(worker);
    }
  }

  /**
   * Gets an available worker from the pool.
   *
   * @returns The first non-busy worker, or undefined if all are busy
   */
  protected getAvailableWorker(): AbstractWorker<T> | undefined {
    return this.workers.find((w) => !this.busyWorkers.has(w));
  }

  /**
   * Adds a message handler to all workers in the pool.
   *
   * @param handler - The message handler to add
   */
  addMessageHandler(handler: (event: MessageEvent) => void): void {
    this.workers.forEach((worker) => worker.addMessageHandler(handler));
  }

  /**
   * Removes a message handler from all workers in the pool.
   *
   * @param handler - The message handler to remove
   */
  removeMessageHandler(handler: (event: MessageEvent) => void): void {
    this.workers.forEach((worker) => worker.removeMessageHandler(handler));
  }

  /**
   * Terminates all workers in the pool and clears internal state.
   */
  terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.busyWorkers.clear();
  }
}
