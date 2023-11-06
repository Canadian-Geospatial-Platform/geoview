import { MutableRefObject } from 'react';
import { Root } from 'react-dom/client';
import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer } from '@/app';
import { TypeLocalizedString } from '@/geo/map/map-schema-types';
import { TypeJsonArray, TypeJsonObject, TypeJsonValue, TypeMapFeaturesConfig } from '@/core/types/global-types';
/**
 * Get the string associated to the current display language.
 *
 * @param {TypeLocalizedString} localizedString the localized string to process.
 * @param {string} mapId the map identifier that holds the localized string.
 *
 * @returns {string} The string value according to the map display language,
 */
export declare function getLocalizedValue(localizedString: TypeLocalizedString | undefined, mapId: string): string | undefined;
/**
 * Generate a unique id if an id was not provided
 * @param {string} id an id to return if it was already passed
 * @returns {string} the generated id
 */
export declare function generateId(id?: string | null): string;
/**
 * Add a notification message
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function addNotificationMessage(mapId: string, message: string): void;
/**
 * Add a notification success
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function addNotificationSuccess(mapId: string, message: string): void;
/**
 * Add a notification warning
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function addNotificationWarning(mapId: string, message: string): void;
/**
 * Add a notification error
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function addNotificationError(mapId: string, message: string): void;
/**
 * Display a message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
 * @param {TypeJsonObject} button optional snackbar button
 */
export declare function showMessage(mapId: string, message: string, withNotification?: boolean, button?: {}): void;
/**
 * Display an success message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
 * @param {TypeJsonObject} button optional snackbar button
 */
export declare function showSuccess(mapId: string, message: string, withNotification?: boolean, button?: {}): void;
/**
 * Display an warning message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
 * @param {TypeJsonObject} button optional snackbar button
 */
export declare function showWarning(mapId: string, message: string, withNotification?: boolean, button?: {}): void;
/**
 * Display an error message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 * @param {string} withNotification optional, indicates if the message should also be added as a notification, default true
 * @param {TypeJsonObject} button optional snackbar button
 */
export declare function showError(mapId: string, message: string, withNotification?: boolean, button?: {}): void;
/**
 * Take string and replace parameters from array of values
 * @param {string[]} params array of parameters to replace
 * @param {string} message original message
 * @returns {string} message with values replaced
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
 * @param {string} contentHtml HTML content to sanitize
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
export declare function parseJSONConfig(configObjStr: string): any;
/**
 * Get a valid configuration from a string configuration
 *
 * @param {string} configString String configuration
 * @returns {TypeMapFeaturesConfig} A valid configuration object
 */
export declare function getValidConfigFromString(configString: string, mapDiv: HTMLElement): TypeMapFeaturesConfig;
/**
 * Export the map as a PNG
 * @param {string} mapId Id of map to export
 */
export declare function exportPNG(mapId: string): void;
/**
 * Disable scrolling on keydown space, so that screen doesnt scroll down.
 * when focus is set to map and arrows and enter keys are used to navigate the map
 * @param {KeyboardEvent} e - keyboard event like, tab, space
 * @param {MutableRefObject} elem - mutable reference object of html elements.
 */
export declare const disableScrolling: (e: KeyboardEvent, elem: MutableRefObject<HTMLElement | undefined>) => void;
/**
 * Determine if layer instance is a vector layer
 *
 * @param {AbstractGeoViewLayer} layer the layer to check
 * @returns {boolean} true if layer is a vector layer
 */
export declare const isVectorLayer: (layer: AbstractGeoViewLayer) => boolean;
/**
 * Find an object property by regex value
 * @param {TypeJsonObject} objectItem the object item
 * @param {RegExp} regex the regex value to find
 * @returns {TypeJsonObject | undefined} the object if it exist or undefined
 */
export declare const findPropertyNameByRegex: (objectItem: TypeJsonObject, regex: RegExp) => TypeJsonObject | undefined;
/**
 * Compare sets of extents of the same projection and return the smallest or largest set.
 * Extents must be in OpenLayers extent format - [minx, miny, maxx, maxy]
 *
 * @param {Extent} extentsA First set of extents
 * @param {Extent} extentsB Second set of extents
 * @param {string} minmax Decides whether to get smallest or largest extent
 * @returns {Extent} the smallest or largest set from the extents
 */
export declare function getMinOrMaxExtents(extentsA: Extent, extentsB: Extent, minmax?: string): Extent;
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
 * @param checkCallback the function executed to verify a particular condition until it's passed
 * @param doCallback the function executed when checkCallback returns true or some object
 * @param failCallback the function executed when checkCallback has failed for too long (went over the timeout)
 * @param checkFrequency the frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
 * @param timeout the duration in milliseconds until the task is aborted (defaults to 10 seconds)
 */
export declare function whenThisThenThat<T>(checkCallback: () => T, doCallback: (value: T) => void, failCallback: (reason?: any) => void, checkFrequency?: number, timeout?: number): void;
/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 * @param checkCallback the function executed to verify a particular condition until it's passed
 * @param checkFrequency the frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 * @param timeout the duration in milliseconds until the task is aborted (defaults to 10 seconds)
 */
export declare function whenThisThen<T>(checkCallback: () => T, checkFrequency?: number, timeout?: number): Promise<T>;
