/* eslint-disable no-console */

// The log levels.
// Contain the most detailed messages. These messages may contain sensitive app data. Disabled by default. Only shows in development environment.
export const LOG_TRACE_DETAILED = 1;
// Contain the most detailed messages. These messages may contain sensitive app data. Disabled by default. Only shows in development environment.
export const LOG_TRACE = 5;
// For debugging and development. Disabled by default. Only shows in development environment.
export const LOG_DEBUG = 10;
// Tracks the general flow of the app. Enabled by default. Only shows in development environment.
export const LOG_INFO_DEV = 20;
// Tracks the general flow of the app. Enabled by default. Shows in all environment.
export const LOG_INFO = 30;
// For abnormal or unexpected events. Typically includes errors or conditions that don't cause the app to fail. Enabled by default. Shows in all environment.
export const LOG_WARNING = 40;
// For errors and exceptions that cannot be handled. Enabled by default. Shows in all environment.
export const LOG_ERROR = 50;

// Set the current level for the logger
const CURRENT_LEVEL = LOG_DEBUG; // LOG_DEBUG should be the default, use LOG_TRACE or lower when deep debugging

/**
 * Checks if the web application is running localhost
 * @returns boolean true if running localhost
 */
const runningDev = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * A Console Logger to help out logging information with levels of details.
 */
export class ConsoleLogger {
  // The logging level. The higher the number, the more detailed the log.
  loggingLevel: number;

  /**
   * Constructor
   * @param logLevel? number Indicate the level of detail for the ConsoleLogger. The higher the number, the more detailed the log.
   */
  constructor(logLevel?: number) {
    // Set the level for the logger so that it logs what we really want to see.
    this.loggingLevel = logLevel || LOG_INFO_DEV;
  }

  /**
   * Logs tracing calls at the highest level of detail.
   * Only shows in development environment.
   * @param message unknown[] the messages to log
   */
  logTraceDetailed = (...message: unknown[]): void => {
    // Validate running environment
    if (!runningDev()) return;
    // Redirect
    this.logLevel(LOG_TRACE_DETAILED, ...message);
  };

  /**
   * Logs tracing calls.
   * Only shows in development environment.
   * @param message unknown[] the messages to log
   */
  logTrace = (...message: unknown[]): void => {
    // Validate running environment
    if (!runningDev()) return;
    // Redirect
    this.logLevel(LOG_TRACE, ...message);
  };

  /**
   * Logs debug information.
   * Only shows in development environment.
   * @param message unknown[] the messages to log
   */
  logDebug = (...message: unknown[]): void => {
    // Validate running environment
    if (!runningDev()) return;
    // Redirect
    this.logLevel(LOG_DEBUG, ...message);
  };

  /**
   * Logs general flow of the application.
   * Only shows in development environment.
   * @param message unknown[] the messages to log
   */
  logInfoDev = (...message: unknown[]): void => {
    // Validate running environment
    if (!runningDev()) return;
    // Redirect
    this.logLevel(LOG_INFO_DEV, ...message);
  };

  /**
   * Logs general flow of the application.
   * Shows in all environments.
   * @param message unknown[] the messages to log
   */
  logInfo = (...message: unknown[]): void => {
    // Redirect
    this.logLevel(LOG_INFO, ...message);
  };

  /**
   * Logs warnings coming from the application.
   * Shows in all environments.
   * @param message unknown[] the messages to log
   */
  logWarning = (...message: unknown[]): void => {
    // Redirect
    this.warnLevel(LOG_WARNING, ...message);
  };

  /**
   * Logs errors coming from the application.
   * Shows in all environments.
   * @param message unknown[] the messages to log
   */
  logError = (...message: unknown[]): void => {
    // Redirect
    this.errorLevel(LOG_ERROR, ...message);
  };

  /**
   * Logs in the console using the default of information for developper level of detail.
   * @param message unknown[] the messages to log
   */
  log = this.logInfoDev;

  /**
   * Logging function commonly used in the useEffects to track when a component is being mounted.
   * @param message string useEffectFunction the useEffect function identifier
   * @param message unknown[] the messages to log
   */
  logUseEffectMount = (useEffectFunction: string, ...message: unknown[]): void => {
    // Redirect
    this.logTrace(`MOUNT - ${useEffectFunction}`, ...message);
  };

  /**
   * Logging function commonly used in the useEffects to track when a component is being unmounted.
   * @param message string useEffectFunction the useEffect function identifier
   * @param message unknown[] the messages to log
   */
  logUseEffectUnmount = (useEffectFunction: string, ...message: unknown[]): void => {
    // Redirect
    this.logTraceDetailed(`UNMOUNT - ${useEffectFunction}`, ...message);
  };

  /**
   * Logging function commonly used in the useCallback to track when a callback is being memoized.
   * @param message string useCallbackFunction the useCallback function identifier
   * @param message unknown[] the messages to log
   */
  logUseCallback = (useCallbackFunction: string, ...message: unknown[]): void => {
    // Redirect
    this.logTrace(`CALLBACK - ${useCallbackFunction}`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If valid, logs using console.log().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  logLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.log(`${'-'.repeat(level / 10)}>`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If valid, logs using console.warn().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  warnLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.warn(`${'-'.repeat(level / 10)}>`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If valid, logs using console.error().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  errorLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.error(`${'-'.repeat(level / 10)}>`, ...message);
  };
}

// Create a ConsoleLogger singleton and export it
export const logger = new ConsoleLogger(CURRENT_LEVEL);
