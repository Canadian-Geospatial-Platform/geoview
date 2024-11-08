export declare const LOG_TRACE_DETAILED = 1;
export declare const LOG_TRACE_USE_EFFECT_UNMOUNT = 2;
export declare const LOG_TRACE_RENDER = 3;
export declare const LOG_TRACE_USE_CALLBACK = 4;
export declare const LOG_TRACE_USE_MEMO = 5;
export declare const LOG_TRACE_USE_EFFECT = 6;
export declare const LOG_TRACE_CORE_STORE_SUBSCRIPTION = 8;
export declare const LOG_TRACE_CORE_API_EVENT = 9;
export declare const LOG_TRACE_CORE = 10;
export declare const LOG_DEBUG = 20;
export declare const LOG_INFO = 30;
export declare const LOG_WARNING = 40;
export declare const LOG_ERROR = 50;
/**
 * A Console Logger to help out logging information with levels of details.
 */
export declare class ConsoleLogger {
    #private;
    loggingLevel: number | number[];
    markers: LogMarker;
    trackers: LogTracker;
    trackerInterval: number;
    /**
     * Constructor
     * @param {number | number[]} logLevel - Indicate the level of detail for the ConsoleLogger. The higher the number, the more detailed the log.
     */
    constructor(logLevel: number | number[]);
    /**
     * Logs tracing calls at the highest level of detail.
     * Only shows if LOG_ACTIVE is true.
     * @param {unknown[]} messages - The messages to log
     */
    logTraceDetailed(...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useEffects to log when a component is being unmounted.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} useEffectFunction - The useEffect function identifier
     * @param {unknown[]} messages - The messages to log
     */
    logTraceUseEffectUnmount(useEffectFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the rendering to log when a component is being rendered.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} component - The component being rendered
     * @param {unknown[]} messages - The messages to log
     */
    logTraceRender(component: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useMemo to log when a value is being memoized.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} useMemoFunction - The useCallback function identifier
     * @param {unknown[]} messages - The messages to log
     */
    logTraceUseMemo(useMemoFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useCallback to log when a callback is being memoized.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} useCallbackFunction - The useCallback function identifier
     * @param {unknown[]} messages - The messages to log
     */
    logTraceUseCallback(useCallbackFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useEffects to log when a component is being mounted.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} useEffectFunction - The useEffect function identifier
     * @param {unknown[]} messages - The messages to log
     */
    logTraceUseEffect(useEffectFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the store subscriptions to log when a store has triggered a subscription.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} storeSubscription - The store subscription event that was raised
     * @param {unknown[]} messages - The messages to log
     */
    logTraceCoreStoreSubscription(storeSubscription: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the API event handlers to log when the API has triggered an event.
     * Only shows if LOG_ACTIVE is true.
     * @param {string} apiEvent - The api event that was raised
     * @param {unknown[]} messages - The messages to log
     */
    logTraceCoreAPIEvent(apiEvent: string, ...messages: unknown[]): void;
    /**
     * Logs trace information for core processing.
     * Only shows if LOG_ACTIVE is true.
     * @param {unknown[]} messages - The messages to log
     */
    logTraceCore(...messages: unknown[]): void;
    /**
     * Logs debug information.
     * Only shows if LOG_ACTIVE is true.
     * @param {unknown[]} messages - The messages to log
     */
    logDebug(...messages: unknown[]): void;
    /**
     * Starts a time marker using the given marker key. Used to log various specific execution timings.
     * @param {string} markerKey - The unique key for this time marker
     */
    logMarkerStart(markerKey: string): void;
    /**
     * Logs the time difference between 'now' and the original marker start.
     * Only shows if LOG_ACTIVE is true.
     * Priority level is the same as LOG_DEBUG.
     * @param {string} markerKey - The unique key for this execution timing marker
     * @param {unknown[]} messages - The timing marker messages to log
     */
    logMarkerCheck(markerKey: string, ...messages: unknown[]): void;
    /**
     * Starts logging object(s) at every `trackerInterval`ms. Used to track object(s) modification timings.
     * Only shows if LOG_ACTIVE is true.
     * Priority level is the same as LOG_DEBUG.
     * @param {string} trackerKey - The unique key for this object(s) tracker
     * @param {() => T} callbackObject - The callback executed to retrieve the object
     * @param {(prevObject: T, newObject: T) => boolean} callbackCheck? - Optionally specify how the equality comparison should happen to decide if we want to log
     * @param {number} interval? - Optionally specify an interval to call the callback for
     */
    logTrackerStart<T>(trackerKey: string, callbackObject: () => T, callbackCheck?: (prevObject: T, newObject: T) => boolean, interval?: number): void;
    /**
     * Stops the object(s) tracker for the given tracker key
     * @param {string} trackerKey - The unique key for this object(s) tracker
     */
    logTrackerStop(trackerKey: string): void;
    /**
     * Logs that a promise has been unresolved and crashed somewhere in the application
     * @param {string} stackIndication - The call stack indications where the promise has crashed
     * @param {unknown[]} messages - The messages to log
     */
    logPromiseFailed(stackIndication: string, ...messages: unknown[]): void;
    /**
     * Logs general flow of the application.
     * Shows all the time.
     * @param {unknown[]} messages - The messages to log
     */
    logInfo(...messages: unknown[]): void;
    /**
     * Logs warnings coming from the application.
     * Shows all the time.
     * @param {unknown[]} messages - The messages to log
     */
    logWarning(...messages: unknown[]): void;
    /**
     * Logs errors coming from the application.
     * Shows all the time.
     * @param {unknown[]} messages - The messages to log
     */
    logError(...messages: unknown[]): void;
}
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
    [key: string]: NodeJS.Timeout;
};
export declare const logger: ConsoleLogger;
export {};
