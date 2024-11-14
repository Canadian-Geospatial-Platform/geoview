/**
 * Represents the log levels available for logging.
 */
export type WorkerLogLevel = 'info' | 'warning' | 'error' | 'debug' | 'trace';

/**
 * WorkerLogger class for handling logging in a worker context.
 *
 * This logger allows for centralized logging from workers back to the main thread,
 * maintaining a consistent logging interface across the application.
 */
class WorkerLogger {
  #prefix: string;

  /**
   * Creates an instance of WorkerLogger.
   * @param {string} [prefix=''] - The prefix to be added to all log messages.
   */
  constructor(prefix: string = '') {
    this.#prefix = prefix;
  }

  /**
   * Internal method to send log messages to the main thread.
   * @private
   * @param {WorkerLogLevel} level - The log level of the message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  #log(level: WorkerLogLevel, ...args: unknown[]): void {
    const message = this.#prefix ? [this.#prefix, ...args] : args;
    // Send the log message to the main thread
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'log',
      level,
      message,
    });
  }

  /**
   * Logs an informational message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logInfo(...args: unknown[]): void {
    this.#log('info', ...args);
  }

  /**
   * Logs a warning message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logWarning(...args: unknown[]): void {
    this.#log('warning', ...args);
  }

  /**
   * Logs an error message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logError(...args: unknown[]): void {
    this.#log('error', ...args);
  }

  /**
   * Logs a debug message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logDebug(...args: unknown[]): void {
    this.#log('debug', ...args);
  }

  /**
   * Logs a trace message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logTrace(...args: unknown[]): void {
    this.#log('trace', ...args);
  }
}

/**
 * Creates and returns a new WorkerLogger instance.
 * @param {string} [prefix] - Optional prefix for all log messages from this logger.
 * @returns {WorkerLogger} A new WorkerLogger instance.
 */
export const createWorkerLogger = (prefix?: string): WorkerLogger => new WorkerLogger(prefix);
