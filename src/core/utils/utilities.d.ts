/// <reference types="react" />
import { Root } from 'react-dom/client';
import { TypeDisplayLanguage, TypeLocalizedString } from '@config/types/map-schema-types';
import { TypeJsonArray, TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { TypeGuideObject } from '../stores/store-interface-and-intial-values/app-state';
/**
 * Create a localized string and set its "en" and "fr" properties to the same value.
 * @param {string | TypeJsonObject} value The value to assign to the en and fr properties.
 *
 * @returns {TypeLocalizedString} The localized (en/fr) object
 */
export declare function createLocalizedString(value: string | TypeJsonObject): TypeLocalizedString;
/**
 * Get the string associated to the current display language for localized object type.
 *
 * @param {TypeLocalizedString} localizedString the localized string to process.
 *
 * @returns {string} The string value according to the map display language,
 */
export declare function getLocalizedValue(localizedString: TypeLocalizedString | undefined, language: TypeDisplayLanguage): string | undefined;
/**
 * Return proper language Geoview localized values from map i18n instance
 *
 * @param {string} mapId the map to get the i18n
 * @param {string} localizedKey localize key to get
 * @returns {string} message with values replaced
 */
export declare function getLocalizedMessage(localizedKey: string, language: TypeDisplayLanguage): string;
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
 * @returns {string} the URL of the main script
 */
export declare function getScriptAndAssetURL(): string;
/**
 * Generate a unique id if an id was not provided
 * @param {string} id an id to return if it was already passed
 * @returns {string} the generated id
 */
export declare function generateId(id?: string | null): string;
/**
 * Take string like "My string is __param__" and replace parameters (__param__) from array of values
 *
 * @param {TypeJsonValue[] | TypeJsonArray | string[]} params array of parameters to replace, i.e. ['short']
 * @param {string} message original message, i.e. "My string is __param__"
 * @returns {string} message with values replaced "My string is short"
 */
export declare function replaceParams(params: TypeJsonValue[] | TypeJsonArray | string[], message: string): string;
/**
 * Set alpha for a color
 * @param {number[]} colorArray the array of color numbers
 * @param {number} alpha the new alpha
 *
 * @returns {number[]} the color with the alpha set
 */
export declare function setAlphaColor(colorArray: number[], alpha: number): number[];
/**
 * Validate if a JSON string is well formatted
 * @param {string} str the string to test
 * @returns {bollean} true if the JSON is valid, false otherwise
 */
export declare function isJsonString(str: string): boolean;
/**
 * Convert an XML document object into a json object
 *
 * @param {Document | Node | Element} xml the XML document object
 * @returns the converted json object
 */
export declare function xmlToJson(xml: Document | Node | Element): TypeJsonObject;
/**
 * Execute a XMLHttpRequest
 * @param {string} url the url to request
 * @returns {Promise<string>} the return value, return is '{}' if request failed
 */
export declare function getXMLHttpRequest(url: string): Promise<string>;
/**
 * Add a UI component to a custom div. Do not listen to event from here, pass in the props
 *
 * @param {React.ReactElement} component the UI react component
 * @param {string} targetDivId the div id to insert the component in
 *
 * @return {Root} the React root element
 */
export declare function addUiComponent(targetDivId: string, component: React.ReactElement): Root;
/**
 * Sanitize HTML to remove threat
 *
 * @param {string} contentHtml - HTML content to sanitize
 * @returns {string} sanitze HTLM or empty string if all dirty
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
 * @param {string} configObjStr Map config to parse
 * @returns {any} cleaned and parsed config object
 */
export declare function parseJSONConfig(configObjStr: string): unknown;
/**
/**
 * Export the image data url as a PNG
 * @param {string} datUrl the dataurl to be downloaded as png.
 * @param {string} name name of exported file
 */
export declare function exportPNG(dataUrl: string, name: string): void;
/**
 * Find an object property by regex values. The find is case insensitive.
 * @param {TypeJsonObject} objectItem the object item
 * @param {RegExp | RegExp[]} regex the regex value or the regex sequence to search
 * @returns {TypeJsonObject | undefined} the object if it exist or undefined
 */
export declare const findPropertyNameByRegex: (objectItem: TypeJsonObject, regex: RegExp | RegExp[]) => TypeJsonObject | undefined;
/**
 * Check string to see if it is an image
 *
 * @param {string} item item to validate
 * @returns {boolean} true if it is an image, false otherwise
 */
export declare function isImage(item: string): boolean;
/**
 * Checks object to see if it can be converted to a string; if not, returns an empty string
 *
 * @param {unknown} str
 * @return {unknown|String} returns the original object if it can be converted to a string; '' otherwise
 */
export declare function stringify(str: unknown): unknown | string;
/**
 * This generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 * @param {function} checkCallback the function executed to verify a particular condition until it's passed
 * @param {function} doCallback the function executed when checkCallback returns true or some object
 * @param {function} failCallback the function executed when checkCallback has failed for too long (went over the timeout)
 * @param {number} timeout the duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param {number} checkFrequency the frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
 */
export declare function whenThisThenThat<T>(checkCallback: () => T, doCallback: (value: T) => void, failCallback: (reason?: unknown) => void, timeout?: number, checkFrequency?: number): void;
/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 * @param checkCallback the function executed to verify a particular condition until it's passed
 * @param timeout the duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param checkFrequency the frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 */
export declare function whenThisThen<T>(checkCallback: () => T, timeout?: number, checkFrequency?: number): Promise<T>;
/**
 * Delay helper function.
 * @param ms number Number of milliseconds to wait for.
 * @returns Promise<void> resolves when the delay timeout expires.
 */
export declare const delay: (ms: number) => Promise<void>;
/**
 * Escape special characters from string
 * @param {string} text text to escape
 * @returns {string} espaced string
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
 * @param {string} key The keyboard key pressed by user.
 * @param {string} callbackId The Id of element which init the focus trap.
 * @param {boolean} isFocusTrapped Component is focus trapped enabled.
 * @param {Function} cb The callback function to be fired, if needed.
 */
export declare function handleEscapeKey(key: string, callbackId: string, isFocusTrapped?: boolean, cb?: () => void): void;
/**
 * Check if elemetn is in viewport
 * @param {Element} el - The element to check for
 * @returns {Boolean} true if visible, false otherwise
 */
export declare function isElementInViewport(el: Element): boolean;
