import type { Root } from 'react-dom/client';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import type { TypeHTMLElement } from '@/core/types/global-types';
/** Result of a URL reachability ping check. */
interface PingResult {
    isValid: boolean;
    isReachable: boolean;
    needsProxy: boolean;
    status: number | null;
    error?: string;
}
/** Represents RGBA color as [Red, Green, Blue, Alpha]. */
export type RGBA = [r: number, g: number, b: number, a: number];
/**
 * Generates an array of numbers from `start` (inclusive) to `end` (exclusive),
 * incrementing by `step`.
 *
 * @param start - The first number in the range
 * @param end - The end of the range (exclusive)
 * @param step - Optional increment between numbers (default 1)
 * @returns An array of numbers from start to end with the given step
 * @example
 * range(0, 5); // [0, 1, 2, 3, 4]
 * range(50, 1000, 50); // [50, 100, 150, ..., 950]
 */
export declare function range(start: number, end: number, step?: number): number[];
/**
 * Converts a string to camelCase.
 *
 * Replaces hyphens (`-`), underscores (`_`), and spaces with capitalization
 * of the following letter, and ensures the first character is lowercase.
 *
 * @param str - The input string to convert
 * @returns The camelCased version of the input string
 * @example
 * camelCase('my_tab-name'); // 'myTabName'
 * camelCase('Hello World'); // 'helloWorld'
 */
export declare function camelCase(str: string): string;
/**
 * Deeply compares two values (objects, arrays, or primitives) for equality.
 *
 * @param a - The first value to compare
 * @param b - The second value to compare
 * @returns `true` if the values are deeply equal, `false` otherwise
 * @example
 * ```ts
 * deepEqual({ x: 1, y: [2, 3] }, { x: 1, y: [2, 3] }); // true
 * deepEqual([1, 2, 3], [1, 2, 4]); // false
 * deepEqual(5, 5); // true
 * ```
 */
export declare function deepEqual(a: any, b: any): boolean;
/**
 * Deeply clones a value, preserving functions and non-cloneable types by reference.
 *
 * @param value - The value to clone
 * @returns A deep copy of the value
 */
export declare function deepClone<T>(value: T): T;
/**
 * Deeply merges two objects, using the base object as defaults and
 * preserving existing values from the target object.
 *
 * Nested plain objects are merged recursively.
 *
 * @param base - The base object providing default values
 * @param target - The target object whose defined values take precedence
 * @returns A new object containing the merged result
 * @example
 * ```ts
 * const defaultSettings = { theme: { darkMode: false, fontSize: 14 }, locale: 'en' };
 * const userSettings = { theme: { darkMode: true } };
 * const merged = deepMerge(defaultSettings, userSettings);
 * // merged: { theme: { darkMode: true, fontSize: 14 }, locale: 'en' }
 * ```
 */
export declare function deepMerge<S extends any, T extends any>(base: S, target: T): S & T;
/**
 * Performs a shallow equality check between two objects.
 *
 * Compares the objects' own enumerable keys and values using `Object.is`.
 * Returns true if both objects have the same keys and corresponding values, false otherwise.
 * Note: This is a **shallow** comparison. Nested objects or arrays are compared by reference.
 *
 * @param a - The first object to compare
 * @param b - The second object to compare
 * @returns True if the objects are shallowly equal, false otherwise
 * @example
 * const obj1 = { foo: 1, bar: 2 };
 * const obj2 = { foo: 1, bar: 2 };
 * const obj3 = { foo: 1, bar: 3 };
 * shallowObjectEqual(obj1, obj2); // true
 * shallowObjectEqual(obj1, obj3); // false
 */
export declare function shallowObjectEqual<T>(a: T, b: T): boolean;
/**
 * Performs a shallow equality check between two arrays.
 *
 * Compares each element using `Object.is`. Returns true if both arrays
 * have the same length and all corresponding elements are strictly equal,
 * false otherwise.
 * Note: This is a **shallow** comparison. Nested objects or arrays are compared by reference.
 *
 * @template T - The type of elements in the arrays
 * @param a - The first array to compare
 * @param b - The second array to compare
 * @returns True if the arrays are shallowly equal, false otherwise
 * @example
 * const arr1 = [1, 2, 3];
 * const arr2 = [1, 2, 3];
 * const arr3 = [1, 2, 4];
 * shallowArrayEqual(arr1, arr2); // true
 * shallowArrayEqual(arr1, arr3); // false
 */
