import { Cast, TypeJSONObject, TypeJSONValue } from '../types/cgpv-types';

/**
 * Generate a unique id if an id was not provided
 * @param {string} id an id to return if it was already passed
 * @returns {string} the generated id
 */
export function generateId(id?: string): string {
  return id !== null && id !== undefined && id.length > 0
    ? id
    : (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toUpperCase();
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
export function xmlToJson(xml: Document | Node | Element): TypeJSONObject | TypeJSONValue {
  // Create the return object
  let obj: TypeJSONObject | TypeJSONValue = {};

  // check for node type if it's an element, attribute, text, comment...
  if (xml.nodeType === 1) {
    // if it's an element, check the element's attributes to convert to json
    const element = Cast<Element>(xml);
    if (element.attributes) {
      if (element.attributes.length > 0) {
        obj['@attributes'] = {};
        // eslint-disable-next-line no-plusplus
        for (let j = 0; j < element.attributes.length; j++) {
          const attribute = element.attributes.item(j) as Node;
          (obj['@attributes'] as TypeJSONObject)[attribute.nodeName] = attribute.nodeValue as string;
        }
      }
    }
  } else if (xml.nodeType === 3) {
    // text
    obj = xml.nodeValue as string;
  }

  // do children
  if (xml.hasChildNodes()) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const { nodeName } = item;
      const jsonObject = obj as TypeJSONObject;
      if (typeof jsonObject[nodeName] === 'undefined') {
        jsonObject[nodeName] = xmlToJson(item);
      } else {
        if (typeof (jsonObject[nodeName] as TypeJSONValue[]).push === 'undefined') {
          jsonObject[nodeName] = [jsonObject[nodeName]];
        }
        (jsonObject[nodeName] as TypeJSONValue[]).push(xmlToJson(item));
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
