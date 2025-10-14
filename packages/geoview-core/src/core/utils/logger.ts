import { isArray } from 'lodash';
import { isLocalhost } from './utilities';
import { getItemAsNumber, getItemAsNumberOrNumberArraySetValue } from './localStorage';

// The log levels.
// The most detailed messages. Disabled by default. Only shows if actually running in dev environment, never shown otherwise.
export const LOG_TRACE_DETAILED = 1;
// For tracing useEffect unmounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_EFFECT_UNMOUNT = 2;
// For tracing useCallback. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_CALLBACK = 3;
// For tracing rendering. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_RENDER_DETAILED = 4;
// For tracing rendering. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_RENDER = 5;
// For tracing useMemo. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_MEMO = 6;
// For tracing useEffect mounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_USE_EFFECT = 7;
// For tracing store subscription events. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_CORE_STORE_SUBSCRIPTION = 8;
// For tracing api events. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_CORE_API_EVENT = 9;
// For tracing core functions. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_CORE = 10;
// For tracing worker functions. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage.
export const LOG_TRACE_WORKER = 15;
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
const LOG_ACTIVE = isLocalhost() || !!getItemAsNumber(LOCAL_STORAGE_KEY_ACTIVE);

// Check the logging level and set it to LOG_DEBUG if not found
const LOG_LEVEL = getItemAsNumberOrNumberArraySetValue(LOCAL_STORAGE_KEY_LEVEL, LOG_DEBUG);

/**
 * A Console Logger to help out logging information with levels of details.
 */
export class ConsoleLogger {
  // The logging level. The higher the number, the more detailed the log.
  loggingLevel: number | number[];

  // The active timing markers for the logger.
  markers: LogMarker = {};

  // The active object(s) trackers for the logger.
  trackers: LogTracker = {};

  // The interval in ms for the object trackers
  trackerInterval = 100;

  // The number of logs - only for some log types
  logCount = {
    renderer: 0,
    useCallback: 0,
    useMemo: 0,
    useEffect: 0,
  };

  /**
   * Constructor
   * @param {number | number[]} logLevel - Indicate the level of detail for the ConsoleLogger. The higher the number, the more detailed the log.
   */
  constructor(logLevel: number | number[]) {
    // Set the level for the logger so that it logs what we really want to see.
    this.loggingLevel = logLevel;
  }