export declare function shallowArrayEqual<T>(a: T[], b: T[]): boolean;
/**
 * Take string like "My string is __param__" and replace parameters (__param__) from array of values.
 *
 * @param params - An array of parameters to replace, i.e. ['short']
 * @param message - The original message, i.e. "My string is __param__"
 * @returns Message with values replaced "My string is short"
 */
export declare function replaceParams(params: unknown[], message: string): string;
/**
 * Return proper language Geoview localized values from map i18n instance.
 *
 * @param language - The language to get the message in
 * @param messageKey - The localize key to read the message from
 * @param params - Optional array of parameters to replace, i.e. ['short']
 * @returns The translated message with values replaced
 */
export declare function getLocalizedMessage(language: TypeDisplayLanguage, messageKey: string, params?: unknown[] | undefined): string;
/**
 * Deep merge objects together. Latest object will overwrite value on previous one
 * if property exist.
 *
 * @param objects - The objects to deep merge
 * @returns The merged object
 */
export declare function deepMergeObjects<T>(...objects: unknown[]): T;
/**
 * Check if a string is a number.
 *
 * @param str - The object to test
 * @returns true if the object is numeric, false otherwise
 */
export declare function isNumeric(str: string): boolean;
/**
 * Check if an object is empty.
 *
 * @param obj - The object to test
 * @returns true if the object is empty, false otherwise
 */
export declare function isObjectEmpty(obj: object): boolean;
/**
 * Get the URL of main script cgpv-main so we can access the assets.
 *
 * @returns The URL of the main script
 */
export declare function getScriptAndAssetURL(): string;
/**
 * Generates a unique id of the specified length.
 *
 * @param length - Number of characters to return
 * @returns The id
 */
export declare function generateId(length?: 8 | 18 | 36): string;
/**
 * Validates the GeoCore UUIDs.
 *
 * @param uuid - The UUID to validate
 * @returns Returns true if the UUID respect the format
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * Validates a URL's syntax and tests whether the server is reachable.
 *
 * Strategy:
 * 1. **HEAD → 2xx/3xx** → reachable, no proxy needed.
 * 2. **HEAD → 4xx/5xx** → server is alive but the bare path fails. Try OGC GetCapabilities
 *    directly (CORS was fine since HEAD got a response). If valid → reachable. Otherwise → not reachable.
 * 3. **HEAD → CORS** → server is alive but blocks cross-origin. Try OGC GetCapabilities
 *    through the proxy. If valid → reachable + needsProxy. Otherwise → not reachable.
 * 4. **HEAD → network/timeout** → server unreachable.
 *
 * The function never throws — all failures are returned as part of the result object.
 *
 * @param targetUrl - The URL to validate and ping
 * @param proxyBase - Optional proxy server base URL (defaults to CONFIG_PROXY_URL)
 * @param timeoutMs - Optional request timeout in milliseconds (defaults to 5000ms)
 * @returns A promise that resolves with a result object containing isValid, isReachable, needsProxy, status, and optional error
 */
export declare function validateAndPingUrl(targetUrl: string, proxyBase?: string, timeoutMs?: number): Promise<PingResult>;
/**
 * Extracts the embedded color palette from a GeoTIFF file at the given URL.
 *
 * Returns an array of RGBA color tuples, or `undefined` if no palette is present.
 * Each color is normalized to 8-bit values.
 *
 * @param url - URL to the GeoTIFF file
 * @returns A promise that resolves with an array of RGBA color tuples, or undefined if no palette
 */
export declare function extractGeotiffColorMap(url: string): Promise<RGBA[] | undefined>;
/**
 * Set alpha for a color.
 *
 * @param colorArray - The array of color numbers
 * @param alpha - The new alpha
 * @returns the color with the alpha set
 */
export declare function setAlphaColor(colorArray: number[], alpha: number): number[];
/**
 * Validates if a JSON string is well formatted.
 *
 * @param str - The string to test
 * @returns true if the JSON is valid, false otherwise
 */
export declare function isJsonString(str: string): boolean;
/**
 * Converts an XML document object into a json object.
 *
 * @param xml - The XML document object
 * @returns The converted json object
 */
export declare function xmlToJson(xml: Document | Node | Element): any;
/**
 * Parses a XML string into Json.
 *
 * @param xmlContent - The XML string to parse
 * @returns A json object
 */
export declare function parseXMLToJson<T>(xmlContent: string): T;
/**
 * Execute a XMLHttpRequest.
 *
 * @param url - The url to request
 * @returns A promise that resolves with the response text, or '{}' if the request failed
 * @deprecated Use the core/utils/fetch-helper.ts/Fetch functions instead
 */
