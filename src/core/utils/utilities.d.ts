import { MutableRefObject } from 'react';
import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer } from '../../app';
import { TypeLocalizedString } from '../../geo/map/map-schema-types';
import { TypeJsonObject } from '../types/global-types';
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
 * Display a message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function showMessage(mapId: string, message: string): void;
/**
 * Display an success message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function showSuccess(mapId: string, message: string): void;
/**
 * Display an warning message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function showWarning(mapId: string, message: string): void;
/**
 * Display an error message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export declare function showError(mapId: string, message: string): void;
/**
 * Generate a unique id if an id was not provided
 * @param {string} id an id to return if it was already passed
 * @returns {string} the generated id
 */
export declare function generateId(id?: string | null): string;
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
 */
export declare function addUiComponent(targetDivId: string, component: React.ReactElement): void;
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
 * Export the map as a PNG
 * @param {string} mapId Id of map to export
 */
export declare function exportPNG(mapId: string): void;
/**
 * Disable scrolling, so that screen doesnt scroll down.
 *  when focus is set to map and
 * arrows and enter keys are used to navigate the map
 * @param {KeyboardEvent} e - keybaord event like, tab, space
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
