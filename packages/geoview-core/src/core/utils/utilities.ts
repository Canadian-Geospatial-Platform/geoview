import { MutableRefObject } from 'react';
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import ReactDOM from 'react-dom';

import { Extent } from 'ol/extent';

import sanitizeHtml from 'sanitize-html';

import { AbstractGeoViewLayer, api } from '../../app';
import { TypeLocalizedString } from '../../geo/map/map-schema-types';
import { EVENT_NAMES } from '@/api/events/event-types';

import { Cast, TypeJsonArray, TypeJsonObject, TypeJsonValue } from '../types/global-types';
import { snackbarMessagePayload } from '@/api/events/payloads/snackbar-message-payload';

/**
 * Get the string associated to the current display language.
 *
 * @param {TypeLocalizedString} localizedString the localized string to process.
 * @param {string} mapId the map identifier that holds the localized string.
 *
 * @returns {string} The string value according to the map display language,
 */
export function getLocalizedValue(localizedString: TypeLocalizedString | undefined, mapId: string): string | undefined {
  if (localizedString) return localizedString[api.map(mapId).displayLanguage];
  return undefined;
}

/**
 * Reusable utility function to send event to display a message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
function _showSnackbarMessage(mapId: string, type: string, message: string, options?: TypeJsonObject) {
  api.event.emit(
    snackbarMessagePayload(
      EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN,
      mapId,
      {
        type,
        value: message,
      },
      options
    )
  );
}

/**
 * Display a message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export function showMessage(mapId: string, message: string) {
  // Redirect
  _showSnackbarMessage(mapId, 'string', message);
}

/**
 * Display an success message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export function showSuccess(mapId: string, message: string) {
  // Redirect
  _showSnackbarMessage(mapId, 'string', message, {
    variant: 'success',
  } as unknown as TypeJsonObject);
}

/**
 * Display an warning message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export function showWarning(mapId: string, message: string) {
  // Redirect
  _showSnackbarMessage(mapId, 'string', message, {
    variant: 'warning',
  } as unknown as TypeJsonObject);
}

/**
 * Display an error message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export function showError(mapId: string, message: string) {
  // Redirect
  _showSnackbarMessage(mapId, 'string', message, {
    variant: 'error',
  } as unknown as TypeJsonObject);
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
    console.log('- Invalid JSON string. String passed to the JSON parser:');
    console.log(str);
    console.log('- JSON Parser error:', (e as { message: string }).message);
    console.log('- See text above.');
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
 */
export function addUiComponent(targetDivId: string, component: React.ReactElement) {
  ReactDOM.render(component, document.getElementById(targetDivId));
}

/**
 * Sanitize HTML to remove threat
 *
 * @param {string} contentHtml HTML content to sanitize
 * @returns {string} sanitze HTLM or empty string if all dirty
 */
