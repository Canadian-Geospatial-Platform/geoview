import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import sanitizeHtml from 'sanitize-html';
import { fromUrl } from 'geotiff';

import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import i18n from '@/core/translation/i18n';
import type { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { Fetch } from '@/core/utils/fetch-helper';
import { ensureServiceRequestUrl } from '@/core/utils/ogc-url-helper';
import type { TypeHTMLElement } from '@/core/types/global-types';
import { TIMEOUT } from '@/core/utils/constant';
import { CONFIG_PROXY_URL } from '@/api/types/map-schema-types';

/** The observers to monitor element removals from the DOM tree */
const observers: Record<string, MutationObserver> = {};

interface TypeDocument extends Document {
  webkitExitFullscreen: () => void;
  msExitFullscreen: () => void;
  mozCancelFullScreen: () => void;
}

interface PingResult {
  isValid: boolean;
  isReachable: boolean;
  needsProxy: boolean;
  status: number | null;
  error?: string;
}

/**
 * Represents RGBA color as [Red, Green, Blue, Alpha]
 */
export type RGBA = [r: number, g: number, b: number, a: number];

/**
 * Generates an array of numbers from `start` (inclusive) to `end` (exclusive),
 * incrementing by `step`.
 * @param {number} start - The first number in the range.
 * @param {number} end - The end of the range (exclusive).
 * @param {number} [step=1] - The increment between numbers.
 * @returns {number[]} An array of numbers from start to end with the given step.
 * @example
 * range(0, 5); // [0, 1, 2, 3, 4]
 * range(50, 1000, 50); // [50, 100, 150, ..., 950]
 */
export function range(start: number, end: number, step: number = 1): number[] {
  const out = [];
  for (let i = start; i < end; i += step) out.push(i);
  return out;
}

/**
 * Converts a string to camelCase.
 * Replaces hyphens (`-`), underscores (`_`), and spaces with capitalization
 * of the following letter, and ensures the first character is lowercase.
 * @param {string} str - The input string to convert.
 * @returns {string} The camelCased version of the input string.
 * @example
 * camelCase('my_tab-name'); // 'myTabName'
 * camelCase('Hello World'); // 'helloWorld'
 */
export function camelCase(str: string): string {
  let result = '';
  let capitalize = false;

  for (const ch of str) {
    if (ch === '-' || ch === '_' || ch === ' ') {
      // next character should be upper-cased
      capitalize = true;
    } else {
      if (capitalize) {
        result += ch.toUpperCase();
        capitalize = false;
      } else {
        result += ch.toLowerCase();
      }
    }
  }

  return result;
}

/**
 * Deeply compares two values (objects, arrays, or primitives) for equality.
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns `true` if the values are deeply equal, `false` otherwise.
 * @example
 * ```ts
 * deepEqual({ x: 1, y: [2, 3] }, { x: 1, y: [2, 3] }); // true
 * deepEqual([1, 2, 3], [1, 2, 4]); // false
 * deepEqual(5, 5); // true
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isPlainObject(obj: any): obj is Record<string, any> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Deeply clones a value, preserving functions and non-cloneable types by reference.
 * @param value The value to clone.
 * @returns A deep copy of the value.
 */
export function deepClone<T>(value: T): T {
  // Primitives (string, number, boolean, null, undefined, symbol, bigint) are returned as-is
  if (value === null || typeof value !== 'object') return value;

  // Preserve functions by reference
  if (typeof value === 'function') return value;

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(deepClone) as unknown as T;
  }

  // Handle Map
  if (value instanceof Map) {
    const copy = new Map();
    for (const [k, v] of value.entries()) {
      copy.set(deepClone(k), deepClone(v));
    }
    return copy as unknown as T;
  }

  // Handle Set
  if (value instanceof Set) {
    const copy = new Set();
    for (const v of value.values()) {
      copy.add(deepClone(v));
    }
    return copy as unknown as T;
  }

  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  // Handle plain objects
  const copy: Record<string, unknown> = {};
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      copy[key] = deepClone(value[key]);
    }
  }
  return copy as T;
}

/**
 * Deeply merges two objects, using the base object as defaults and
 * preserving existing values from the target object.
 * Nested plain objects are merged recursively.
 * @param {S} base - The base object providing default values.
 * @param {T} target - The target object whose defined values take precedence.
 * @returns {S & T} A new object containing the merged result.
 * @example
 * ```ts
 * const defaultSettings = { theme: { darkMode: false, fontSize: 14 }, locale: 'en' };
 * const userSettings = { theme: { darkMode: true } };
 * const merged = deepMerge(defaultSettings, userSettings);
 * // merged: { theme: { darkMode: true, fontSize: 14 }, locale: 'en' }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge<S extends any, T extends any>(base: S, target: T): S & T {
  if (!base) return target as T & S;
  if (!target) return base as T & S;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = { ...target };

  for (const key of Object.keys(base)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const srcVal = (base as any)[key];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tgtVal = (target as any)[key];

    let newValue;

    // ---- Case 1: both are plain objects → recursively merge ----
    if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
      newValue = deepMerge(srcVal, tgtVal);
    }

    // ---- Case 2: arrays → deep clone either source or target ----
    else if (Array.isArray(srcVal)) {
      if (Array.isArray(tgtVal)) {
        newValue = tgtVal.map(deepClone);
      } else {
        newValue = srcVal.map(deepClone);
      }
    }

    // ---- Case 3: target doesn't define the value → clone base's value ----
    else if (tgtVal === undefined) {
      newValue = deepClone(srcVal);
    }

    // ---- Apply newly computed value if any ----
    if (newValue !== undefined) {
      out[key] = newValue;
    }
  }

  return out as S & T;
}

/**
 * Performs a shallow equality check between two objects.
 * Compares the objects' own enumerable keys and values using `Object.is`.
 * Returns true if both objects have the same keys and corresponding values, false otherwise.
 * Note: This is a **shallow** comparison. Nested objects or arrays are compared by reference.
 * @param {Record<string, any>} a - The first object to compare.
 * @param {Record<string, any>} b - The second object to compare.
 * @returns {boolean} True if the objects are shallowly equal, false otherwise.
 * @example
 * const obj1 = { foo: 1, bar: 2 };
 * const obj2 = { foo: 1, bar: 2 };
 * const obj3 = { foo: 1, bar: 3 };
 * shallowObjectEqual(obj1, obj2); // true
 * shallowObjectEqual(obj1, obj3); // false
 */
