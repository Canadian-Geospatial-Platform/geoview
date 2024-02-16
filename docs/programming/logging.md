# Using Logging #

There are 2 ways to log to help debugging.
- `logger` class essentially embeds console.log by offering a cleaner and organized way to structure logging information.
- `useWhatChanged` can be used to momentarily debug why a particular `useEffect` or `useCallback` has been triggered by listing the dependencies and indicating which one has changed from one render to another.

## Characteristics to know when using `logger` ##

The logger class can be found here:  [https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/core/utils/logger.ts](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/core/utils/logger.ts)

The `logger` provides functions for high-level logging abstraction following best-practices concepts and the following constants:
```ts
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
```
![image](https://github.com/Canadian-Geospatial-Platform/geoview/assets/3472990/0e9b93a7-c660-4768-ac8d-aa0b37f04d0b)

The `logger` is active when (1) running in dev environment or (2) the local storage `GEOVIEW_LOG_ACTIVE` key is set.

The `logger` singleton is created using the logging level specified by the local storage `GEOVIEW_LOG_LEVEL` value. When `GEOVIEW_LOG_LEVEL` is a number, all levels above the specified number are logged. When `GEOVIEW_LOG_LEVEL` is a comma separate value e.g.: "4, 6,10" then only those levels and all levels >= 20 are logged. __To change your logging level, edit that local storage key__. When no value can be found, the local storage is set to LOG_DEBUG level.

The `LOG_TRACE` functions are used when the developer wants to view the call stack in the console. The calls to `logger.logTrace` are meant to remain in the code forever. By default they will just be ignored, because the logger logs level LOG_DEBUG and higher. There is a extra level of granularity for tracing (`LOG_TRACE_USE_EFFECT`, `LOG_TRACE_RENDER`, etc) , due to GeoView needs.

`LOG_DEBUG` is the default and essentially replaces the straightforward `console.log`, but only stays active in development. The calls to `logger.logDebug()` may remain in the code and be pushed up the source tree, however, they aren't meant to remain forever. In any case, in production, those will never show up unless the GEOVIEW_LOG_ACTIVE is set.

`LOG_INFO` and higher (`LOG_WARNING`, `LOG_ERROR`) are meant to indicate core information/warnings/errors which are to be shown all the time. Those logs should remain in the code and be pushed up the source tree.

Typically, to debug an application, the developer should use `logger.logDebug()` and when they are done, they should remove the line after some time. The line can be committed and remain in the code for a while, but they aren't meant to stay forever.

A neat feature of the `logger` is also the possibility to log using timing markers. Call `logMarkerStart` to start a timer using a key and then call `logMarkerCheck` and provide the same key to log the time span between 'now' and the 'start' time.

## Characteristics to know when using `useWhatChanged` ##

The `useWhatChanged` function can be found here: [https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/core/utils/useWhatChanged.ts](https://github.com/Canadian-Geospatial-Platform/geoview/blob/develop/packages/geoview-core/src/core/utils/useWhatChanged.ts)

The `useWhatChanged` function provides a way to monitor dependencies of `useEffect` or `useCallback` by writing a call to `useWhatChanged` above the call to `useEffect` as shown in this example:

```ts
  // Debug the below useEffect to help figure out which dependency triggered the useEffect
  useWhatChanged('{SOME_CUSTOM_ID}', [pointerPosition, t], ['pointerPosition', 't']);

  // Hook on a useEffect to do something when pointerPosition changes
  useEffect(() => {
    /// useEffect implementation
  }, [pointerPosition, t]);
```

In this example, the log will show a table indicating the `pointerPosition` and `t` values __before__ and __after__ each useEffect trigger. The first argument can be anything the developer wants. The second argument should be a copy of the dependency array of the useEffect to track. The third argument is optional and only serves to name the parameters in the console table.
