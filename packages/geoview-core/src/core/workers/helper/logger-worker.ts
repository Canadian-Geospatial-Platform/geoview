/** Represents the log levels available for logging. */
export type WorkerLogLevel = 'info' | 'warning' | 'error' | 'debug' | 'trace';

/** Represents log dispatch types: 'log' routes to the console logger, 'message' routes to viewer notifications. */
type WorkerLogType = 'log' | 'message';

/**
 * WorkerLogger class for handling logging in a worker context.
 *
 * This logger allows for centralized logging from workers back to the main thread,
 * maintaining a consistent logging interface across the application.
 */
class WorkerLogger {
  /** The prefix prepended to all log messages. */
  #prefix: string;

  /**
   * Creates an instance of WorkerLogger.
   *
   * @param prefix - Optional prefix to be added to all log messages
   */
  constructor(prefix: string = '') {
    this.#prefix = prefix;
  }

  /**
   * Internal method to send log messages to the main thread.
   *
   * @param type - The type of log message
   * @param level - The log level of the message
   * @param args - The message and any additional arguments to log
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
   *
   * @param args - The message and any additional arguments to log
   */
  logInfo(...args: unknown[]): void {
    this.#log('log', 'info', ...args);
  }

  /**
   * Logs a warning message.
   *
   * @param args - The message and any additional arguments to log
   */
  logWarning(...args: unknown[]): void {
    this.#log('log', 'warning', ...args);
  }

  /**
   * Logs an error message.
   *
   * @param args - The message and any additional arguments to log
   */
  logError(...args: unknown[]): void {
    this.#log('log', 'error', ...args);
  }

  /**
   * Logs a debug message.
   *
   * @param args - The message and any additional arguments to log
   */
  logDebug(...args: unknown[]): void {
    this.#log('log', 'debug', ...args);
  }

  /**
   * Logs a trace message.
   *
   * @param args - The message and any additional arguments to log
   */
  logTrace(...args: unknown[]): void {
    this.#log('log', 'trace', ...args);
  }

  /**
   * Logs a message to be handled by viewer notification.
   *
   * @param level - The log level of the message
   * @param args - The message and any additional arguments to log
   */
  sendMessage(level: WorkerLogLevel, ...args: unknown[]): void {
    this.#log('message', level, ...args);
  }
}

/**
 * Creates and returns a new WorkerLogger instance.
 *
 * @param prefix - Optional prefix for all log messages from this logger
 * @returns A new WorkerLogger instance
 */
export const createWorkerLogger = (prefix?: string): WorkerLogger => new WorkerLogger(prefix);