export declare function getXMLHttpRequest(url: string): Promise<string>;
/**
 * Add a UI component to a custom div. Do not listen to event from here, pass in the props.
 *
 * @param targetDivId - The div id to insert the component in
 * @param component - The UI react component
 * @returns the React root element
 */
export declare function addUiComponent(targetDivId: string, component: React.ReactElement): Root;
/**
 * Sanitizes HTML to remove threat.
 *
 * @param contentHtml - HTML content to sanitize
 * @returns Sanitized HTML or empty string if all dirty
 */
export declare function sanitizeHtmlContent(contentHtml: string): string;
/**
 * Enhances links accessibility by adding screen reader announcements for external links.
 *
 * Uses DOM parsing to safely inject visually-hidden span elements with announcement text
 * for screen readers.
 *
 * **Security Note:** This function does NOT sanitize output. Callers MUST sanitize the result
 * using `sanitizeHtmlContent()` before rendering to prevent XSS risks.
 *
 * @param html - HTML string containing links (typically from linkifyHtml)
 * @param announcementText - Translated announcement text for screen readers (e.g., "opens in new tab")
 * @returns HTML string with visually-hidden accessibility announcements injected into external links, or the original HTML if parsing fails
 *
 * @example
 * Input: '<a href="..." target="_blank">View</a>'
 * Output: '<a href="..." target="_blank">View <span class="visually-hidden"> (opens in new tab)</span></a>'
 */
export declare function enhanceLinksAccessibility(html: string, announcementText: string): string;
/**
 * Sets up a MutationObserver to monitor when a specific DOM element (e.g., a div container)
 * is removed from the document.
 *
 * When the element is removed, it triggers a cleanup callback and disconnects the observer to prevent memory leaks.
 *
 * @param key - A unique identifier for the element, used to manage observer references
 * @param element - The DOM element to monitor for removal from the DOM tree
 * @param onHTMLElementRemoved - The callback executed once the given DOM element gets removed from the DOM tree
 */
export declare function watchHtmlElementRemoval(key: string, element: HTMLElement, onHTMLElementRemoved: (key: string) => void): void;
/**
 * Attempts to place the given HTML element into fullscreen mode.
 *
 * This function handles browser compatibility by trying the standard
 * `requestFullscreen()` API first, then falling back to vendor-prefixed
 * versions for Safari, IE11, and Firefox.
 * Any errors from the standard promise-based fullscreen request are caught
 * and logged using `logger.logPromiseFailed`.
 *
 * @param element - The element to display in fullscreen mode
 */
export declare function requestFullscreen(element: TypeHTMLElement): void;
/**
 * Exits fullscreen mode if the document is currently in fullscreen.
 *
 * This function uses the standard `exitFullscreen()` API when available,
 * and falls back to vendor-prefixed exit methods for Safari, IE11, and Firefox.
 * Any errors from the standard promise-based exit request are caught
 * and logged using `logger.logPromiseFailed`.
 */
export declare function exitFullscreen(): void;
/**
 * Safely converts a JavaScript value to a JSON string, handling circular references.
 *
 * Circular objects are replaced with the string `"{Circular JSON}"` to prevent
 * `JSON.stringify` from throwing an error. The function also supports optional
 * pretty-printing via the `space` parameter.
 *
 * @param obj - The value to stringify
 * @param space - Optional number of spaces to use for indentation in the resulting JSON string (default 2)
 * @returns The JSON string representation of the input value, with circular references handled
 */
export declare function safeStringify(obj: any, space?: number): string;
/**
 * Removes comments from JSON config.
 *
 * @param config - Map config to clean
 * @returns cleaned config object
 */
export declare function removeCommentsFromJSON(config: string): string;
/**
 * Parses JSON config string into a JSON object of type T.
 *
 * @param configStr - Map config to parse
 * @returns Cleaned and parsed config object
 */
export declare function parseJSONConfig<T>(configStr: string): T;
/**
 * Export the image data url to a file.
 *
 * @param dataUrl - The data Url to be downloaded
 * @param name - The name of exported file
 * @param format - The format of the exported file
 */
export declare function exportFile(dataUrl: string, name: string, format?: 'pdf' | 'png' | 'jpeg'): void;
/**
 * Find an object property by regex values. The find is case insensitive.
 *
 * @param objectItem - The object to search in
 * @param patterns - A single RegExp or an array of RegExp patterns to match in sequence
 * @returns The value found at the end of the matching path, or undefined if not found
 */
