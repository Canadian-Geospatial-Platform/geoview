import { Root, createRoot } from 'react-dom/client';

import i18n from 'i18next';

import sanitizeHtml from 'sanitize-html';
import { TypeDisplayLanguage, TypeLocalizedString } from './config/types/map-schema-types';
import { logger } from './logger';
import { Cast, TypeJsonArray, TypeJsonObject, TypeJsonValue } from './config/types/config-types';
import { validateAgainstSchema } from './config/utils';
import { MAP_CONFIG_SCHEMA_PATH } from './config/types/config-constants';

/**
 * Create a localized string and set its "en" and "fr" properties to the same value.
 *
 * @param {TypeLocalizedString} localizedString the localized string to process.
 *
 * @returns {string} The string value according to the map display language,
 */
export function createLocalizedString(value: string): TypeLocalizedString {
  const localizedString: TypeLocalizedString = { en: value, fr: value };
  return localizedString;
}

/**
 * Get the string associated to the current display language for localized object type.
 *
 * @param {TypeLocalizedString} localizedString the localized string to process.
 *
 * @returns {string} The string value according to the map display language,
 */
export function getLocalizedValue(localizedString: TypeLocalizedString | undefined, language: TypeDisplayLanguage): string | undefined {
  if (localizedString) return localizedString[language];
  return undefined;
}

/**
 * Return proper language Geoview localized values from map i18n instance
 *
 * @param {string} mapId the map to get the i18n
 * @param {string} localizedKey localize key to get
 * @returns {string} message with values replaced
 */
export function getLocalizedMessage(localizedKey: string, language: TypeDisplayLanguage): string {
  const trans = i18n.getFixedT(language);
  return trans(localizedKey);
}

/**
 * Generate a unique id if an id was not provided
 * @param {string} id an id to return if it was already passed
 * @returns {string} the generated id
 */
export function generateId(id?: string | null): string {
  return id !== null && id !== undefined && id.length > 0
    ? id
    : (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
}

/**
 * Take string like "My string is __param__" and replace parameters (__param__) from array of values
 *
 * @param {TypeJsonValue[] | TypeJsonArray | string[]} params array of parameters to replace, i.e. ['short']
 * @param {string} message original message, i.e. "My string is __param__"
 * @returns {string} message with values replaced "My string is short"
 */
export function replaceParams(params: TypeJsonValue[] | TypeJsonArray | string[], message: string): string {
  let tmpMess = message;
  (params as string[]).forEach((item: string) => {
    tmpMess = tmpMess.replace('__param__', item);
  });

  return tmpMess;
}

/**
 * Set alpha for a color
 * @param {number[]} colorArray the array of color numbers
 * @param {number} alpha the new alpha
 *
 * @returns {number[]} the color with the alpha set
 */
export function setAlphaColor(colorArray: number[], alpha: number): number[] {
  const color = colorArray;
  color[3] = alpha;
  return color;
}

/**
 * Validate if a JSON string is well formatted
 * @param {string} str the string to test
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
 * Convert an XML document object into a json object
 *
 * @param {Document | Node | Element} xml the XML document object
 * @returns the converted json object
 */
export function xmlToJson(xml: Document | Node | Element): TypeJsonObject {
  // Create the return object
  let obj: TypeJsonObject | TypeJsonValue = {};

  // check for node type if it's an element, attribute, text, comment...
  if (xml.nodeType === 1) {
    // if it's an element, check the element's attributes to convert to json
    const element = Cast<Element>(xml);
    if (element.attributes) {
      if (element.attributes.length > 0) {
        obj['@attributes'] = {};
        for (let j = 0; j < element.attributes.length; j++) {
          const attribute = element.attributes.item(j);
          (obj['@attributes'][attribute!.nodeName] as string | null) = attribute!.nodeValue;
        }
      }
    }
  } else if (xml.nodeType === 3) {
    // text
    (obj as TypeJsonValue) = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const { nodeName } = item;
      const jsonObject = obj;
      if (jsonObject[nodeName] === undefined) {
        jsonObject[nodeName] = xmlToJson(item);
      } else {
        if (jsonObject[nodeName].push === undefined) {
          (jsonObject[nodeName] as TypeJsonArray) = [jsonObject[nodeName]];
        }
        (jsonObject[nodeName] as TypeJsonArray).push(xmlToJson(item));
      }
    }
  }

  return obj;
}

/**
 * Execute a XMLHttpRequest
 * @param {string} url the url to request
 * @returns {Promise<string>} the return value, return is '{}' if request failed
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
    } catch (error) {
      resolve('{}');
    }
  });

  return request;
}

/**
 * Add a UI component to a custom div. Do not listen to event from here, pass in the props
 *
 * @param {React.ReactElement} component the UI react component
 * @param {string} targetDivId the div id to insert the component in
 *
 * @return {Root} the React root element
 */
export function addUiComponent(targetDivId: string, component: React.ReactElement): Root {
  const root = createRoot(document.getElementById(targetDivId)!);
  root.render(component);

  return root;
}

/**
 * Sanitize HTML to remove threat
 *
 * @param {string} contentHtml HTML content to sanitize
 * @returns {string} sanitze HTLM or empty string if all dirty
 */
