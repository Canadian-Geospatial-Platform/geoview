export declare const LOG_TRACE_DETAILED = 1;
export declare const LOG_TRACE_USE_EFFECT_UNMOUNT = 2;
export declare const LOG_TRACE_RENDER = 3;
export declare const LOG_TRACE_USE_CALLBACK = 4;
export declare const LOG_TRACE_USE_EFFECT = 5;
export declare const LOG_TRACE_CORE = 10;
export declare const LOG_DEBUG = 20;
export declare const LOG_INFO = 30;
export declare const LOG_WARNING = 40;
export declare const LOG_ERROR = 50;
/**
 * The supported color codes for logging
 */
type ColorCode = {
    darkorange: string;
    dodgerblue: string;
    yellowgreen: string;
    green: string;
    plum: string;
    turquoise: string;
    grey: string;
    darkorchid: string;
    mediumorchid: string;
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
export declare class ConsoleLogger {
    loggingLevel: number;
    markers: LogMarker;
    /**
     * Constructor
     * @param logLevel? number Indicate the level of detail for the ConsoleLogger. The higher the number, the more detailed the log.
     */
    constructor(logLevel: number);
    /**
     * Logs tracing calls at the highest level of detail.
     * Only shows if LOG_ACTIVE is true.
     * @param message unknown[] the messages to log
     */
    logTraceDetailed: (...message: unknown[]) => void;
    /**
     * Logging function commonly used in the useEffects to track when a component is being unmounted.
     * Only shows if LOG_ACTIVE is true.
     * @param message string useEffectFunction the useEffect function identifier
     * @param message unknown[] the messages to log
     */
    logTraceUseEffectUnmount: (useEffectFunction: string, ...message: unknown[]) => void;
    /**
     * Logging function commonly used in the rendering to track when a component is being rendered.
     * Only shows if LOG_ACTIVE is true.
     * @param message string component the component being rendered
     * @param message unknown[] the messages to log
     */
    logTraceRender: (component: string, ...message: unknown[]) => void;
    /**
     * Logging function commonly used in the useCallback to track when a callback is being memoized.
     * Only shows if LOG_ACTIVE is true.
     * @param message string useCallbackFunction the useCallback function identifier
     * @param message unknown[] the messages to log
     */
    logTraceUseCallback: (useCallbackFunction: string, ...message: unknown[]) => void;
    /**
     * Logging function commonly used in the useEffects to track when a component is being mounted.
     * Only shows if LOG_ACTIVE is true.
     * @param message string useEffectFunction the useEffect function identifier
     * @param message unknown[] the messages to log
     */
    logTraceUseEffect: (useEffectFunction: string, ...message: unknown[]) => void;
    /**
     * Logs trace information for core processing.
     * Only shows if LOG_ACTIVE is true.
     * @param message unknown[] the messages to log
     */
    logTraceCore: (...message: unknown[]) => void;
    /**
     * Logs debug information.
     * Only shows if LOG_ACTIVE is true.
     * @param message unknown[] the messages to log
     */
    logDebug: (...message: unknown[]) => void;
    /**
     * Start a time marker using the given marker key. Used to track timings.
     * @param markerKey {string} the unique key for this marker tracker
     */
    logMarkerStart: (markerKey: string) => void;
    /**
     * Logs the time difference between 'now' and the original marker start.
     * Only shows if LOG_ACTIVE is true.
     * Priority level is the same as LOG_DEBUG.
     * @param markerKey {string} the unique key for this marker tracker
     * @param message unknown[] the messages to log
     */
    logMarkerCheck: (markerKey: string, ...message: unknown[]) => void;
    /**
     * Logs general flow of the application.
     * Shows all the time.
     * @param message unknown[] the messages to log
     */
    logInfo: (...message: unknown[]) => void;
    /**
     * Logs warnings coming from the application.
     * Shows all the time.
     * @param message unknown[] the messages to log
     */
    logWarning: (...message: unknown[]) => void;
    /**
     * Logs errors coming from the application.
     * Shows all the time.
     * @param message unknown[] the messages to log
     */
    logError: (...message: unknown[]) => void;
    /**
     * Checks that the level is greater or equal to the application logging level.
     * If level is valid, logs using console.log().
     * @param level number the level associated with the message to be logged.
     * @param message unknown[] the messages to log
     */
    logLevel: (level: number, header: string, color: keyof ColorCode, ...message: unknown[]) => void;
    /**
     * Checks that the level is greater or equal to the application logging level.
     * If level is valid, logs using console.warn().
     * @param level number the level associated with the message to be logged.
     * @param message unknown[] the messages to log
     */
    warnLevel: (level: number, ...message: unknown[]) => void;
    /**
     * Checks that the level is greater or equal to the application logging level.
     * If level is valid, logs using console.error().
     * @param level number the level associated with the message to be logged.
     * @param message unknown[] the messages to log
     */
    errorLevel: (level: number, ...message: unknown[]) => void;
}
export declare const logger: ConsoleLogger;
export {};