export function shallowObjectEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aKeys = Object.keys(a as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bKeys = Object.keys(b as any);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!Object.is((a as Record<string, any>)[key], (b as Record<string, any>)[key])) return false;
  }

  return true;
}

/**
 * Performs a shallow equality check between two arrays.
 * Compares each element using `Object.is`. Returns true if both arrays
 * have the same length and all corresponding elements are strictly equal,
 * false otherwise.
 * Note: This is a **shallow** comparison. Nested objects or arrays are compared by reference.
 * @template T - The type of elements in the arrays.
 * @param {T[]} a - The first array to compare.
 * @param {T[]} b - The second array to compare.
 * @returns {boolean} True if the arrays are shallowly equal, false otherwise.
 * @example
 * const arr1 = [1, 2, 3];
 * const arr2 = [1, 2, 3];
 * const arr3 = [1, 2, 4];
 * shallowArrayEqual(arr1, arr2); // true
 * shallowArrayEqual(arr1, arr3); // false
 */
export function shallowArrayEqual<T>(a: T[], b: T[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }

  return true;
}

/**
 * Take string like "My string is __param__" and replace parameters (__param__) from array of values
 *
 * @param {unknown[]} params - An array of parameters to replace, i.e. ['short']
 * @param {string} message - The original message, i.e. "My string is __param__"
 * @returns {string} Message with values replaced "My string is short"
 */
export function replaceParams(params: unknown[], message: string): string {
  let tmpMess = message;
  (params as string[]).forEach((item: string) => {
    tmpMess = tmpMess.replace('__param__', item);
  });

  return tmpMess;
}

/**
 * Return proper language Geoview localized values from map i18n instance
 *
 * @param {TypeDisplayLanguage} language - The language to get the message in
 * @param {string} messageKey - The localize key to read the message from
 * @param {unknown[] | undefined} params - An array of parameters to replace, i.e. ['short']
 * @returns {string} The translated message with values replaced
 */
export function getLocalizedMessage(language: TypeDisplayLanguage, messageKey: string, params: unknown[] | undefined = undefined): string {
  // Check if the message key exists, before translating it and log a warning when it doesn't exist
  if (!i18n.exists(messageKey, { lng: language })) {
    // Log error
    logger.logError(`MISSING MESSAGE KEY FOR MESSAGE: ${messageKey}`);
  }

  const trans = i18n.getFixedT(language);
  let message = trans(messageKey);

  // if params provided, replace them
  if (params && params.length > 0) message = replaceParams(params, message);

  // Return the messsage
  return message;
}

/**
 * Deep merge objects together. Latest object will overwrite value on previous one
 * if property exist.
 * @param {unknown[]} objects - The objects to deep merge.
 * @returns {T} The merged object
 */
export function deepMergeObjects<T>(...objects: unknown[]): T {
  const deepCopyObjects = objects.map((object) => JSON.parse(JSON.stringify(object)));
  return deepCopyObjects.reduce((merged, current) => ({ ...merged, ...current }), {});
}

/**
 * Check if a string is a number
 * @param {string} str - The object to test
 * @returns true if the object is numeric, false otherwise
 */
export function isNumeric(str: string): boolean {
  return !Number.isNaN(Number(str));
}

/**
 * Check if an object is empty
 * @param {object} obj - The object to test
 * @returns true if the object is empty, false otherwise
 */
export function isObjectEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Get the URL of main script cgpv-main so we can access the assets
 * @returns {string} The URL of the main script
 */
export function getScriptAndAssetURL(): string {
  // get all loaded js scripts on the page
  const scripts = document.getElementsByTagName('script');
  let scriptPath: string = '';

  if (scripts && scripts.length) {
    // go through all loaded scripts on the page
    for (let scriptIndex = 0; scriptIndex < scripts.length; scriptIndex++) {
      // search for the core script
      if (scripts[scriptIndex].src.includes('cgpv-main')) {
        // get the src of the core script
        const { src } = scripts[scriptIndex];

        // extract the host from the loaded core script
        scriptPath = src.substring(0, src.lastIndexOf('/'));

        break;
      }
    }
  }

  return scriptPath;
}

/**
 * Generates a unique id of the specified length.
 * @param {8 | 18 | 36} length - Number of characters to return.
 * @returns {string} The id.
 */
export function generateId(length: 8 | 18 | 36 = 36): string {
  const generatedId = crypto.randomUUID().substring(0, length);
  return generatedId;
}

// TODO: refactor - This is a duplicate of static config api function. Replace in api OR create utilities api functions
/**
 * Validates the GeoCore UUIDs.
 * @param {string} uuid The UUID to validate.
 * @returns {boolean} Returns true if the UUID respect the format.
 */
export function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}

/**
 * Checks whether a text response contains a valid OGC capabilities root element.
 *
 * @param text - The response text to check.
 * @returns True if the text contains WMS or WFS capabilities markers.
 */
function isOgcCapabilitiesResponse(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('wms_capabilities') || lower.includes('wmt_ms_capabilities') || lower.includes('wfs_capabilities');
}

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
 * @param targetUrl - The URL to validate and ping.
 * @param proxyBase - Optional. The proxy server base URL. Defaults to CONFIG_PROXY_URL.
 * @param timeoutMs - Optional. Request timeout in milliseconds. Defaults to 5000ms.
 * @returns A result object with isValid, isReachable, needsProxy, status, and optional error.
 */
