import { Root, createRoot } from 'react-dom/client';
import sanitizeHtml from 'sanitize-html';

import { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { logger } from '@/core/utils/logger';
import i18n from '@/core/translation/i18n';
import { TypeGuideObject } from '@/core/stores/store-interface-and-intial-values/app-state';
import { Fetch } from '@/core/utils/fetch-helper';

/** The observers to monitor element removals from the DOM tree */
const observers: Record<string, MutationObserver> = {};

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
  // Create the return object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = {};

  // check for node type if it's an element, attribute, text, comment...
  if (xml.nodeType === 1) {
    // if it's an element, check the element's attributes to convert to json
    const element = xml as Element;
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
    obj = xml.nodeValue;
  }

  // do children
  if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const { nodeName } = item;
      if (obj[nodeName] === undefined) {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (obj[nodeName].push === undefined) {
          obj[nodeName] = [obj[nodeName]];
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }

  return obj;
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
 * Sanitize HTML to remove threat
 *
 * @param {string} contentHtml - HTML content to sanitize
 * @returns {string} Sanitized HTML or empty string if all dirty
 */
export function sanitizeHtmlContent(contentHtml: string): string {
  return sanitizeHtml(contentHtml);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeStringify(obj: any, space = 2): string {
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
 * @param {string} configObjStr - Map config to parse
 * @returns {unknown} Cleaned and parsed config object
 */
// TODO: refactor - yves, move this function to config class
export function parseJSONConfig(configObjStr: string): unknown {
  // remove CR and LF from the map config
  let jsonString = configObjStr.replace(/(\r\n|\n|\r)/gm, '');
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
export function exportImage(dataUrl: string, name: string, format: 'png' | 'jpeg' = 'png'): void {
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
 * @param {unknown} str - The unknown object to stringify
 * @return {unknown | string} Returns the original object if it can be converted to a string; '' otherwise
 */
export function stringify(str: unknown): unknown | string {
  if (typeof str === 'undefined' || str === null) {
    return '';
  }

  return str;
}

/**
 * Delay helper function.
 * @param {number} ms - The number of milliseconds to wait for.
 * @returns {Promise<void>} Promise which resolves when the delay timeout expires.
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    // Wait
    setTimeout(resolve, ms);
  });
};

/**
 * Repeatedly invokes a callback function at a given interval until it returns `true`.
 * Once the callback returns `true`, the interval is cleared and the polling stops.
 * @param {() => T} callback - A function that is called every `ms` milliseconds.
 *                                   If it returns `true`, the interval is cleared.
 * @param {number} ms - The interval time in milliseconds between callback executions.
 * @returns {NodeJS.Timeout} The interval timer ID, which can be used to clear the interval manually if needed.
 */
export const doUntil = <T>(callback: () => T, ms: number): NodeJS.Timeout => {
  // Start a recurrent timer
  let done = false;
  const interval = setInterval(() => {
    // If done, skip (protect against race conditions)
    if (done) return;

    // Callback
    const shouldStop = callback();

    // If clearing the interval
    if (shouldStop) {
      done = true;
      clearInterval(interval);
    }
  }, ms);

  // Return the interval timer
  return interval;
};

/**
 * Repeatedly invokes a callback function at a specified interval until one of two conditions is met:
 * - The callback function explicitly returns `true`, indicating the interval should be cleared.
 * - All provided promises have resolved or rejected.
 * This is useful for performing a recurring action (e.g., logging or polling) that can end either due to
 * external completion logic or once all promises are settled.
 * @param {() => T} callback - A function executed on each interval. If it returns `true`, the interval is cleared.
 * @param {Promise<unknown>[]} promises - An array of promises whose completion will also stop the interval.
 * @param {number} ms - The interval duration in milliseconds.
 * @returns {NodeJS.Timeout} The interval timer, which can be cleared manually if needed.
 */
export const doUntilPromises = <T>(callback: () => T, promises: Promise<unknown>[], ms: number): NodeJS.Timeout => {
  // Start a recurrent timer
  const interval = doUntil(callback, ms);

  // Disble eslint here, it should be caught by the creator of the promise
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  Promise.all(promises).finally(() => clearInterval(interval));

  // Return the interval timer
  return interval;
};

/**
 * Internal function to work with async "whenThisThat"... methods.
 * This function is recursive and checks for a validity of something via the checkCallback() until it's found or until the timer runs out.
 * When the check callback returns true (or some found object), the doCallback() function is called with the found information.
 * If checkCallback wasn't found and timer expired, the failCallback() function is called.
 * @param {function} checkCallback - The function executed to verify a particular condition until it's passed
 * @param {function} doCallback - The function executed when checkCallback returns true or some object
 * @param {function} failCallback - The function executed when checkCallback has failed for too long (went over the timeout)
 * @param {Date} startDate - The initial date this task was started
 * @param {number} timeout - The duration in milliseconds until the task is aborted
 * @param {number} checkFrequency - The frequency in milliseconds to callback for a check.
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

  // Check if we're good
  const v = checkCallback();

  // If check was positive
  if (v) {
    // Do that and we're done
    doCallback(v);
    return;
  }

  // If expired
  if (Date.now() - startDate.getTime() > timeout) {
    // Failed, took too long, this throws an exception in typical async/await contexts
    failCallback(`Task abandonned, took over ${timeout} ms to get anything.`);
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
 * @param {function} checkCallback - The function executed to verify a particular condition until it's passed
 * @param {function} doCallback - The function executed when checkCallback returns true or some object
 * @param {function} failCallback - The function executed when checkCallback has failed for too long (went over the timeout)
 * @param {number} timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param {number} checkFrequency - The frequency in milliseconds to callback for a check (defaults to 100 milliseconds)
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
 * @param {function} checkCallback - The function executed to verify a particular condition until it's passed
 * @param {number} timeout - The duration in milliseconds until the task is aborted (defaults to 10 seconds)
 * @param {number} checkFrequency - The frequency in milliseconds to check for an update (defaults to 100 milliseconds)
 */
export function whenThisThen<T>(checkCallback: () => T, timeout?: number, checkFrequency?: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // Redirect
    whenThisThenThat(checkCallback, resolve, reject, timeout, checkFrequency);
  });
}

/**
 * Escape special characters from string
 * @param {string} text - The text to escape
 * @returns {string} Espaced string
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
      }, 100);
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
