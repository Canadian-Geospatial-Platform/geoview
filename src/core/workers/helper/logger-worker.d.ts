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
declare class WorkerLogger {
    #private;
    /**
     * Creates an instance of WorkerLogger.
     * @param {string} [prefix=''] - The prefix to be added to all log messages.
     */
    constructor(prefix?: string);
    /**
     * Logs an informational message.
     * @param {...unknown[]} args - The message and any additional arguments to log.
     */
    logInfo(...args: unknown[]): void;
    /**
     * Logs a warning message.
     * @param {...unknown[]} args - The message and any additional arguments to log.
     */
    logWarning(...args: unknown[]): void;
    /**
     * Logs an error message.
     * @param {...unknown[]} args - The message and any additional arguments to log.
     */
    logError(...args: unknown[]): void;
    /**
     * Logs a debug message.
     * @param {...unknown[]} args - The message and any additional arguments to log.
     */
    logDebug(...args: unknown[]): void;
    /**
     * Logs a trace message.
     * @param {...unknown[]} args - The message and any additional arguments to log.
     */
    logTrace(...args: unknown[]): void;
}
/**
 * Creates and returns a new WorkerLogger instance.
 * @param {string} [prefix] - Optional prefix for all log messages from this logger.
 * @returns {WorkerLogger} A new WorkerLogger instance.
 */
export declare const createWorkerLogger: (prefix?: string) => WorkerLogger;
export {};