  /**
   * Logs tracing calls at the highest level of detail.
   * Only shows if LOG_ACTIVE is true.
   * @param {unknown[]} messages - The messages to log
   */
  logTraceDetailed(...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_DETAILED, 'DETAL', 'turquoise', ...messages); // Not a typo, 5 characters for alignment
  }

  /**
   * Logging function commonly used in the useEffects to log when a component is being unmounted.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} useEffectFunction - The useEffect function identifier
   * @param {unknown[]} messages - The messages to log
   */
  logTraceUseEffectUnmount(useEffectFunction: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_USE_EFFECT_UNMOUNT, 'U_UMT', 'grey', useEffectFunction, ...messages);
  }

  /**
   * Logging function commonly used in the rendering to log when a component is being rendered.
   * This function is for the small components that get rendered a lot and that we don't typically want in the render trace.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} component - The component being rendered
   * @param {unknown[]} messages - The messages to log
   */
  logTraceRenderDetailed(component: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_RENDER_DETAILED, `RENDR - ${this.logCount.renderer++}`, 'plum', component, ...messages); // Not a typo, 5 characters for alignment
  }

  /**
   * Logging function commonly used in the rendering to log when a component is being rendered.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} component - The component being rendered
   * @param {unknown[]} messages - The messages to log
   */
  logTraceRender(component: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_RENDER, `RENDR - ${this.logCount.renderer++}`, 'plum', component, ...messages); // Not a typo, 5 characters for alignment
  }

  /**
   * Logging function commonly used in the useMemo to log when a value is being memoized.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} useMemoFunction - The useCallback function identifier
   * @param {unknown[]} messages - The messages to log
   */
  logTraceUseMemo(useMemoFunction: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_USE_MEMO, `U_MEM - ${this.logCount.useMemo++}`, 'orchid', useMemoFunction, ...messages);
  }

  /**
   * Logging function commonly used in the useCallback to log when a callback is being memoized.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} useCallbackFunction - The useCallback function identifier
   * @param {unknown[]} messages - The messages to log
   */
  logTraceUseCallback(useCallbackFunction: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_USE_CALLBACK, `U_CLB - ${this.logCount.useCallback++}`, 'darkorchid', useCallbackFunction, ...messages);
  }

  /**
   * Logging function commonly used in the useEffects to log when a component is being mounted.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} useEffectFunction - The useEffect function identifier
   * @param {unknown[]} messages - The messages to log
   */
  logTraceUseEffect(useEffectFunction: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_USE_EFFECT, `U_EFF - ${this.logCount.useEffect++}`, 'mediumorchid', useEffectFunction, ...messages);
  }

  /**
   * Logging function commonly used in the store subscriptions to log when a store has triggered a subscription.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} storeSubscription - The store subscription event that was raised
   * @param {unknown[]} messages - The messages to log
   */
  logTraceCoreStoreSubscription(storeSubscription: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_CORE_STORE_SUBSCRIPTION, 'E_STO', 'royalblue', storeSubscription, ...messages);
  }

  /**
   * Logging function commonly used in the API event handlers to log when the API has triggered an event.
   * Only shows if LOG_ACTIVE is true.
   * @param {string} apiEvent - The api event that was raised
   * @param {unknown[]} messages - The messages to log
   */
  logTraceCoreAPIEvent(apiEvent: string, ...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_CORE_API_EVENT, 'E_API', 'cornflowerblue', apiEvent, ...messages);
  }

  /**
   * Logs trace information for core processing.
   * Only shows if LOG_ACTIVE is true.
   * @param {unknown[]} messages - The messages to log
   */
  logTraceCore(...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_CORE, 'TRACE', 'dodgerblue', ...messages);
  }

  /**
   * Logs tracing calls workers.
   * Only shows if LOG_ACTIVE is true.
   * @param {unknown[]} messages - The messages to log
   */
  logTraceWorker(...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_TRACE_WORKER, 'WORKR', 'pink', ...messages); // Not a typo, 5 characters for alignment
  }

  /**
   * Logs debug information.
   * Only shows if LOG_ACTIVE is true.
   * @param {unknown[]} messages - The messages to log
   */
  logDebug(...messages: unknown[]): void {
    // Validate log active
    if (!LOG_ACTIVE) return;
    // Redirect
    this.#logLevel(LOG_DEBUG, 'DEBUG', 'darkorange', ...messages);
  }

  /**
   * Starts a time marker using the given marker key. Used to log various specific execution timings.
   * @param {string} markerKey - The unique key for this time marker
   */
  logMarkerStart(markerKey: string): void {
    // Store the current date in the markers using the marker key
    this.markers[markerKey] = new Date();
  }

  /**
   * Logs the time difference between 'now' and the original marker start.
   * Only shows if LOG_ACTIVE is true.
   * Priority level is the same as LOG_DEBUG.
   * @param {string} markerKey - The unique key for this execution timing marker
   * @param {unknown[]} messages - The timing marker messages to log
   */
  logMarkerCheck(markerKey: string, ...messages: unknown[]): void {
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
    this.#logLevel(LOG_DEBUG, 'MARKR', 'yellowgreen', logMsg, ...messages, `(${markerKey})`); // Not a typo, 5 characters for alignment
  }

  /**
   * Starts logging object(s) at every `trackerInterval`ms. Used to track object(s) modification timings.
   * Only shows if LOG_ACTIVE is true.
   * Priority level is the same as LOG_DEBUG.
   * @param {string} trackerKey - The unique key for this object(s) tracker
   * @param {() => T} callbackObject - The callback executed to retrieve the object
   * @param {(prevObject: T, newObject: T) => boolean} callbackCheck? - Optionally specify how the equality comparison should happen to decide if we want to log
   * @param {number} interval? - Optionally specify an interval to call the callback for
   */
  logTrackerStart<T>(
    trackerKey: string,
    callbackObject: () => T,
    callbackCheck?: (prevObject: T, newObject: T) => boolean,
    interval?: number
  ): void {
    // Validate log active and existing tracker clearing
    if (!LOG_ACTIVE) return;
    if (this.trackers[trackerKey]) this.logTrackerStop(trackerKey);

    // Calback right away to get the object on start
    let object = callbackObject();

    // Log right away for the first tracker to happen immediately
    this.#logLevel(LOG_DEBUG, 'TRAKR', 'goldenrod', object, `(${trackerKey})`); // Not a typo, 5 characters for alignment

    // Start the interval to check every few ms
    this.trackers[trackerKey] = setInterval(() => {
      // Calback to retrieve the object again
      const newObject = callbackObject();

      // Check if changed
      let hasChanged = false;
      if (callbackCheck)
        hasChanged = callbackCheck(object, newObject); // Use callback to know
      else hasChanged = newObject !== object; // Use straight equality comparator

      // If has changed
      if (hasChanged) {
        // Redirect
        this.#logLevel(LOG_DEBUG, 'TRAKR', 'goldenrod', newObject, `(${trackerKey})`); // Not a typo, 5 characters for alignment
      }

      // Update reference
      object = newObject;
    }, interval || this.trackerInterval);
  }

  /**
   * Stops the object(s) tracker for the given tracker key
   * @param {string} trackerKey - The unique key for this object(s) tracker
   */
  logTrackerStop(trackerKey: string): void {
    if (this.trackers[trackerKey]) {
      clearInterval(this.trackers[trackerKey]);
    }
  }

  /**
   * Logs that a promise has been unresolved and crashed somewhere in the application
   * @param {string} stackIndication - The call stack indications where the promise has crashed
   * @param {unknown[]} messages - The messages to log
   */
  logPromiseFailed(stackIndication: string, ...messages: unknown[]): void {
    // Redirect
    this.logError('Unresolved promise failed', stackIndication, ...messages);
  }

  /**
   * Logs general flow of the application.
   * Shows all the time.
   * @param {unknown[]} messages - The messages to log
   */
  logInfo(...messages: unknown[]): void {
    // Redirect
    this.#logLevel(LOG_INFO, 'INFO ', 'green', ...messages); // Not a typo, 5 characters for alignment
  }

  /**
   * Logs warnings coming from the application.
   * Shows all the time.
   * @param {unknown[]} messages - The messages to log
   */
  logWarning(...messages: unknown[]): void {
    // Redirect
    this.#warnLevel(LOG_WARNING, ...messages);
  }

  /**
   * Logs errors coming from the application.
   * Shows all the time.
   * @param {unknown[]} messages - The messages to log
   */
  logError(...messages: unknown[]): void {
    // Redirect
    this.#errorLevel(LOG_ERROR, ...messages);
  }

  /**
   * Compares the provided level (number) with the logging level (number | number[]) to know if the log should appear or not.
   * @param {number} level - The level associated with the message to be logged.
   * @returns {boolean} True if the log level indicates that it should appear
   * @private
   */
  #checkLevel(level: number): boolean {
    // If regular number
    if (!isArray(this.loggingLevel)) return this.loggingLevel <= level;
    // Is an array. We want the log to show DEBUG and higher and whatever levels (<20) are included in the array
    return level >= LOG_DEBUG || this.loggingLevel.includes(level);
  }

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.log().
   * @param {number} level - The level associated with the message to be logged.
   * @param {unknown[]} messages - The messages to log
   * @private
   */
  #logLevel(level: number, header: string, color: keyof ColorCode, ...messages: unknown[]): void {
    // If the configured logging level accepts to log the given level
    // eslint-disable-next-line no-console
    if (this.#checkLevel(level)) console.log(`%c${ConsoleLogger.#formatTime(new Date())} ${header}`, `color: ${color}`, ...messages);
  }

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.warn().
   * @param {number} level - The level associated with the message to be logged.
   * @param {unknown[]} messages - The messages to log
   * @private
   */
  #warnLevel(level: number, ...messages: unknown[]): void {
    // If the configured logging level accepts to log the given level
    // eslint-disable-next-line no-console
    if (this.#checkLevel(level)) console.warn(`${ConsoleLogger.#formatTime(new Date())}`, ...messages);
  }

  /**
   * Checks that the level is greater or equal to the application logging level.
   * If level is valid, logs using console.error().
   * @param {number} level - The level associated with the message to be logged.
   * @param {unknown[]} messages - The messages to log
   * @private
   */
  #errorLevel(level: number, ...messages: unknown[]): void {
    // If the configured logging level accepts to log the given level
    // eslint-disable-next-line no-console
    if (this.#checkLevel(level)) console.error(`${ConsoleLogger.#formatTime(new Date())}`, ...messages);
  }

  /**
   * Helper function to format a time for logging.
   * @param {Date} date - The date to format
   * @returns {string} The formatted date
   * @private
   */
  static #formatTime(date: Date): string {
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
  }
}

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
  goldenrod: string;
  green: string;
  pink: string;
};

