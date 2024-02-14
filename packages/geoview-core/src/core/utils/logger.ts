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
// For tracing useMemo. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_MEMO = 5;
// For tracing useEffect mounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_EFFECT = 6;
// For tracing store subscription events. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_CORE_STORE_SUBSCRIPTION = 8;
// For tracing api events. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_CORE_API_EVENT = 9;
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
 * The supported color codes for logging
 */
type ColorCode = {
  turquoise: string;
  grey: string;
  plum: string;
  orchid: string;
  darkorchid: string;
  mediumorchid: string;
  royalblue: string;
  cornflowerblue: string;
  dodgerblue: string;
  darkorange: string;
  yellowgreen: string;
  green: string;
};

/**
 * A Log marker with various keys, used to track various timings
 */
type LogMarker = {
  [key: string]: Date;
};

/**
 * A Console Logger to help out logging information with levels of details.
 */
export class ConsoleLogger {
  // The logging level. The higher the number, the more detailed the log.
  loggingLevel: number;

  // The active markers for the logger.
  markers: LogMarker = {};

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
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_DETAILED, 'DETAL', 'turquoise', ...message); // Not a typo, 5 characters for alignment
  };

  /**
   * Logging function commonly used in the useEffects to track when a component is being unmounted.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useEffectFunction the useEffect function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseEffectUnmount = (useEffectFunction: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_EFFECT_UNMOUNT, 'U_UMT', 'grey', useEffectFunction, ...message);
  };

  /**
   * Logging function commonly used in the rendering to track when a component is being rendered.
   * Only shows if LOG_ACTIVE is true.
   * @param message string component the component being rendered
   * @param message unknown[] the messages to log
   */
  logTraceRender = (component: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_RENDER, 'RENDR', 'plum', component, ...message); // Not a typo, 5 characters for alignment
  };

  /**
   * Logging function commonly used in the useMemo to track when a value is being memoized.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useCallbackFunction the useCallback function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseMemo = (useMemoFunction: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_MEMO, 'U_MEM', 'orchid', useMemoFunction, ...message);
  };

  /**
   * Logging function commonly used in the useCallback to track when a callback is being memoized.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useCallbackFunction the useCallback function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseCallback = (useCallbackFunction: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_CALLBACK, 'U_CLB', 'darkorchid', useCallbackFunction, ...message);
  };

  /**
   * Logging function commonly used in the useEffects to track when a component is being mounted.
   * Only shows if LOG_ACTIVE is true.
   * @param message string useEffectFunction the useEffect function identifier
   * @param message unknown[] the messages to log
   */
  logTraceUseEffect = (useEffectFunction: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_USE_EFFECT, 'U_EFF', 'mediumorchid', useEffectFunction, ...message);
  };

  /**
   * Logging function commonly used in the store subscriptions to track when a store has triggered a subscription.
   * Only shows if LOG_ACTIVE is true.
   * @param message string storeSubscription the store subscription event that was raised
   * @param message unknown[] the messages to log
   */
  logTraceCoreStoreSubscription = (storeSubscription: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_CORE_STORE_SUBSCRIPTION, 'E_STO', 'royalblue', storeSubscription, ...message);
  };

  /**
   * Logging function commonly used in the API event handlers to track when the API has triggered an event.
   * Only shows if LOG_ACTIVE is true.
   * @param message string apiEvent the api event that was raised
   * @param message unknown[] the messages to log
   */
  logTraceCoreAPIEvent = (apiEvent: string, ...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_CORE_API_EVENT, 'E_API', 'cornflowerblue', apiEvent, ...message);
  };

  /**
   * Logs trace information for core processing.
   * Only shows if LOG_ACTIVE is true.
   * @param message unknown[] the messages to log
   */
  logTraceCore = (...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_TRACE_CORE, 'TRACE', 'dodgerblue', ...message);
  };

  /**
   * Logs debug information.
   * Only shows if LOG_ACTIVE is true.
   * @param message unknown[] the messages to log
   */
  logDebug = (...message: unknown[]): void => {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.logLevel(LOG_DEBUG, 'DEBUG', 'darkorange', ...message);
  };

  /**
   * Start a time marker using the given marker key. Used to track timings.
   * @param markerKey {string} the unique key for this marker tracker
   */
  logMarkerStart = (markerKey: string): void => {
    // Store the current date in the markers using the marker key
    this.markers[markerKey] = new Date();
  };

  /**
   * Logs the time difference between 'now' and the original marker start.
   * Only shows if LOG_ACTIVE is true.
   * Priority level is the same as LOG_DEBUG.
   * @param markerKey {string} the unique key for this marker tracker
   * @param message unknown[] the messages to log
   */
  logMarkerCheck = (markerKey: string, ...message: unknown[]): void => {
    // Validate log active and existing marker
    if (!LOG_ACTIVE) return;
    if (!this.markers[markerKey]) return;

    // Calculate the time span between now and marked date
    let timeSpan = new Date().getTime() - this.markers[markerKey].getTime();

    const days = Math.floor(timeSpan / (1000 * 60 * 60 * 24));
    timeSpan -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(timeSpan / (1000 * 60 * 60));
    timeSpan -= hours * (1000 * 60 * 60);

    const mins = Math.floor(timeSpan / (1000 * 60));
    timeSpan -= mins * (1000 * 60);

    const seconds = Math.floor(timeSpan / 1000);
    timeSpan -= seconds * 1000;

    // Let's say we always want seconds and milliseconds at least
    let logMsg = `${seconds} seconds, and ${timeSpan} ms`;
    if (mins) logMsg = `${mins} minutes, ${seconds} seconds, and ${timeSpan} ms`;
    if (hours) logMsg = `${hours} hours, ${mins} minutes, ${seconds} seconds, and ${timeSpan} ms`;

    // Redirect
    this.logLevel(LOG_DEBUG, 'MARKR', 'yellowgreen', logMsg, ...message, `(${markerKey})`); // Not a typo, 5 characters for alignment
  };

  /**
   * Logs general flow of the application.
   * Shows all the time.
   * @param message unknown[] the messages to log
   */
  logInfo = (...message: unknown[]): void => {
    // Redirect
    this.logLevel(LOG_INFO, 'INFO ', 'green', ...message); // Not a typo, 5 characters for alignment
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
  logLevel = (level: number, header: string, color: keyof ColorCode, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.log(`%c${formatTime(new Date())} ${header}`, `color: ${color}`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.warn().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  warnLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.warn(`${formatTime(new Date())}`, ...message);
  };

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.error().
   * @param level number the level associated with the message to be logged.
   * @param message unknown[] the messages to log
   */
  errorLevel = (level: number, ...message: unknown[]): void => {
    // If the configured logging level accepts to log the given level
    if (this.loggingLevel <= level) console.error(`${formatTime(new Date())}`, ...message);
  };
}

// Create a ConsoleLogger singleton and export it
export const logger = new ConsoleLogger(LOG_LEVEL);
logger.logInfo('Logger initialized');

// Uncomment to test the logger main functions to see how they look in console
// logger.logTraceDetailed('trace detailed');
// logger.logTraceUseEffectUnmount('trace use effect unmount');
// logger.logTraceRender('trace render');
// logger.logTraceUseCallback('trace use callback');
// logger.logTraceUseEffect('trace use effect');
// logger.logTraceCore('trace core');
// logger.logDebug('debug');
// logger.logMarkerStart('test');
// logger.logMarkerCheck('test');
// logger.logInfo('info');
// logger.logWarning('warning');
// logger.logError('error');