export declare function findPropertyByRegexPath<T = Record<string, unknown>>(objectItem: unknown | undefined, patterns: RegExp | RegExp[]): T | undefined;
/**
 * Check string to see if it is an image.
 *
 * @param item - The item to validate
 * @returns true if it is an image, false otherwise
 */
export declare function isImage(item: string): boolean;
/**
 * Checks object to see if it can be converted to a string; if not, returns an empty string
 *
 * @param str - The unknown object to stringify
 * @returns The original object if it can be converted to a string; '' otherwise
 */
export declare function stringify(str: unknown): unknown | string;
/**
 * Creates a delayed job which includes a promise that resolves after a specified timeout, with the ability to cancel or reject it manually.
 *
 * @param timeout - The number of milliseconds to wait before resolving the promise
 * @returns An object representing the delayed job, containing:
 *   - `promise`: A Promise that resolves after the timeout (or immediately if canceled).
 *   - `cancel()`: Cancels the timeout and immediately resolves the promise.
 *   - `reject(reason)`: Cancels the timeout and rejects the promise with the given reason.
 *   - `timeoutId`: The ID of the underlying setTimeout, useful for advanced control.
 */
export declare function doTimeout(timeout: number): DelayJob;
/**
 * Delay helper function.
 *
 * @param timeout - The number of milliseconds to wait for
 * @returns A promise that resolves when the delay timeout expires
 */
export declare function delay(timeout: number): Promise<void>;
/**
 * Repeatedly invokes a callback at a fixed interval until one of the following
 * conditions is met:
 * 1. The callback returns a truthy value (early termination).
 * 2. The optional timeout duration is reached.
 * The callback receives the elapsed time (in milliseconds) since the interval
 * started. If `startImmediately` is `true`, the callback is invoked once
 * immediately before the interval begins.
 *
 * @param callback - Function executed on each interval tick. Receives the elapsed
 * time (ms) since the start. If the function returns a truthy value, the interval
 * is cleared immediately
 * @param intervalMs - Interval duration in milliseconds between each callback invocation
 * @param timeout - Optional maximum duration in milliseconds before the interval
 * is automatically cleared. If omitted, the interval runs until the callback stops it
 * @param startImmediately - If `true`, the callback is invoked once immediately
 * before the interval is scheduled (defaults to `false`)
 * @returns The job object containing the cancel function and interval ID
 */
export declare function doUntil<T>(callback: (elapsed: number) => T, intervalMs: number, timeout?: number, startImmediately?: boolean): DoUntilJob;
/**
 * Repeatedly invokes a callback function at a specified interval until one of two conditions is met:
 * - The callback function explicitly returns `true`, indicating the interval should be cleared.
 * - The provided promise has resolved or rejected.
 *
 * This is useful for performing a recurring action (e.g., logging or polling) that can end either due to
 * external completion logic or once all promises are settled.
 *
 * @param callback - A function executed on each interval. If it returns `true`, the interval is cleared
 * @param promise - A Promise whose completion will also stop the interval
 * @param intervalMs - The interval duration in milliseconds
 * @returns The interval timer, which can be cleared manually if needed
 */
export declare function doUntilPromise<T>(callback: () => T, promise: Promise<unknown>, intervalMs: number): DoUntilJob;
/**
 * This generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 *
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 *
 * @param checkCallback - The function executed to verify a particular condition until it's passed
 * @param doCallback - The function executed when checkCallback returns true or some object
 * @param failCallback - The function executed when checkCallback has failed for too long (went over the timeout)
 * @param timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param checkFrequency - The frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
 */
export declare function whenThisThenThat<T>(checkCallback: () => T, doCallback: (value: T) => void, failCallback: (reason?: unknown) => void, timeout?: number, checkFrequency?: number): void;
/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 *
 * @param checkCallback - The function executed to verify a particular condition until it's passed
 * @param timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param checkFrequency - The frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 * @returns A Promise which resolves when the check passes
 */
export declare function whenThisThen<T>(checkCallback: () => T, timeout?: number, checkFrequency?: number): Promise<T>;
/**
 * Escape special characters from string.
 *
 * @param text - The text to escape
 * @returns Espaced string
 */
