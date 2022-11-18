/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import ReactDOM from 'react-dom';

import sanitizeHtml from 'sanitize-html';

import { api } from '../../app';
import { TypeLocalizedString } from '../../geo/map/map-schema-types';
import { EVENT_NAMES } from '../../api/events/event-types';

import { Cast, TypeJsonArray, TypeJsonObject, TypeJsonValue } from '../types/global-types';
import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';

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
 * Display a message in the snackbar
 *
 * @param {string} mapId the map to show the message for
 * @param {string} message the message string
 */
export function showMessage(mapId: string, message: string) {
  api.event.emit(
    snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
      type: 'string',
      value: message,
    })
  );
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
  console.log(clean);
  return clean;
}
