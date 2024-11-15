import { Remote } from 'comlink';
/**
 * To create a new worker:
 * 1. Create a new TypeScript file for your worker in src/workers folder (e.g., my-work-script.ts).
 * 2. Implement the worker's functionality in this file.
 * 3. In the samme folder, create a new class that extends AbstractWorker, implementing the `init` and `processs` methods (e.g., my-work-worker.ts).
 * 4. In your main application code:
 *    - Create a new Worker instance using the worker file.
 *    - Pass this Worker instance to your AbstractWorker subclass constructor.
 *    - Call the `init` method to set up the worker and `process` to do your work.
 *    - Call the `terminate` method when you're done with the worker.
 */
/**
 * Abstract base class for creating worker instances.
 * @template T - The type of the worker's exposed methods and properties.
 */
export declare abstract class AbstractWorker<T> {
    #private;
    /** The worker name for logging purposes. */
    protected name: string;
    /** The actual Web Worker instance. */
    protected worker: Worker;
    /** A proxy object to interact with the worker using Comlink. */
    protected proxy: Remote<T>;
    /**
     * Creates an instance of AbstractWorker.
     * @param {string} name - The Web Worker name for logging.
     * @param {Worker} worker - The Web Worker instance to wrap.
     */
    constructor(name: string, worker: Worker);
    /**
     * Initializes the worker. This method should be implemented by subclasses.
     * @param args - Arguments to pass to the worker for initialization.
     * @returns A promise that resolves when the worker is initialized.
     */
    protected abstract init(...args: unknown[]): Promise<void>;
    /**
     * Process the worker. This method should be implemented by subclasses.
     * @param args - Arguments to pass to the worker for process.
     * @returns A promise that resolves when the worker is processed.
     */
    protected abstract process(...args: unknown[]): Promise<string>;
    /**
     * Terminates the worker.
     */
    terminate(): void;
}