export async function validateAndPingUrl(
  targetUrl: string,
  proxyBase: string = CONFIG_PROXY_URL,
  timeoutMs: number = 5000
): Promise<PingResult> {
  const result: PingResult = {
    isValid: false,
    isReachable: false,
    needsProxy: false,
    status: null,
  };

  // Strip query params for the reachability check
  const targetUrlWithoutParams = targetUrl.split('?')[0];

  // Syntax validation
  try {
    new URL(targetUrlWithoutParams);
    result.isValid = true;
  } catch {
    result.error = 'Invalid URL format';
    return result;
  }

  // Build OGC GetCapabilities check URLs
  const ogcCheckUrls = [
    ensureServiceRequestUrl(targetUrl, 'WMS', 'GetCapabilities', ''),
    ensureServiceRequestUrl(targetUrl, 'WFS', 'GetCapabilities', ''),
  ];

  // HEAD request to see if the server responds
  const { response, reason } = await Fetch.fetchHeadWithTimeout(targetUrlWithoutParams, timeoutMs);

  if (reason === 'ok' && response) {
    result.status = response.status;

    // 2xx/3xx — the path exists and is reachable
    if (response.status < 400) {
      result.isReachable = true;
      return result;
    }

    // 4xx/5xx — server is alive but bare path fails.
    // WMS/WFS services often return 4xx without query params. Since HEAD succeeded (no CORS issue),
    // try GetCapabilities directly to see if it is a valid OGC service.
    // Use raw fetch because WFS GetCapabilities may return non-2xx to the bare path but 200 with params.
    const directChecks = await Promise.allSettled(
      ogcCheckUrls.map(async (url) => {
        const resp = await fetch(url);
        return resp.text();
      })
    );

    // We fire both WMS and WFS GetCapabilities in parallel. If either one returns a valid
    // capabilities response, the URL is considered reachable — we don't need both to succeed.
    for (const settled of directChecks) {
      if (settled.status === 'fulfilled' && isOgcCapabilitiesResponse(settled.value)) {
        result.isReachable = true;
        return result;
      }
    }

    // Not a valid OGC service either — the path is truly wrong
    result.isReachable = false;
    result.error = `Server returned status ${response.status} and no OGC service found at this URL`;
    return result;
  }

  if (reason === 'timeout') {
    result.error = 'Request timed out';
    return result;
  }

  if (reason === 'network') {
    result.error = 'Server unreachable (DNS failure, server down, or network error)';
    return result;
  }

  // CORS — server is alive but blocks cross-origin.
  // Try OGC GetCapabilities through proxy (only WMS/WFS have CORS issues).
  if (reason === 'cors') {
    const proxyChecks = await Promise.allSettled(
      ogcCheckUrls.map(async (checkUrl) => {
        const proxiedUrl = `${proxyBase}?${checkUrl}`;
        // Use raw fetch instead of Fetch.fetchText because the proxy may forward non-2xx
        // responses that still contain valid capabilities XML in the body.
        const resp = await fetch(proxiedUrl);
        return resp.text();
      })
    );

    // Same as above: if either WMS or WFS GetCapabilities succeeds through the proxy, it's reachable.
    for (const settled of proxyChecks) {
      if (settled.status === 'fulfilled' && isOgcCapabilitiesResponse(settled.value)) {
        result.isReachable = true;
        result.needsProxy = true;
        return result;
      }
    }

    result.isReachable = false;
    result.error = 'Server blocks cross-origin requests and no OGC service found';
    return result;
  }

  // Unknown failure
  result.error = 'Unexpected error during URL validation';
  return result;
}

/**
 * Extracts the embedded color palette from a GeoTIFF file at the given URL.
 *
 * Returns an array of RGBA color tuples, or `undefined` if no palette is present.
 * Each color is normalized to 8-bit values.
 *
 * @param url - URL to the GeoTIFF file.
 * @returns Array of RGBA color tuples, or undefined if no palette.
 */
export async function extractGeotiffColorMap(url: string): Promise<RGBA[] | undefined> {
  const tiff = await fromUrl(url);
  const image = await tiff.getImage();
  const fileDirectory = image.getFileDirectory();

  // ColorMap is a flat Uint16Array of 3 × N entries laid out as [R0…R(N-1), G0…G(N-1), B0…B(N-1)].
  // Values are 16-bit (0–65535) and must be scaled to 8-bit (0–255) by dividing by 256.
  const colorMap = fileDirectory.ColorMap as Uint16Array | undefined;

  if (!colorMap) {
    return undefined; // no embedded palette
  }

  const size = colorMap.length / 3;
  const palette: RGBA[] = [];

  for (let i = 0; i < size; i++) {
    // Use Math.floor(colorMap[i] / 256) instead of bitwise shift for clarity and to avoid unexpected behavior with large numbers
    const r = Math.floor(colorMap[i] / 256);
    const g = Math.floor(colorMap[i + size] / 256);
    const b = Math.floor(colorMap[i + size * 2] / 256);
    palette.push([r, g, b, 255]);
  }

  return palette;
}

/**
 * Set alpha for a color
 * @param {number[]} colorArray - The array of color numbers
 * @param {number} alpha - The new alpha
 *
 * @returns {number[]} the color with the alpha set
 */
export function setAlphaColor(colorArray: number[], alpha: number): number[] {
  const color = colorArray;
  color[3] = alpha;
  return color;
}

/**
 * Validates if a JSON string is well formatted
 * @param {string} str - The string to test
 * @returns {bollean} true if the JSON is valid, false otherwise
 */
export function isJsonString(str: string): boolean {
  try {
    if (str !== '') {
      JSON.parse(str);
    } else {
      return false;
    }
  } catch (e) {
    logger.logError(
      '- Invalid JSON string. String passed to the JSON parser:',
      str,
      '- JSON Parser error:',
      (e as { message: string }).message,
      '- See text above.'
    );
    return false;
  }
  return true;
}

