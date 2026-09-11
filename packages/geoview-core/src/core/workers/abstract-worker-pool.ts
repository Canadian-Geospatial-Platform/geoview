import type { AbstractWorker } from './abstract-worker';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

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
  protected readonly WorkerClass: new () => AbstractWorker<T>;

  /** Name identifier for the worker pool. */
  protected readonly name: string;

  /** Message handlers that must also be registered on replacement workers. */
  #messageHandlers: ((event: MessageEvent) => void)[] = [];

  /** Active operations that can be cancelled by the pool. */
  #activeOperations = new Map<AbstractWorker<T>, AbortController>();

  /** Indicates that the pool is shutting down and must not create replacements. */
  #isTerminating = false;

  /**
   * Creates an instance of AbstractWorkerPool.
   *
   * @param name - Name identifier for the worker pool
   * @param workerClass - Constructor for creating worker instances
   * @param numWorkers - Optional number of workers to initialize in the pool
   */
  constructor(name: string, workerClass: new () => AbstractWorker<T>, numWorkers = globalThis.navigator?.hardwareConcurrency ?? 2) {
    this.name = name;
    this.WorkerClass = workerClass;

    // Create the workers
    for (let i = 0; i < numWorkers; i++) {
      const worker = new this.WorkerClass();
      this.workers.push(worker);
    }
  }

  /**
   * Initializes every worker in the pool.
   *
   * @param args - Arguments passed to each worker's initializer
   * @returns A promise that resolves when all workers are initialized
   */
  async init(...args: unknown[]): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.init(...args)));
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
  protected async runWithWorker<TResult>(
    operation: (worker: AbstractWorker<T>) => Promise<TResult>,
    signal?: AbortSignal
  ): Promise<TResult> {
    // Reject before reserving a worker so an already-cancelled request cannot report a pool-capacity error.
    if (signal?.aborted) return Promise.reject(new RequestAbortedError(signal));
    const worker = this.getAvailableWorker();
    if (!worker) throw new Error(`No available workers in ${this.name}`);

    // Keep a pool-owned controller for every active operation so abort() can cancel work
    // even when the caller did not provide an external signal.
    const controller = new AbortController();

    // Bridge the caller's signal to the pool-owned controller.
    const abortOperation = (): void => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abortOperation, { once: true });
    this.#activeOperations.set(worker, controller);
    this.busyWorkers.add(worker);

    // Terminating the worker is the cancellation mechanism because the worker's in-flight
    // operation cannot receive the AbortSignal through the current worker protocol.
    const abortPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener(
        'abort',
        () => {
          // Replace the terminated worker so the pool can service later operations.
          if (!this.#isTerminating) this.#replaceAbortedWorker(worker);
          reject(new RequestAbortedError(signal ?? controller.signal));
        },
        { once: true }
      );
    });

    try {
      // Whichever completes first determines the operation result: worker success/failure or cancellation.
      return await Promise.race([operation(worker), abortPromise]);
    } finally {
      // Release only the bookkeeping for the original worker; a replacement manages its own readiness state.
      signal?.removeEventListener('abort', abortOperation);
      this.#activeOperations.delete(worker);
      this.busyWorkers.delete(worker);
    }
  }

  /** Aborts every active operation in the pool. */
  abort(): void {
    this.#activeOperations.forEach((controller) => controller.abort());
  }

  /**
   * Adds a message handler to all workers in the pool.
   *
   * @param handler - The message handler to add
   */
  addMessageHandler(handler: (event: MessageEvent) => void): void {
    if (this.#messageHandlers.includes(handler)) return;
    this.#messageHandlers.push(handler);
    this.workers.forEach((worker) => worker.addMessageHandler(handler));
  }

  /**
   * Removes a message handler from all workers in the pool.
   *
   * @param handler - The message handler to remove
   */
  removeMessageHandler(handler: (event: MessageEvent) => void): void {
    this.#messageHandlers = this.#messageHandlers.filter((registeredHandler) => registeredHandler !== handler);
    this.workers.forEach((worker) => worker.removeMessageHandler(handler));
  }

  /**
   * Terminates all workers in the pool and clears internal state.
   */
  terminate(): void {
    this.#isTerminating = true;
    this.abort();
    const workersToTerminate = this.workers;
    this.workers = [];
    this.busyWorkers.clear();
    this.#activeOperations.clear();
    workersToTerminate.forEach((worker) => worker.terminate());
  }

  /**
   * Replaces a worker after its operation has been aborted.
   *
   * @param worker - Worker that can no longer be reused
   */
  #replaceAbortedWorker(worker: AbstractWorker<T>): void {
    const workerIndex = this.workers.indexOf(worker);
    worker.terminate();
    if (workerIndex === -1) return;

    const replacementWorker = new this.WorkerClass();
    this.#messageHandlers.forEach((handler) => replacementWorker.addMessageHandler(handler));
    this.workers[workerIndex] = replacementWorker;
    this.busyWorkers.add(replacementWorker);
    void replacementWorker
      .init()
      .catch((error: unknown) => {
        logger.logError(`Failed to initialize replacement worker in ${this.name}`, error);
        if (this.workers[workerIndex] === replacementWorker) this.workers.splice(workerIndex, 1);
        replacementWorker.terminate();
      })
      .finally(() => this.busyWorkers.delete(replacementWorker));
  }
}
