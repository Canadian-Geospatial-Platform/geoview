/**
 * Represents the log levels available for logging.
 */
export type WorkerLogLevel = 'info' | 'warning' | 'error' | 'debug' | 'trace';

/**
 * Represents the log type available for logging. Type log is trap by viewer logger
 * and log to console and message is trap by viewer and sent to notifications
 */
type WorkerLogType = 'log' | 'message';

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
   * @param {WorkerLogType} type - The type of log message.
   * @param {WorkerLogLevel} level - The log level of the message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  #log(type: WorkerLogType, level: WorkerLogLevel, ...args: unknown[]): void {
    const message = this.#prefix ? [this.#prefix, ...args] : args;
    // Send the log message to the main thread

    self.postMessage({
      type,
      level,
      message,
    });
  }

  /**
   * Logs an informational message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logInfo(...args: unknown[]): void {
    this.#log('log', 'info', ...args);
  }

  /**
   * Logs a warning message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logWarning(...args: unknown[]): void {
    this.#log('log', 'warning', ...args);
  }

  /**
   * Logs an error message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logError(...args: unknown[]): void {
    this.#log('log', 'error', ...args);
  }

  /**
   * Logs a debug message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logDebug(...args: unknown[]): void {
    this.#log('log', 'debug', ...args);
  }

  /**
   * Logs a trace message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  logTrace(...args: unknown[]): void {
    this.#log('log', 'trace', ...args);
  }

  /**
   * Logs a message to be handle by viewer notification.
   * @param {WorkerLogLevel} level - The log level of the message.
   * @param {...unknown[]} args - The message and any additional arguments to log.
   */
  sendMessage(level: WorkerLogLevel, ...args: unknown[]): void {
    this.#log('message', level, ...args);
  }
}

/**
 * Creates and returns a new WorkerLogger instance.
 * @param {string} [prefix] - Optional prefix for all log messages from this logger.
 * @returns {WorkerLogger} A new WorkerLogger instance.
 */
export const createWorkerLogger = (prefix?: string): WorkerLogger => new WorkerLogger(prefix);
