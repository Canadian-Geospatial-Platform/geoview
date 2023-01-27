/// <reference types="react" />
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
 * Export the map as a PNG
 * @param {string} mapId Id of map to export
 */
export declare function exportPNG(mapId: string): void;