/**
 * Converts an XML document object into a json object
 * @param {Document | Node | Element} xml - The XML document object
 * @returns The converted json object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function xmlToJson(xml: Document | Node | Element): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj: any = {};

  switch (xml.nodeType) {
    case 1: {
      // ELEMENT_NODE
      const element = xml as Element;
      if (element.attributes?.length) {
        obj['@attributes'] = {};
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes.item(i);
          obj['@attributes'][attr!.nodeName] = attr!.nodeValue;
        }
      }
      break;
    }

    case 3: // TEXT_NODE
      return xml.nodeValue?.trim() || '';

    case 4: // CDATA_SECTION_NODE
      return xml.nodeValue || '';
  }

  // Handle children
  const textParts: string[] = []; // collect text + cdata
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const child = xml.childNodes.item(i);

      // extract value
      const value = xmlToJson(child);

      // ignore empty text
      // eslint-disable-next-line no-continue
      if (value === '' || value === null) continue;

      // TEXT or CDATA: collect them
      if (child.nodeType === 3 || child.nodeType === 4) {
        textParts.push(value);
        // eslint-disable-next-line no-continue
        continue;
      }

      // ELEMENT node
      const { nodeName } = child;
      if (obj[nodeName] === undefined) {
        obj[nodeName] = value;
      } else {
        if (!Array.isArray(obj[nodeName])) {
          obj[nodeName] = [obj[nodeName]];
        }
        obj[nodeName].push(value);
      }
    }
  }

  // If the element contains ONLY text/CDATA
  if (Object.keys(obj).length === 0 && textParts.length > 0) {
    return textParts.join(' ').trim();
  }

  // If it has both attributes and text
  if (textParts.length > 0) {
    obj['#text'] = textParts.join(' ').trim();
  }

  return obj;
}

/**
 * Parses a XML string into Json.
 * @param {string} xmlContent - The XML string to parse.
 * @returns {T} A json object
 */
export function parseXMLToJson<T>(xmlContent: string): T {
  // Read the xml
  const xml = new DOMParser().parseFromString(xmlContent, 'application/xml');

  // Parse it using xmlToJson and return
  return xmlToJson(xml);
}

/**
 * Execute a XMLHttpRequest
 * @param {string} url - The url to request
 * @returns {Promise<string>} The return value, return is '{}' if request failed
 * @deprecated Use the core/utils/fetch-helper.ts/Fetch functions instead
 */
export function getXMLHttpRequest(url: string): Promise<string> {
  const request = new Promise<string>((resolve) => {
    try {
      const jsonObj = new XMLHttpRequest();
      jsonObj.open('GET', url, true);
      jsonObj.onreadystatechange = () => {
        if (jsonObj.readyState === 4 && jsonObj.status === 200) {
          resolve(jsonObj.responseText);
        } else if (jsonObj.readyState === 4 && jsonObj.status >= 400) {
          resolve('{}');
        }
      };
      jsonObj.onerror = () => {
        resolve('{}');
      };
      jsonObj.send(null);
    } catch (error: unknown) {
      // Log warning
      logger.logWarning(error);
      resolve('{}');
    }
  });

  return request;
}

// #region UI HELPERS

/**
 * Add a UI component to a custom div. Do not listen to event from here, pass in the props
 *
 * @param {string} targetDivId - The div id to insert the component in
 * @param {React.ReactElement} component - The UI react component
 *
 * @return {Root} the React root element
 */
export function addUiComponent(targetDivId: string, component: React.ReactElement): Root {
  const root = createRoot(document.getElementById(targetDivId)!);
  root.render(component);
  return root;
}

/**
 * Sanitizes HTML to remove threat
 *
 * @param {string} contentHtml - HTML content to sanitize
 * @returns {string} Sanitized HTML or empty string if all dirty
 */
export function sanitizeHtmlContent(contentHtml: string): string {
  return sanitizeHtml(contentHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: { img: ['src'], a: ['href'] },
    allowedSchemes: ['data', 'http', 'https'],
  });
}

/**
 * Sets up a MutationObserver to monitor when a specific DOM element (e.g., a div container)
 * is removed from the document. When the element is removed, it triggers a cleanup callback
 * and disconnects the observer to prevent memory leaks.
 * @param {string} key - A unique identifier for the element, used to manage observer references.
 * @param {Element} element - The DOM element to monitor for removal from the DOM tree.
 * @param {(key: string) => void} onHtmlElementRemoved - The callback executed once the given DOM element gets removed from the DOM tree.
 */
export function watchHtmlElementRemoval(key: string, element: HTMLElement, onHTMLElementRemoved: (key: string) => void): void {
  if (!element || !element.parentNode) return;

  // Get the parent to set the MutationObserver on
  const parent = element.parentNode;

  // Disconnect prior observer if it exists
  if (observers[key]) {
    // Disconnect the observer, we're replacing it
    observers[key].disconnect();
    delete observers[key];
  }

  // Create the MutationObserver
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.removedNodes)) {
        if (node === element || (node instanceof HTMLElement && node.contains(element))) {
          // Callback
          onHTMLElementRemoved(key);

          // Disconnect the observer, we're done
          observer.disconnect();
          delete observers[key];
          return;
        }
      }
    }
  });

  // Store and activate the observer
  observers[key] = observer;
  observer.observe(parent, { childList: true });
}

/**
 * Attempts to place the given HTML element into fullscreen mode.
 * This function handles browser compatibility by trying the standard
 * `requestFullscreen()` API first, then falling back to vendor-prefixed
 * versions for Safari, IE11, and Firefox.
 * Any errors from the standard promise-based fullscreen request are caught
 * and logged using `logger.logPromiseFailed`.
 * @param {TypeHTMLElement} element - The element to display in fullscreen mode.
 */
