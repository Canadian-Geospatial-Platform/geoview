/** The most detailed messages. Disabled by default. Only shows if actually running in dev environment, never shown otherwise. */
export declare const LOG_TRACE_DETAILED = 1;
/** For tracing useEffect unmounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_USE_EFFECT_UNMOUNT = 2;
/** For tracing rendering (detailed). Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_RENDER_DETAILED = 4;
/** For tracing rendering. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_RENDER = 5;
/** For tracing useMemo. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_USE_MEMO = 6;
/** For tracing useEffect mounting. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_USE_EFFECT = 7;
/** For tracing store subscription events. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_CORE_STORE_SUBSCRIPTION = 8;
/** For tracing api events. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_CORE_API_EVENT = 9;
/** For tracing core functions. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_CORE = 10;
/** For tracing worker functions. Disabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_TRACE_WORKER = 15;
/** Default. For debugging and development. Enabled by default. Only shows if running in dev environment or GEOVIEW_LOG_ACTIVE key is set in local storage. */
export declare const LOG_DEBUG = 20;
/** Tracks the general flow of the app. Enabled by default. Shows all the time. */
export declare const LOG_INFO = 30;
/** For abnormal or unexpected events. Typically includes errors or conditions that don't cause the app to fail. Enabled by default. Shows all the time. */
export declare const LOG_WARNING = 40;
/** For errors and exceptions that cannot be handled. Enabled by default. Shows all the time. */
export declare const LOG_ERROR = 50;
/** A Console Logger to help out logging information with levels of details. */
export declare class ConsoleLogger {
    #private;
    /** The logging level. The higher the number, the more detailed the log. */
    loggingLevel: number | number[];
    /** The active timing markers for the logger. */
    markers: LogMarker;
    /** The active object(s) trackers for the logger. */
    trackers: LogTracker;
    /** The interval in ms for the object trackers. */
    trackerInterval: number;
    /** The number of logs - only for some log types. */
    logCount: {
        renderer: number;
        useMemo: number;
        useEffect: number;
    };
    /** The number of render logs - per component. */
    logCountRenderPerComponent: {
        [component: string]: number;
    };
    /**
     * Constructor.
     *
     * @param logLevel - Indicate the level of detail for the ConsoleLogger. The higher the number, the more detailed the log
     */
    constructor(logLevel: number | number[]);
    /**
     * Logs tracing calls at the highest level of detail.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param messages - The messages to log
     */
    logTraceDetailed(...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useEffects to log when a component is being unmounted.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param useEffectFunction - The useEffect function identifier
     * @param messages - The messages to log
     */
    logTraceUseEffectUnmount(useEffectFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the rendering to log when a component is being rendered.
     *
     * This function is for the small components that get rendered a lot and that we don't typically want in the render trace.
     * Only shows if LOG_ACTIVE is true.
     *
     * @param component - The component being rendered
     * @param messages - The messages to log
     */
    logTraceRenderDetailed(component: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the rendering to log when a component is being rendered.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param component - The component being rendered
     * @param messages - The messages to log
     */
    logTraceRender(component: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useMemo to log when a value is being memoized.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param useMemoFunction - The useMemo function identifier
     * @param messages - The messages to log
     */
    logTraceUseMemo(useMemoFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useCallback to log when a callback is being memoized.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param useCallbackFunction - The useCallback function identifier
     * @param messages - The messages to log
     * @deprecated This function is deprecated.
     */
    logTraceUseCallback(useCallbackFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the useEffects to log when a component is being mounted.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param useEffectFunction - The useEffect function identifier
     * @param messages - The messages to log
     */
    logTraceUseEffect(useEffectFunction: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the store subscriptions to log when a store has triggered a subscription.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param storeSubscription - The store subscription event that was raised
     * @param messages - The messages to log
     */
    logTraceCoreStoreSubscription(storeSubscription: string, ...messages: unknown[]): void;
    /**
     * Logging function commonly used in the API event handlers to log when the API has triggered an event.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param apiEvent - The api event that was raised
     * @param messages - The messages to log
     */
    logTraceCoreAPIEvent(apiEvent: string, ...messages: unknown[]): void;
    /**
     * Logs trace information for core processing.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param messages - The messages to log
     */
    logTraceCore(...messages: unknown[]): void;
    /**
     * Logs tracing calls workers.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param messages - The messages to log
     */
    logTraceWorker(...messages: unknown[]): void;
    /**
     * Logs debug information.
     *
     * Only shows if LOG_ACTIVE is true.
     *
     * @param messages - The messages to log
     */
    logDebug(...messages: unknown[]): void;
    /**
     * Starts a time marker using the given marker key. Used to log various specific execution timings.
     *
     * @param markerKey - The unique key for this time marker
     */
    logMarkerStart(markerKey: string): void;
    /**
     * Logs the time difference between 'now' and the original marker start.
     *
     * Only shows if LOG_ACTIVE is true.
     * Priority level is the same as LOG_DEBUG.
     *
     * @param markerKey - The unique key for this execution timing marker
     * @param messages - The timing marker messages to log
     */
    logMarkerCheck(markerKey: string, ...messages: unknown[]): void;
    /**
     * Starts logging object(s) at every `trackerInterval`ms. Used to track object(s) modification timings.
     *
     * Only shows if LOG_ACTIVE is true.
     * Priority level is the same as LOG_DEBUG.
     *
     * @param trackerKey - The unique key for this object(s) tracker
     * @param callbackObject - The callback executed to retrieve the object
     * @param callbackCheck - Optional callback specifying how the equality comparison should happen to decide if we want to log
     * @param interval - Optional interval to call the callback for
     */
    logTrackerStart<T>(trackerKey: string, callbackObject: () => T, callbackCheck?: (prevObject: T, newObject: T) => boolean, interval?: number): void;
    /**
     * Stops the object(s) tracker for the given tracker key.
     *
     * @param trackerKey - The unique key for this object(s) tracker
     */
    logTrackerStop(trackerKey: string): void;
    /**
     * Logs that a promise has been unresolved and crashed somewhere in the application.
     *
     * @param stackIndication - The call stack indications where the promise has crashed
     * @param messages - The messages to log
     */
    logPromiseFailed(stackIndication: string, ...messages: unknown[]): void;
    /**
     * Logs general flow of the application.
     *
     * Shows all the time.
     *
     * @param messages - The messages to log
     */
    logInfo(...messages: unknown[]): void;
    /**
     * Logs warnings coming from the application.
     *
     * Shows all the time.
     *
     * @param messages - The messages to log
     */
    logWarning(...messages: unknown[]): void;
    /**
     * Logs errors coming from the application.
     *
     * Shows all the time.
     *
     * @param messages - The messages to log
     */
    logError(...messages: unknown[]): void;
}
/** A Log marker with various keys, used to log various specific execution timings. */
type LogMarker = {
    [key: string]: Date;
};
/** A Log tracker with various keys, used to log and track object modifications across execution timings. */
type LogTracker = {
    [key: string]: ReturnType<typeof setTimeout>;
};
/** The ConsoleLogger singleton instance. */
export declare const logger: ConsoleLogger;
export {};
//# sourceMappingURL=logger.d.ts.map