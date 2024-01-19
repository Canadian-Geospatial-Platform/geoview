/* eslint-disable no-console */
import { getItemAsNumber, getItemAsNumberSetValue } from './localStorage';

// The log levels.
// The most detailed messages. Disabled by default. Only shows if actually running in dev environment, never shown otherwise.
export const LOG_TRACE_DETAILED = 1;
// For tracing useEffect unmounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_EFFECT_UNMOUNT = 2;
// For tracing rendering. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_RENDER = 3;
// For tracing useCallback. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_CALLBACK = 4;
// For tracing useEffect mounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_EFFECT = 5;
// For tracing core functions. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_CORE = 10;
// Default. For debugging and development. Enabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_DEBUG = 20;
// Tracks the general flow of the app. Enabled by default. Shows all the time.
export const LOG_INFO = 30;
// For abnormal or unexpected events. Typically includes errors or conditions that don't cause the app to fail. Enabled by default. Shows all the time.
export const LOG_WARNING = 40;
// For errors and exceptions that cannot be handled. Enabled by default. Shows all the time.
export const LOG_ERROR = 50;

// The local storage keys
const LOCAL_STORAGE_KEY_ACTIVE = 'GEOVIEW_LOG_ACTIVE';
const LOCAL_STORAGE_KEY_LEVEL = 'GEOVIEW_LOG_LEVEL';

// Check if running in dev or if the key is set in the local storage
const LOG_ACTIVE = process.env.NODE_ENV === 'development' || !!getItemAsNumber(LOCAL_STORAGE_KEY_ACTIVE);

// Check the logging level and set it to LOG_DEBUG if not found
const LOG_LEVEL = getItemAsNumberSetValue(LOCAL_STORAGE_KEY_LEVEL, LOG_DEBUG);

/**
 * Helper function to format a time for logging.
 * @param date {Date} The date to format
 * @returns The formatted date
 */
const formatTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const formattedDate = formatter.format(date);

  // Extract milliseconds separately and pad with zeros if needed
  const milliseconds = date.getMilliseconds();
  const formattedMilliseconds = milliseconds.toString().padStart(3, '0');

  return `${formattedDate}.${formattedMilliseconds}`;
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
  constructor(logLevel: number) {
    // Set the level for the logger so that it logs what we really want to see.
    this.loggingLevel = logLevel;
  }

  /**
   * Logs tracing calls at the highest level of detail.
   * Only shows if LOG_ACTIVE is true.
   * @param message unknown[] the messages to log
   */
  logTraceDetailed = (...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_DETAILED, ...message);
  };

  /**
   * Logging function commonly used in the useEffects to track when a component is being unmounted.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useEffectFunction the useEffect function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseEffectUnmount = (useEffectFunction: string, ...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_EFFECT_UNMOUNT, `UNMOUNT - ${useEffectFunction}`, ...message);
  };

  /**
   * Logging function commonly used in the rendering to track when a component is being rendered.
   * Only shows if LOG_ACTIVE is true.
   * @param message string component the component being rendered
   * @param message unknown[] the messages to log
   */
  logTraceRender = (component: string, ...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_RENDER, `RENDER - ${component}`, ...message);
  };

  /**
   * Logging function commonly used in the useCallback to track when a callback is being memoized.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useCallbackFunction the useCallback function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseCallback = (useCallbackFunction: string, ...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_CALLBACK, `CALLBACK - ${useCallbackFunction}`, ...message);
  };

  /**
   * Logging function commonly used in the useEffects to track when a component is being mounted.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useEffectFunction the useEffect function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseEffectMount = (useEffectFunction: string, ...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_EFFECT, `MOUNT - ${useEffectFunction}`, ...message);
  };

  /**
   * Logs trace information for core processing.
   * Only shows if LOG_ACTIVE is true.
   * @param message unknown[] the messages to log
   */
  logTraceCore = (...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_CORE, formatTime(new Date()), ...message);
  };

  /**
   * Logs debug information.
   * Only shows if LOG_ACTIVE is true.
   * @param message unknown[] the messages to log
   */
  logDebug = (...message: unknown[]): void => {
    // Validate key active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_DEBUG, ...message);
  };

  /**
   * Logs general flow of the application.
   * Shows all the time.
   * @param message unknown[] the messages to log
   */
  logInfo = (...message: unknown[]): void => {
    // Redirect
    this.logLevel(LOG_INFO, ...message);
  };

  /**
   * Logs warnings coming from the application.
   * Shows all the time.
   * @param message unknown[] the messages to log
   */
  logWarning = (...message: unknown[]): void => {
    // Redirect
    this.warnLevel(LOG_WARNING, ...message);
  };

  /**
   * Logs errors coming from the application.
   * Shows all the time.
   * @param message unknown[] the messages to log
   */
  logError = (...message: unknown[]): void => {
    // Redirect
    this.errorLevel(LOG_ERROR, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.log().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  logLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.log(`${'-'.repeat(level / 10)}>`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.warn().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  warnLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.warn(`${'-'.repeat(level / 10)}>`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.error().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  errorLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.error(`${'-'.repeat(level / 10)}>`, ...message);
  };
}

// Create a ConsoleLogger singleton and export it
export const logger = new ConsoleLogger(LOG_LEVEL);
