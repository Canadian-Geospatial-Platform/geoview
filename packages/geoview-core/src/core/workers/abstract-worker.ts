import { wrap, Remote } from 'comlink';
import { logger } from '@/core/utils/logger';
import { WorkerLogLevel } from './helper/logger-worker';

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
export abstract class AbstractWorker<T> {
  /** The worker name for logging purposes. */
  protected name: string;

  /** The actual Web Worker instance. */
  protected worker: Worker;

  /** A proxy object to interact with the worker using Comlink. */
  protected proxy: Remote<T>;

  /** A list of message handlers for the worker. */
  #messageHandlers: ((event: MessageEvent) => void)[] = [];

  /**
   * Creates an instance of AbstractWorker.
   * @param {string} name - The Web Worker name for logging.
   * @param {Worker} worker - The Web Worker instance to wrap.
   */
  constructor(name: string, worker: Worker) {
    this.name = name;
    this.worker = worker;
    // Wrap the worker with Comlink to enable easy communication
    this.proxy = wrap<T>(this.worker);

    this.#setupLogging();
  }

  /**
   * Sets up logging configuration for the worker instance.
   * This private method initializes and configures the logging system
   * to handle worker-specific logging requirements.
   * @private
   */
  #setupLogging(): void {
    // Configures logging settings for the worker process
    // Ensures worker-specific log entries can be properly tracked and identified - event.data.type === 'log'
    // Establishes logging context for debugging and monitoring worker operations
    this.worker.onmessage = (event) => {
      if (event.data && event.data.type === 'log') {
        const { level, message } = event.data;
        switch (level as WorkerLogLevel) {
          case 'trace':
            logger.logTraceWorker(...message);
            break;
          case 'info':
            logger.logInfo(...message);
            break;
          case 'warning':
            logger.logWarning(...message);
            break;
          case 'error':
            logger.logError(...message);
            break;
          case 'debug':
            logger.logDebug(...message);
            break;
          default:
            break;
        }
      } else if (event.data && event.data.type === 'message') {
        // Call all registered message handlers
        this.#messageHandlers.forEach((handler) => handler(event));
      }
    };
  }

  /**
   * Initializes the worker. This method should be implemented by subclasses.
   * @param args - Arguments to pass to the worker for initialization.
   * @returns A promise that resolves when the worker is initialized.
   */
  public abstract init(...args: unknown[]): Promise<void>;

  /**
   * Process the worker. This method should be implemented by subclasses.
   * @param args - Arguments to pass to the worker for process.
   * @returns A promise that resolves when the worker is processed.
   */
  public abstract process(...args: unknown[]): Promise<unknown>;

  /**
   * Add method to register message handlers
   * @param {MessageEvent} handler - The message handler to add.
   */
  public addMessageHandler(handler: (event: MessageEvent) => void): void {
    this.#messageHandlers.push(handler);
  }

  /**
   * Add method to remove message handlers
   * @param  {MessageEvent} handler - The message handler to remove.
   */
  public removeMessageHandler(handler: (event: MessageEvent) => void): void {
    const index = this.#messageHandlers.indexOf(handler);
    if (index > -1) {
      this.#messageHandlers.splice(index, 1);
    }
  }

  /**
   * Terminates the worker.
   */
  terminate(): void {
    try {
      // Clear message handlers before terminating
      this.#messageHandlers = [];
      this.worker.terminate();
      logger.logTraceWorker('Done terminating worker:', this.name);
    } catch (error: unknown) {
      logger.logError('Error terminating worker:', this.name, error);
    }
  }
}