export declare function escapeRegExp(text: string): string;
/**
 * Tries to read an ArrayBuffer into a string by guessing different encodings and returning the best that works to read the content.
 *
 * @param buffer - The array buffer to read from
 * @param encodings - Optional encodings to try (defaults to ['utf-8', 'windows-1252', 'iso-8859-1'])
 * @returns The best text and the best encoding used for the text
 */
export declare function readTextWithBestEncoding(buffer: ArrayBuffer, encodings?: string[]): {
    text: string;
    encoding: string;
};
/**
 * Create guide object from .md file.
 *
 * @param mapId - ID of map
 * @param language - Language to use for guide
 * @param assetsURL - The base URL for assets
 * @returns A promise that resolves with the guide object, or undefined on error
 */
export declare function createGuideObject(mapId: string, language: TypeDisplayLanguage, assetsURL: string): Promise<TypeGuideObject | undefined>;
/**
 * Callback function which is fired when keyboard key is pressed.
 *
 * @param key - The keyboard key pressed by user
 * @param callbackId - The Id of element which init the focus trap
 * @param isFocusTrapped - Optional, component is focus trapped enabled
 * @param cb - Optional callback function to be fired
 */
export declare function handleEscapeKey(key: string, callbackId: string, isFocusTrapped?: boolean, cb?: () => void): void;
/**
 * Check if element is in viewport.
 *
 * @param el - The element to check for
 * @returns true if visible, false otherwise
 */
export declare function isElementInViewport(el: Element): boolean;
/**
 * Scrolls an element into view only if it's not already visible in the viewport.
 *
 * Respects user's motion preferences by using 'instant' scroll for users who prefer reduced motion.
 * For 'start': adds offset pixels above the element.
 * For 'end': adds offset pixels below the element.
 * For 'center' and 'nearest': uses standard scrollIntoView behavior without offset.
 *
 * @param el - The HTML element to scroll into view if not visible
 * @param blockValue - The vertical alignment ('start', 'center', 'end', 'nearest')
 * @param offset - Optional offset in pixels for 'start' (top gap) and 'end' (bottom gap) positions (default: 100)
 */
export declare function scrollIfNotVisible(el: HTMLElement, blockValue: ScrollLogicalPosition, offset?: number): void;
/**
 * Scrolls a list item into view within its scrollable container only, without scrolling the page.
 *
 * Adds a 20px gap for better visibility when scrolling.
 *
 * @param listItem - The list item element to scroll into view
 */
export declare function scrollListItemIntoView(listItem: HTMLElement): void;
/**
 * Checks whether the current environment is running on localhost port 8080.
 *
 * @returns True if the current hostname is localhost and the port is 8080; otherwise, false
 */
export declare function isLocalhost(): boolean;
/**
 * Formats a numeric value according to the display language.
 *
 * @param value - The value to format
 * @param displayLanguage - The display language ('en' or 'fr')
 * @returns The formatted value
 */
export declare function formatMeasurementValue(value: number, displayLanguage: string): string;
/**
 * Formats a length measurement with appropriate units.
 *
 * @param length - The length in meters
 * @param displayLanguage - The display language
 * @returns The formatted length string
 */
export declare function formatLength(length: number, displayLanguage: string): string;
/**
 * Formats an area measurement with appropriate units.
 *
 * @param area - The area in square meters
 * @param displayLanguage - The display language
 * @returns The formatted area string
 */
export declare function formatArea(area: number, displayLanguage: string): string;
/**
 * Normalizes a WMS accesspath if it is from datacube.
 *
 * Left as 'datacube' to check for both datacube.services.geo.ca and datacube-prod-data-public.s3.ca-central-1.amazonaws.com/
 *
 * @param path - The original access path
 * @returns The normalized access path
 */
export declare function normalizeDatacubeAccessPath(path: string): string;
/** Job returned by the doWhen function */
export type DelayJob = {
    /** The promise representing the delay job */
    promise: Promise<DelayResult>;
    /** Cancels the delay job, resolving correctly */
    cancel: () => void;
    /** Rejects the delay job, throwing an error */
    reject: (reason?: unknown) => void;
    /** The ID of the timeout */
    timeoutId: ReturnType<typeof setTimeout>;
};
/** Job result indicating if the delay timedout, good, or the job got cancelled */
export type DelayResult = 'timeout' | 'cancelled';
/** Job returned by the doUntil function */
export type DoUntilJob = {
    /** The start time of the job */
    start: number;
    /** Cancels the job */
    cancel: () => void;
    /** The ID of the interval */
    interval?: ReturnType<typeof setInterval>;
};
export {};
//# sourceMappingURL=utilities.d.ts.map