export function sanitizeHtmlContent(contentHtml: string) {
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
export function parseJSONConfig(configObjStr: string): any {
  return JSON.parse(
    configObjStr
      // remove CR and LF from the map config
      .replace(/(\r\n|\n|\r)/gm, '')
      // replace apostrophes not preceded by a backslash with quotes
      .replace(/(?<!\\)'/gm, '"')
      // replace apostrophes preceded by a backslash with a single apostrophe
      .replace(/\\'/gm, "'")
  );
}

/**
 * Export the map as a PNG
 * @param {string} mapId Id of map to export
 */
export function exportPNG(mapId: string): void {
  document.body.style.cursor = 'progress';
  const { map } = api.map(mapId);

  map.once('rendercomplete', () => {
    const mapCanvas = document.createElement('canvas');
    const size = map.getSize();
    // eslint-disable-next-line prefer-destructuring
    mapCanvas.width = size![0];
    // eslint-disable-next-line prefer-destructuring
    mapCanvas.height = size![1];
    const mapContext = mapCanvas.getContext('2d');
    Array.prototype.forEach.call(map.getViewport().querySelectorAll('.ol-layer canvas, canvas.ol-layer'), (canvas) => {
      if (canvas.width > 0) {
        const opacity = canvas.parentNode.style.opacity || canvas.style.opacity;
        mapContext!.globalAlpha = opacity === '' ? 1 : Number(opacity);
        let matrix;
        const { transform } = canvas.style;

        if (transform) {
          // Get the transform parameters from the style's transform matrix
          matrix = transform
            .match(/^matrix\(([^(]*)\)$/)[1]
            .split(',')
            .map(Number);
        } else {
          matrix = [parseFloat(canvas.style.width) / canvas.width, 0, 0, parseFloat(canvas.style.height) / canvas.height, 0, 0];
        }

        // Apply the transform to the export map context
        CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix);
        const { backgroundColor } = canvas.parentNode.style;
        if (backgroundColor) {
          mapContext!.fillStyle = backgroundColor;
          mapContext!.fillRect(0, 0, canvas.width, canvas.height);
        }

        mapContext!.drawImage(canvas, 0, 0);
      }
    });

    mapContext!.globalAlpha = 1;
    mapContext!.setTransform(1, 0, 0, 1, 0, 0);

    try {
      const image = mapCanvas.toDataURL('image/png');
      const element = document.createElement('a');
      const filename = `${mapId}.png`;
      element.setAttribute('href', image);
      element.setAttribute('download', filename);
      element.click();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Error: ${err}`);
    }
  });
  document.body.style.cursor = 'auto';
  map.renderSync();
}

/**
 * Disable scrolling, so that screen doesnt scroll down.
 *  when focus is set to map and
 * arrows and enter keys are used to navigate the map
 * @param {KeyboardEvent} e - keybaord event like, tab, space
 * @param {MutableRefObject} elem - mutable reference object of html elements.
 */
export const disableScrolling = (e: KeyboardEvent, elem: MutableRefObject<HTMLElement | undefined>): void => {
  if (elem.current === document.activeElement) {
    if (e.code === 'Space') {
      e.preventDefault();
    }
  }
};

/**
 * Determine if layer instance is a vector layer
 *
 * @param {AbstractGeoViewLayer} layer the layer to check
 * @returns {boolean} true if layer is a vector layer
 */
export const isVectorLayer = (layer: AbstractGeoViewLayer): boolean => {
  const vectorLayers = { esriFeature: '', GeoJSON: '', GeoPackage: '', ogcFeature: '', ogcWfs: '' };
  return layer?.type in vectorLayers;
};

/**
 * Find an object property by regex value
 * @param {TypeJsonObject} objectItem the object item
 * @param {RegExp} regex the regex value to find
 * @returns {TypeJsonObject | undefined} the object if it exist or undefined
 */
export const findPropertyNameByRegex = (objectItem: TypeJsonObject, regex: RegExp): TypeJsonObject | undefined => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in objectItem) {
    if (key.match(regex)) {
      return objectItem[key] as TypeJsonObject;
    }
  }
  return undefined;
};

/**
 * Compare sets of extents of the same projection and return the smallest or largest set.
 * Extents must be in OpenLayers extent format - [minx, miny, maxx, maxy]
 *
 * @param {Extent} extentsA First set of extents
 * @param {Extent} extentsB Second set of extents
 * @param {string} minmax Decides whether to get smallest or largest extent
 * @returns {Extent} the smallest or largest set from the extents
 */
export function getMinOrMaxExtents(extentsA: Extent, extentsB: Extent, minmax = 'max'): Extent {
  let bounds: Extent = [];
  if (minmax === 'max')
    bounds = [
      Math.min(extentsA[0], extentsB[0]),
      Math.min(extentsA[1], extentsB[1]),
      Math.max(extentsA[2], extentsB[2]),
      Math.max(extentsA[3], extentsB[3]),
    ];
  else if (minmax === 'min')
    bounds = [
      Math.max(extentsA[0], extentsB[0]),
      Math.max(extentsA[1], extentsB[1]),
      Math.min(extentsA[2], extentsB[2]),
      Math.min(extentsA[3], extentsB[3]),
    ];
  return bounds;
}

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
 * @param checkCallback the function executed to verify a particular condition until it's passed
 * @param doCallback the function executed when checkCallback returns true or some object
 * @param failCallback the function executed when checkCallback has failed for too long (went over the timeout)
 * @param startDate the initial date this task was started
 * @param checkFrequency the frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
 * @param timeout the duration in milliseconds until the task is aborted
 */
function _whenThisThenThat<T>(
  checkCallback: () => T,
  doCallback: (value: T) => void,
  failCallback: (reason?: any) => void,
  startDate: Date,
  checkFrequency: number,
  timeout: number
) {
  // Check if we're good
  const v = checkCallback();
  if (v) {
    // Do that
    doCallback(v);
  } else if (new Date().getTime() - startDate.getTime() <= timeout) {
    // Check again later
    setTimeout(() => {
      // Recursive call
      _whenThisThenThat(checkCallback, doCallback, failCallback, startDate, checkFrequency, timeout);
    }, checkFrequency);
  } else {
    // Failed, took too long
    failCallback('Task abandonned, took too long.');
  }
}

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
export function whenThisThenThat<T>(
  checkCallback: () => T,
  doCallback: (value: T) => void,
  failCallback: (reason?: any) => void,
  checkFrequency?: number,
  timeout?: number
) {
  const startDate = new Date();
  if (!checkFrequency) checkFrequency = 100; // Check every 100 milliseconds by default
  if (!timeout) timeout = 10000; // Timeout after 10 seconds by default
  _whenThisThenThat(checkCallback, doCallback, failCallback, startDate, checkFrequency, timeout);
}

/**
 * This asynchronous generic function checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * This method returns a Promise which the developper can use to await or use .then().catch().finally() principles.
 * @param checkCallback the function executed to verify a particular condition until it's passed
 * @param checkFrequency the frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 * @param timeout the duration in milliseconds until the task is aborted (defaults to 10 seconds)
 */
export async function whenThisThenAsync<T>(checkCallback: () => T, checkFrequency?: number, timeout?: number) {
  return new Promise<T>((resolve, reject) => {
    // Redirect
    whenThisThenThat(checkCallback, resolve, reject, checkFrequency, timeout);
  });
}
