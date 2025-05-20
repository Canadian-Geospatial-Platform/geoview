import { Root } from 'react-dom/client';
import { TypeDisplayLanguage } from '@/api/config/types/map-schema-types';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
/**
 * Take string like "My string is __param__" and replace parameters (__param__) from array of values
 *
 * @param {unknown[]} params - An array of parameters to replace, i.e. ['short']
 * @param {string} message - The original message, i.e. "My string is __param__"
 * @returns {string} Message with values replaced "My string is short"
 */
export declare function replaceParams(params: unknown[], message: string): string;
/**
 * Return proper language Geoview localized values from map i18n instance
 *
 * @param {TypeDisplayLanguage} language - The language to get the message in
 * @param {string} messageKey - The localize key to read the message from
 * @param {unknown[] | undefined} params - An array of parameters to replace, i.e. ['short']
 * @returns {string} The translated message with values replaced
 */
export declare function getLocalizedMessage(language: TypeDisplayLanguage, messageKey: string, params?: unknown[] | undefined): string;
/**
 * Deep merge objects togheter. Latest object will overwrite value on previous one
 * if property exist.
 *
 * @param {TypeJsonObject} objects - The objects to deep merge
 * @returns {TypeJsonObject} The merged object
 */
export declare function deepMergeObjects(...objects: TypeJsonObject[]): TypeJsonObject;
/**
 * Check if an object is empty
 * @param {object} obj - The object to test
 * @returns true if the object is empty, false otherwise
 */
export declare function isObjectEmpty(obj: object): boolean;
/**
 * Get the URL of main script cgpv-main so we can access the assets
 * @returns {string} The URL of the main script
 */
export declare function getScriptAndAssetURL(): string;
/**
 * Generates a unique id of the specified length.
 * @param {8 | 18 | 36} length - Number of characters to return.
 * @returns {string} The id.
 */
export declare function generateId(length?: 8 | 18 | 36): string;
/**
 * Validates the GeoCore UUIDs.
 * @param {string} uuid The UUID to validate.
 * @returns {boolean} Returns true if the UUID respect the format.
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * Set alpha for a color
 * @param {number[]} colorArray - The array of color numbers
 * @param {number} alpha - The new alpha
 *
 * @returns {number[]} the color with the alpha set
 */
export declare function setAlphaColor(colorArray: number[], alpha: number): number[];
/**
 * Validates if a JSON string is well formatted
 * @param {string} str - The string to test
 * @returns {bollean} true if the JSON is valid, false otherwise
 */
export declare function isJsonString(str: string): boolean;
/**
 * Converts an XML document object into a json object
 * @param {Document | Node | Element} xml - The XML document object
 * @returns The converted json object
 */
export declare function xmlToJson(xml: Document | Node | Element): any;
/**
 * Execute a XMLHttpRequest
 * @param {string} url - The url to request
 * @returns {Promise<string>} The return value, return is '{}' if request failed
 * @deprecated Use the core/utils/fetch-helper.ts/Fetch functions instead
 */
export declare function getXMLHttpRequest(url: string): Promise<string>;
/**
 * Add a UI component to a custom div. Do not listen to event from here, pass in the props
 *
 * @param {string} targetDivId - The div id to insert the component in
 * @param {React.ReactElement} component - The UI react component
 *
 * @return {Root} the React root element
 */
export declare function addUiComponent(targetDivId: string, component: React.ReactElement): Root;
/**
 * Sanitize HTML to remove threat
 *
 * @param {string} contentHtml - HTML content to sanitize
 * @returns {string} Sanitized HTML or empty string if all dirty
 */
export declare function sanitizeHtmlContent(contentHtml: string): string;
/**
 * Removes comments from JSON config
 *
 * @param {string} config Map config to clean
 * @returns {string} cleaned config object
 */
export declare function removeCommentsFromJSON(config: string): string;
/**
 * Parses JSON config
 *
 * @param {string} configObjStr - Map config to parse
 * @returns {unknown} Cleaned and parsed config object
 */
export declare function parseJSONConfig(configObjStr: string): unknown;
/**
/**
 * Export the image data url as a PNG
 * @param {string} dataUrl - The data Url to be downloaded as png.
 * @param {string} name - The name of exported file
 */
export declare function exportPNG(dataUrl: string, name: string): void;
/**
 * Find an object property by regex values. The find is case insensitive.
 * @param {TypeJsonObject} objectItem - The object item
 * @param {RegExp | RegExp[]} regex - The regex value or the regex sequence to search
 * @returns {TypeJsonObject | undefined} The object if it exist or undefined
 */
export declare const findPropertyNameByRegex: (objectItem: TypeJsonObject, regex: RegExp | RegExp[]) => TypeJsonObject | undefined;
/**
 * Check string to see if it is an image
 *
 * @param {string} item - The item to validate
 * @returns {boolean} true if it is an image, false otherwise
 */
export declare function isImage(item: string): boolean;
/**
 * Checks object to see if it can be converted to a string; if not, returns an empty string
 *
 * @param {unknown} str - The unknown object to stringify
 * @return {unknown | string} Returns the original object if it can be converted to a string; '' otherwise
 */
export declare function stringify(str: unknown): unknown | string;
/**
 * This generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 * @param {function} checkCallback - The function executed to verify a particular condition until it's passed
 * @param {function} doCallback - The function executed when checkCallback returns true or some object
 * @param {function} failCallback - The function executed when checkCallback has failed for too long (went over the timeout)
 * @param {number} timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param {number} checkFrequency - The frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
 */
export declare function whenThisThenThat<T>(checkCallback: () => T, doCallback: (value: T) => void, failCallback: (reason?: unknown) => void, timeout?: number, checkFrequency?: number): void;
/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 * @param {function} checkCallback - The function executed to verify a particular condition until it's passed
 * @param {number} timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param {number} checkFrequency - The frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 */
export declare function whenThisThen<T>(checkCallback: () => T, timeout?: number, checkFrequency?: number): Promise<T>;
/**
 * Delay helper function.
 * @param {number} ms - The number of milliseconds to wait for.
 * @returns {Promise<void>} Promise which resolves when the delay timeout expires.
 */
export declare const delay: (ms: number) => Promise<void>;
/**
 * Escape special characters from string
 * @param {string} text - The text to escape
 * @returns {string} Espaced string
 */
export declare function escapeRegExp(text: string): string;
/**
 * Create guide object from .md file.
 * @param {string} mapId - ID of map.
 * @param {TypeDisplayLanguage} language - Language to use for guide.
 * @returns {Promise<TypeGuideObject | undefined>} The guide object
 */
export declare function createGuideObject(mapId: string, language: TypeDisplayLanguage, assetsURL: string): Promise<TypeGuideObject | undefined>;
/**
 * Callback function which is fired when keyboard key is pressed.
 * @param {string} key - The keyboard key pressed by user.
 * @param {string} callbackId - The Id of element which init the focus trap.
 * @param {boolean} isFocusTrapped - Component is focus trapped enabled.
 * @param {Function} cb - The callback function to be fired, if needed.
 */
export declare function handleEscapeKey(key: string, callbackId: string, isFocusTrapped?: boolean, cb?: () => void): void;
/**
 * Check if elemetn is in viewport
 * @param {Element} el - The element to check for
 * @returns {Boolean} true if visible, false otherwise
 */
export declare function isElementInViewport(el: Element): boolean;