export function sanitizeHtmlContent(contentHtml: string): string {
  const clean = sanitizeHtml(contentHtml);
  return clean;
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
 * Parses JSON config
 *
 * @param {string} configObjStr Map config to parse
 * @returns {any} cleaned and parsed config object
 */
export function parseJSONConfig(configObjStr: string): TypeJsonObject {
  // remove CR and LF from the map config
  let jsonString = configObjStr.replace(/(\r\n|\n|\r)/gm, '');
  // replace apostrophes not preceded by a backslash with quotes
  jsonString = jsonString.replace(/(?<!\\)'/gm, '"');
  // replace apostrophes preceded by a backslash with a single apostrophe
  jsonString = jsonString.replace(/\\'/gm, "'");
  return JSON.parse(jsonString);
}

/**
 * Get a valid configuration from a string configuration
 *
 * @param {string} configString String configuration
 * @returns {TypeMapFeaturesConfig} A valid configuration object
 */
export function getValidConfigFromString(configString: string): TypeJsonObject {
  const configObjString = removeCommentsFromJSON(configString);
  const parsedMapConfig = parseJSONConfig(configObjString);
  // create a new config for this map element
  validateAgainstSchema(parsedMapConfig, MAP_CONFIG_SCHEMA_PATH);
  return parsedMapConfig;
}

/**
 * Export the image data url as a PNG
 * @param {string} datUrl the dataurl to be downloaded as png.
 * @param {string} name name of exported file
 */
export function exportPNG(dataUrl: string, name: string): void {
  try {
    const element = document.createElement('a');
    const filename = `${name}.png`;
    element.setAttribute('href', dataUrl);
    element.setAttribute('download', filename);
    element.click();
  } catch (error) {
    logger.logError(`Error trying to export PNG.`, error);
  }
}

/**
 * Find an object property by regex value
 * @param {TypeJsonObject} objectItem the object item
 * @param {RegExp} regex the regex value to find
 * @returns {TypeJsonObject | undefined} the object if it exist or undefined
 */
export const findPropertyNameByRegex = (objectItem: TypeJsonObject, regex: RegExp): TypeJsonObject | undefined => {
  const query = new RegExp(regex, 'i');
  const valueKey = Object.keys(objectItem).find((q) => {
    return query.test(q);
  });
  const valueObject = valueKey !== undefined ? objectItem[valueKey] : undefined;

  return valueObject;
};

/**
 * Check string to see if it is an image
 *
 * @param {string} item item to validate
 * @returns {boolean} true if it is an image, false otherwise
 */
export function isImage(item: string): boolean {
  return /^https:\/\/.+\.(jpg|jpeg|png|gif|bmp)$/.test(item);
}

/**
 * Checks object to see if it can be converted to a string; if not, returns an empty string
 *
 * @param {unknown} str
 * @return {unknown|String} returns the original object if it can be converted to a string; '' otherwise
 */
export function stringify(str: unknown): unknown | string {
  if (typeof str === 'undefined' || str === null) {
    return '';
  }

  return str;
}

/**
 * Internal function to work with async "whenThisThat"... methods.
 * This function is recursive and checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 * @param {function} checkCallback the function executed to verify a particular condition until it's passed
 * @param {function} doCallback the function executed when checkCallback returns true or some object
 * @param {function} failCallback the function executed when checkCallback has failed for too long (went over the timeout)
 * @param {Date} startDate the initial date this task was started
 * @param {number} timeout the duration in milliseconds until the task is aborted
 * @param {number} checkFrequency the frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
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
  // Check if we're good
  const v = checkCallback();
  if (v) {
    // Do that
    doCallback(v);
  } else if (new Date().getTime() - startDate.getTime() <= timeout) {
    // Check again later
    setTimeout(() => {
      // Recursive call
      _whenThisThenThat(checkCallback, doCallback, failCallback, startDate, timeout, checkFrequency);
    }, checkFrequency);
  } else {
    // Failed, took too long, this throws an exception in typical async/await contexts
    failCallback('Task abandonned, took too long.');
  }
}

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
export function whenThisThenThat<T>(
  checkCallback: () => T,
  doCallback: (value: T) => void,
  failCallback: (reason?: unknown) => void,
  timeout = 10000,
  checkFrequency = 100
): void {
  const startDate = new Date();
  _whenThisThenThat(checkCallback, doCallback, failCallback, startDate, timeout, checkFrequency);
}

/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 * @param checkCallback the function executed to verify a particular condition until it's passed
 * @param timeout the duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param checkFrequency the frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 */
export function whenThisThen<T>(checkCallback: () => T, timeout?: number, checkFrequency?: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Redirect
    whenThisThenThat(checkCallback, resolve, reject, timeout, checkFrequency);
  });
}

/**
 * Delay helper function.
 * @param ms number Number of milliseconds to wait for.
 * @returns Promise<void> resolves when the delay timeout expires.
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    // Wait
    setTimeout(resolve, ms);
  });
};

/**
 * Escape special characters from string
 * @param {string} text text to escape
 * @returns {string} espaced string
 */
export function escapeRegExp(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