export function requestFullscreen(element: TypeHTMLElement): void {
  if (element.requestFullscreen) {
    element.requestFullscreen().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('element.requestFullscreen', error);
    });
  } else if (element.webkitRequestFullscreen) {
    /* Safari */
    element.webkitRequestFullscreen();
  } else if (element.msRequestFullscreen) {
    /* IE11 */
    element.msRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    /* Firefox */
    element.mozRequestFullScreen();
  }
}

/**
 * Exits fullscreen mode if the document is currently in fullscreen.
 * This function uses the standard `exitFullscreen()` API when available,
 * and falls back to vendor-prefixed exit methods for Safari, IE11, and Firefox.
 * Any errors from the standard promise-based exit request are caught
 * and logged using `logger.logPromiseFailed`.
 */
export function exitFullscreen(): void {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('document.exitFullscreen', error);
    });
  } else if ((document as TypeDocument).webkitExitFullscreen) {
    /* Safari */
    (document as TypeDocument).webkitExitFullscreen();
  } else if ((document as TypeDocument).msExitFullscreen) {
    /* IE11 */
    (document as TypeDocument).msExitFullscreen();
  } else if ((document as TypeDocument).mozCancelFullScreen) {
    /* Firefox */
    (document as TypeDocument).mozCancelFullScreen();
  }
}

// #endregion UI HELPERS

/**
 * Safely converts a JavaScript value to a JSON string, handling circular references.
 * Circular objects are replaced with the string `"{Circular JSON}"` to prevent
 * `JSON.stringify` from throwing an error. The function also supports optional
 * pretty-printing via the `space` parameter.
 * @param {*} obj - The value to stringify.
 * @param {number} [space=2] - Number of spaces to use for indentation in the resulting JSON string.
 * @returns {string} The JSON string representation of the input value, with circular references handled.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeStringify(obj: any, space: number = 2): string {
  const seen = new WeakSet();

  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '{Circular JSON}'; // Or return undefined to remove the property
        }
        seen.add(value);
      }
      return value;
    },
    space
  );
}

/**
 * Removes comments from JSON config
 *
 * @param {string} config Map config to clean
 * @returns {string} cleaned config object
 */