/**
 * A Log marker with various keys, used to log various specific execution timings
 */
type LogMarker = {
  [key: string]: Date;
};

/**
 * A Log tracker with various keys, used to log and track object modifications accross execution timings
 */
type LogTracker = {
  [key: string]: ReturnType<typeof setTimeout>;
};

// Create a ConsoleLogger singleton and export it
export const logger = new ConsoleLogger(LOG_LEVEL);
logger.logInfo('Logger initialized');

// Uncomment to test the logger main functions to see how they look in console
// logger.logTraceDetailed('trace detailed');
// logger.logTraceUseEffectUnmount('trace use effect unmount');
// logger.logTraceRender('trace render');
// logger.logTraceUseCallback('trace use callback');
// logger.logTraceUseMemo('trace use memo');
// logger.logTraceUseEffect('trace use effect');
// logger.logTraceCoreStoreSubscription('trace store subscription');
// logger.logTraceCoreAPIEvent('trace api event');
// logger.logTraceCore('trace core');
// logger.logTraceWorker('trace worker');
// logger.logDebug('debug');
// logger.logMarkerStart('test time marker');
// logger.logMarkerCheck('test time marker');
// logger.logTrackerStart('test object tracker', () => undefined);
// logger.logTrackerStop('test object tracker');
// logger.logInfo('info');
// logger.logWarning('warning');
// logger.logError('error');