export function removeCommentsFromJSON(config: string): string {
  // Erase comments in the config file.
  return config
    .split(/(?<!\\)'/gm)
    .map((fragment, index) => {
      if (index % 2) return fragment.replaceAll(/\/\*/gm, String.fromCharCode(1)).replaceAll(/\*\//gm, String.fromCharCode(2));
      return fragment;
    })
    .join("'")
    .replaceAll(/\/\*(?<=\/\*)((?:.|\n|\r)*?)(?=\*\/)\*\//gm, '')
    .replaceAll(String.fromCharCode(1), '/*')
    .replaceAll(String.fromCharCode(2), '*/');
}

/**
 * Parses JSON config string into a JSON object of type T.
 * @param {string} configStr - Map config to parse
 * @returns {T} Cleaned and parsed config object
 */
export function parseJSONConfig<T>(configStr: string): T {
  // remove CR and LF from the map config
  let jsonString = configStr.replace(/(\r\n|\n|\r)/gm, '');
  // replace apostrophes not preceded by a backslash with quotes
  jsonString = jsonString.replace(/(?<!\\)'/gm, '"');
  // replace apostrophes preceded by a backslash with a single apostrophe
  jsonString = jsonString.replace(/\\'/gm, "'");
  return JSON.parse(jsonString);
}

/**
/**
 * Export the image data url to a file
 * @param {string} dataUrl - The data Url to be downloaded.
 * @param {string} name - The name of exported file
 * @param {string} format - The format of the exported file
 */
export function exportFile(dataUrl: string, name: string, format: 'pdf' | 'png' | 'jpeg' = 'png'): void {
  try {
    const element = document.createElement('a');
    const filename = `${name}.${format}`;
    element.setAttribute('href', dataUrl);
    element.setAttribute('download', filename);
    element.click();
  } catch (error: unknown) {
    logger.logError(`Error trying to export ${format}.`, error);
  }
}

/**
 * Find an object property by regex values. The find is case insensitive.
 * @param {unknown | undefined} objectItem - The object to search in.
 * @param {RegExp | RegExp[]} patterns - A single RegExp or an array of RegExp patterns to match in sequence.
 * @returns {T = Record<string, unknown> | undefined} The value found at the end of the matching path, or undefined if not found.
 */
export function findPropertyByRegexPath<T = Record<string, unknown>>(
  objectItem: unknown | undefined,
  patterns: RegExp | RegExp[]
): T | undefined {
  const regexes = Array.isArray(patterns) ? patterns : [patterns];

  let current = objectItem;

  for (const regex of regexes) {
    if (typeof current !== 'object' || current === null) return undefined;

    const entries = Object.entries(current);
    const match = entries.find(([key]) => new RegExp(regex, 'i').test(key));
    current = match?.[1] as Record<string, unknown>;
  }

  return current as T;
}

/**
 * Check string to see if it is an image
 *
 * @param {string} item - The item to validate
 * @returns {boolean} true if it is an image, false otherwise
 */
export function isImage(item: string): boolean {
  return /^https:\/\/.+\.(jpg|jpeg|png|gif|bmp)$/.test(item);
}

/**
 * Checks object to see if it can be converted to a string; if not, returns an empty string
 *
 * @param str - The unknown object to stringify
 * @return Returns the original object if it can be converted to a string; '' otherwise
 */
export function stringify(str: unknown): unknown | string {
  if (typeof str === 'undefined' || str === null) {
    return '';
  }

  return str;
}

// #region TIMING HELPERS

/**
 * Creates a delayed job which includes a promise that resolves after a specified timeout, with the ability to cancel or reject it manually.
 *
 * @param timeout - The number of milliseconds to wait before resolving the promise.
 * @returns An object representing the delayed job, containing:
 *   - `promise`: A Promise that resolves after the timeout (or immediately if canceled).
 *   - `cancel()`: Cancels the timeout and immediately resolves the promise.
 *   - `reject(reason)`: Cancels the timeout and rejects the promise with the given reason.
 *   - `timeoutId`: The ID of the underlying setTimeout, useful for advanced control.
 */
export function doTimeout(timeout: number): DelayJob {
  // Create a promise of the delay
  let timeoutId: ReturnType<typeof setTimeout>;
  let resolveFn: (value: DelayResult) => void;
  let rejectFn: (reason?: unknown) => void;

  let finished = false; // To prevent multiple resolutions/rejections
  const promise = new Promise<DelayResult>((resolve, reject) => {
    // Keep a reference to the resolve function
    resolveFn = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    // Keep a reference to the reject function
    rejectFn = (reason) => {
      if (finished) return;
      finished = true;
      reject(reason);
    };

    // Wait
    timeoutId = setTimeout(() => resolveFn('timeout'), timeout);
  });

  // Return the promise and the timeoutId in case we want to abort it
  return {
    promise,
    cancel: () => {
      clearTimeout(timeoutId);
      resolveFn('cancelled');
    },
    reject: (reason: unknown) => {
      clearTimeout(timeoutId);
      rejectFn(reason);
    },
    timeoutId: timeoutId!,
  };
}

/**
 * Delay helper function.
 *
 * @param timeout - The number of milliseconds to wait for.
 * @returns A Promise which resolves when the delay timeout expires.
 */
export function delay(timeout: number): Promise<void> {
  // Redirect
  return doTimeout(timeout).promise.then((result) => {
    if (result !== 'timeout') {
      throw new Error('Delay was cancelled unexpectedly');
    }
  });
}

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
 * is cleared immediately.
 * @param intervalMs - Interval duration in milliseconds between each callback invocation.
 * @param timeout - Optional maximum duration in milliseconds before the interval
 * is automatically cleared. If omitted, the interval runs until the callback stops it.
 * @param startImmediately - If `true`, the callback is invoked once immediately
 * before the interval is scheduled. Defaults to `false`.
 * @returns The job object containing the cancel function and interval ID.
 */
export function doUntil<T>(callback: (elapsed: number) => T, intervalMs: number, timeout?: number, startImmediately = false): DoUntilJob {
  // Note the start time
  const start = Date.now();

  // Mutable state: tracks whether the loop has been stopped
  let stopped = false;
  let interval: ReturnType<typeof setInterval> | undefined = undefined;

  // Idempotent — safe to call multiple times
  const cancel = (): void => {
    if (stopped) return;
    stopped = true;
    clearInterval(interval);
  };

  // Returns true when the loop should no longer run
  const tick = (): boolean => {
    // Already cancelled externally
    if (stopped) return true;

    const elapsed = Date.now() - start;

    // Timeout reached — stop
    if (timeout && elapsed >= timeout) {
      cancel();
      return true;
    }

    // Invoke the caller's logic; truthy = "I'm done"
    const shouldStop = callback(elapsed);

    // The callback itself may have called cancel()
    if (stopped) return true;

    // Callback signalled completion
    if (shouldStop) {
      cancel();
      return true;
    }

    // Keep going
    return false;
  };

  // Optional first invocation before the interval kicks in
  if (startImmediately) tick();

  // If the immediate tick already stopped us, skip scheduling
  if (!stopped) {
    interval = setInterval(tick, intervalMs);
  }

  // Return the job
  return {
    start,
    cancel,
    interval,
  };
}

/**
 * Repeatedly invokes a callback function at a specified interval until one of two conditions is met:
 * - The callback function explicitly returns `true`, indicating the interval should be cleared.
 * - The provided promise has resolved or rejected.
 * This is useful for performing a recurring action (e.g., logging or polling) that can end either due to
 * external completion logic or once all promises are settled.
 *
 * @param callback - A function executed on each interval. If it returns `true`, the interval is cleared.
 * @param promise - A Promise whose completion will also stop the interval.
 * @param intervalMs - The interval duration in milliseconds.
 * @returns The interval timer, which can be cleared manually if needed.
 */
export function doUntilPromise<T>(callback: () => T, promise: Promise<unknown>, intervalMs: number): DoUntilJob {
  // Start a recurrent timer
  const job = doUntil(callback, intervalMs);

  // Disble eslint here, it should be caught by the creator of the promise
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  promise.finally(() => job.cancel());

  // Return the interval timer
  return job;
}

/**
 * Internal function to work with async "whenThisThat"... methods.
 * This function is recursive and checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 *
 * @param checkCallback - The function executed to verify a particular condition until it's passed
 * @param doCallback - The function executed when checkCallback returns true or some object
 * @param failCallback - The function executed when checkCallback has failed for too long (went over the timeout)
 * @param startDate - The initial date this task was started
 * @param timeout - The duration in milliseconds until the task is aborted
 * @param checkFrequency - The frequency in milliseconds to callback for a check.
 */
// eslint-disable-next-line no-underscore-dangle
function _whenThisThenThat<T>(
  checkCallback: () => T,
  doCallback: (value: T) => void,
  failCallback: (reason?: unknown) => void,
  startDate: Date,
  timeout: number,
  checkFrequency: number
): void {
  // GV This pattern immediately calls the callback and then starts checking recursively.
  // Do not change this for a 'doUntil' as the latter only calls the callback *after* the first checkFrequency expires.

  let v: T;

  try {
    // Try to run the check
    v = checkCallback();
  } catch (err) {
    // If the check throws, we fail immediately
    failCallback(err);
    return;
  }

  // If check was positive or anything of value
  if (v) {
    // Do the callback and we're done
    doCallback(v);
    return;
  }

  // If expired
  if (Date.now() - startDate.getTime() > timeout) {
    // Failed, took too long, this throws an exception in typical async/await contexts
    failCallback(`Task abandoned: exceeded timeout of ${timeout} ms.`);
    return;
  }

  // Check again later
  setTimeout(() => {
    // Recursive call
    _whenThisThenThat(checkCallback, doCallback, failCallback, startDate, timeout, checkFrequency);
  }, checkFrequency);
}

/**
 * This generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 *
 * @param checkCallback - The function executed to verify a particular condition until it's passed
 * @param doCallback - The function executed when checkCallback returns true or some object
 * @param failCallback - The function executed when checkCallback has failed for too long (went over the timeout)
 * @param timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param checkFrequency - The frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
 */
export function whenThisThenThat<T>(
  checkCallback: () => T,
  doCallback: (value: T) => void,
  failCallback: (reason?: unknown) => void,
  timeout: number = 10000,
  checkFrequency: number = 100
): void {
  const startDate = new Date();
  _whenThisThenThat(checkCallback, doCallback, failCallback, startDate, timeout, checkFrequency);
}

/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 *
 * @param checkCallback - The function executed to verify a particular condition until it's passed
 * @param timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param checkFrequency - The frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 * @returns A Promise which resolves when the check passes
 */
export function whenThisThen<T>(checkCallback: () => T, timeout?: number, checkFrequency?: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Redirect
    whenThisThenThat(checkCallback, resolve, reject, timeout, checkFrequency);
  });
}

// #endregion TIMING HELPERS

/**
 * Escape special characters from string.
 *
 * @param text - The text to escape
 * @returns Espaced string
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Tries to read an ArrayBuffer into a string by guessing different encodings and returning the best that works to read the content.
 * @param {ArrayBuffer} buffer - The array buffer to read from.
 * @param {string[]} encodings - The encodings to try, defaults to ['utf-8', 'windows-1252', 'iso-8859-1'].
 * @returns { text: string; encoding: string } The best text and the best encoding used for the text
 */
export function readTextWithBestEncoding(
  buffer: ArrayBuffer,
  encodings: string[] = ['utf-8', 'windows-1252', 'iso-8859-1']
): { text: string; encoding: string } {
  const uint8View = new Uint8Array(buffer);
  let fallback: { text: string; encoding: string } | null = null;

  // For each encoding to try
  for (const encoding of encodings) {
    try {
      const decoder = new TextDecoder(encoding, { fatal: false });
      const text = decoder.decode(uint8View);

      // If no replacement characters are present, it's a clean decode
      if (!text.includes('\uFFFD')) {
        return { text, encoding };
      }

      // Save the first partially-decodable fallback
      if (!fallback) {
        fallback = { text, encoding };
      }
    } catch {
      // Ignore decode errors
    }
  }

  // If none are clean, return the first partially-decodable fallback
  return fallback ?? { text: '', encoding: '' };
}

/**
 * Extract heading from guide content.
 * @param {string} content - Guide content to get heading from.
 * @returns {string} Content section heading
 */
function getSectionHeading(content: string): string {
  const firstLine = content.split('\n')[0].trim().split(' ');
  return firstLine.filter((string) => !string.startsWith('#') && !string.startsWith('!')).join(' ');
}

/**
 * Create guide object from .md file.
 * @param {string} mapId - ID of map.
 * @param {TypeDisplayLanguage} language - Language to use for guide.
 * @returns {Promise<TypeGuideObject | undefined>} The guide object
 */
export async function createGuideObject(
  mapId: string,
  language: TypeDisplayLanguage,
  assetsURL: string
): Promise<TypeGuideObject | undefined> {
  try {
    // Fetch the guide content
    const content = await Fetch.fetchText(`${assetsURL}/locales/${language}/guide.md`);

    // Split by first level sections (Split with =1!<key>=) AND set URL for images from the assetURL
    const sections = content.replaceAll('{{assetsURL}}', assetsURL).split(/=(?=1!)(.*?)=/);

    if (!sections[0].trim()) {
      sections.shift();
    }

    const guideObject: TypeGuideObject = {};
    for (let i = 0; i < sections.length; i += 2) {
      // Remove "1!" and whitespace from the key
      const key = sections[i].trim().substring(2);
      const fullSectionContent = sections[i + 1].trim();
      const heading = getSectionHeading(fullSectionContent);

      // Split by second level sections (Split with =2!<key>=)
      const subSections = fullSectionContent.split(/=(?=2!)(.*?)=/);

      // Content for top level is the first subsection
      const sectionContent = subSections[0];
      const children: TypeGuideObject = {};

      // Get level two sections
      if (subSections.length > 1) {
        for (let j = 1; j < subSections.length; j += 2) {
          // Remove "2!" and whitespace from the key
          const childKey = subSections[j].trim().substring(2);
          const fullChildContent = subSections[j + 1].trim();
          const childHeading = getSectionHeading(fullChildContent);
          const subSubSections = fullChildContent.split(/=(?=3!)(.*?)=/);

          // Content for child level is the first subsection
          const childContent = subSubSections[0];
          const grandChildren: TypeGuideObject = {};

          // Get level three sections
          for (let k = 1; k < subSubSections.length; k += 2) {
            // Remove "3!" and whitespace from the key
            const grandChildKey = subSubSections[k].trim().substring(2);

            // Highest possible level, so all that remains is content
            const grandChildContent = subSubSections[k + 1].trim();
            const grandChildHeading = getSectionHeading(grandChildContent);
            grandChildren[grandChildKey] = { heading: grandChildHeading, content: grandChildContent };
          }

          children[childKey] = {
            heading: childHeading,
            content: childContent,
            children: grandChildren,
          };
        }
      }
      guideObject[key] = { heading, content: sectionContent, children };
    }
    return guideObject;
  } catch (error: unknown) {
    logger.logError(mapId, error, 'createGuideObject');
    return undefined;
  }
}

/**
 * Callback function which is fired when keyboard key is pressed.
 * @param {string} key - The keyboard key pressed by user.
 * @param {string} callbackId - The Id of element which init the focus trap.
 * @param {boolean} isFocusTrapped - Component is focus trapped enabled.
 * @param {Function} cb - The callback function to be fired, if needed.
 */
export function handleEscapeKey(key: string, callbackId: string, isFocusTrapped?: boolean, cb?: () => void): void {
  if (key === 'Escape') {
    if (isFocusTrapped && callbackId) {
      setTimeout(() => {
        document.getElementById(callbackId ?? '')?.focus();
      }, TIMEOUT.dataPanelLoading);
    }
    cb?.();
  }
}

/**
 * Check if elemetn is in viewport
 * @param {Element} el - The element to check for
 * @returns {Boolean} true if visible, false otherwise
 */
export function isElementInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scrolls an element into view only if it's not already visible in the viewport.
 * Respects user's motion preferences by using 'instant' scroll for users who prefer reduced motion.
 * For 'start': adds offset pixels above the element.
 * For 'end': adds offset pixels below the element.
 * For 'center' and 'nearest': uses standard scrollIntoView behavior without offset.
 * @param {HTMLElement} el - The HTML element to scroll into view if not visible
 * @param {ScrollLogicalPosition} blockValue - The vertical alignment ('start', 'center', 'end', 'nearest')
 * @param {number} offset - Offset in pixels for 'start' (top gap) and 'end' (bottom gap) positions (default: 100)
 */
export function scrollIfNotVisible(el: HTMLElement, blockValue: ScrollLogicalPosition, offset: number = 100): void {
  const behaviorScroll = (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') as ScrollBehavior;
  const rect = el.getBoundingClientRect();
  if (rect.top < offset || rect.bottom > window.innerHeight) {
    if (blockValue === 'center' || blockValue === 'nearest') {
      el.scrollIntoView({ behavior: behaviorScroll, block: blockValue });
    } else {
      let scrollTop;
      if (blockValue === 'end') {
        scrollTop = window.scrollY + rect.bottom - window.innerHeight + offset;
      } else {
        scrollTop = window.scrollY + rect.top - offset;
      }
      window.scrollTo({
        top: scrollTop,
        behavior: behaviorScroll,
      });
    }
  }
}

/**
 * Scrolls a list item into view within its scrollable container only, without scrolling the page.
 * Adds a 20px gap for better visibility when scrolling.
 * @param {HTMLElement} listItem - The list item element to scroll into view
 */
export function scrollListItemIntoView(listItem: HTMLElement): void {
  const behaviorScroll = (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') as ScrollBehavior;
  const gap = 20;

  // Find the nearest scrollable parent
  let container: HTMLElement | null = listItem.parentElement;
  while (container && container !== document.body) {
    const { overflowY } = window.getComputedStyle(container);
    if ((overflowY === 'auto' || overflowY === 'scroll') && container.scrollHeight > container.clientHeight) {
      break;
    }
    container = container.parentElement;
  }

  if (!container || container === document.body) return;

  // Check if item is outside the visible area
  const itemRect = listItem.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const isAbove = itemRect.top < containerRect.top;
  const isBelow = itemRect.bottom > containerRect.bottom;

  if (!isAbove && !isBelow) return;

  // Calculate scroll position
  const itemTop = listItem.offsetTop - container.offsetTop;
  const itemBottom = itemTop + listItem.offsetHeight;

  let newScrollTop;
  if (isAbove) {
    newScrollTop = Math.max(0, itemTop - gap);
  } else {
    newScrollTop = itemBottom - container.clientHeight + gap;
  }

  container.scrollTo({
    top: newScrollTop,
    behavior: behaviorScroll,
  });
}

/**
 * Checks whether the current environment is running on localhost port 8080.
 *
 * @returns {boolean} True if the current hostname is localhost and the port is 8080; otherwise, false.
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined' || !window.location) return false;
  return window.location.hostname === 'localhost' && window.location.port === '8080';
}

/**
 * Formats a numeric value according to the display language
 * @param {number} value - The value to format
 * @param {string} displayLanguage - The display language ('en' or 'fr')
 * @returns {string} The formatted value
 */
export function formatMeasurementValue(value: number, displayLanguage: string): string {
  return displayLanguage === 'fr'
    ? value.toLocaleString('fr-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formats a length measurement with appropriate units
 * @param {number} length - The length in meters
 * @param {string} displayLanguage - The display language
 * @returns {string} The formatted length string
 */
export function formatLength(length: number, displayLanguage: string): string {
  if (length > 100) {
    const value = Math.round((length / 1000) * 100) / 100;
    return `${formatMeasurementValue(value, displayLanguage)} km`;
  }
  const value = Math.round(length * 100) / 100;
  return `${formatMeasurementValue(value, displayLanguage)} m`;
}

/**
 * Formats an area measurement with appropriate units
 * @param {number} area - The area in square meters
 * @param {string} displayLanguage - The display language
 * @returns {string} The formatted area string
 */
export function formatArea(area: number, displayLanguage: string): string {
  if (area > 10000) {
    const value = Math.round((area / 1000000) * 100) / 100;
    return `${formatMeasurementValue(value, displayLanguage)} km<sup>2</sup>`;
  }
  const value = Math.round(area * 100) / 100;
  return `${formatMeasurementValue(value, displayLanguage)} m<sup>2</sup>`;
}

/**
 * Normalizes a WMS accesspath if it is from datacube.
 * Left as 'datacube' to check for both datacube.services.geo.ca and datacube-prod-data-public.s3.ca-central-1.amazonaws.com/
 * @param {string} path - The original access path.
 * @returns {string} The normalized access path.
 */
export function normalizeDatacubeAccessPath(path: string): string {
  //TODO: extract to list of exceptions / normalizations?
  return path.toLowerCase().includes('datacube') ? path.replace('wrapper/ramp/ogc', 'wrapper/ogc').replace('/ows/', '/wrapper/ogc/') : path;
}

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
