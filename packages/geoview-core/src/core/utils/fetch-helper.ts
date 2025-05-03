import { delay, xmlToJson } from '@/core/utils/utilities';
import {
  ResponseEmptyError,
  ResponseError,
  RequestAbortedError,
  RequestTimeoutError,
  ResponseTypeError,
} from '@/core/exceptions/core-exceptions';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { logger } from '@/core/utils/logger';

export class Fetch {
  /**
   * Fetches a url for a json response.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @param {number?} delayMs - The option delay before performing the actual fetch command (mostly for testing purposes).
   * @returns {Promise<TypeJsonObject>} The fetched json response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchJson(url: string, init?: RequestInit, timeoutMs?: number, delayMs?: number): Promise<TypeJsonObject | TypeJsonArray> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      timeoutId = timeoutController.timeoutId;
    }

    // Merge the abort signals to support the optional original abort controller and the optional timeout one
    const combinedSignal = Fetch.#mergeAbortSignals([originalSignal, timeoutSignal]);

    try {
      // If there's a delay before doing the actual fetch
      if (delayMs) await delay(delayMs);

      // Query and read
      const response = await fetch(url, {
        ...init,
        signal: combinedSignal,
      });

      // Validate response
      if (!response.ok) throw new ResponseError(response);

      // Get the json body of the response
      const responseJson = await response.json();

      // Check if the response is not an empty object
      if (responseJson.constructor === Object && Object.keys(responseJson).length > 0) {
        // Return the value
        return responseJson as TypeJsonObject;
      }

      // Check if the response is not an empty array
      if (Array.isArray(responseJson) && responseJson.length > 0) {
        // Return the value
        return responseJson as TypeJsonArray;
      }

      // Throw empty response error
      throw new ResponseEmptyError();
    } catch (error) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout if any, we're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches a url for a json response in the form of an object (not an array).
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @returns {Promise<T>} The fetched json response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {ResponseTypeError} If the response from the service is an array instead of an object.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchJsonAsObject(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonObject> {
    // Redirect
    const result = await this.fetchJson(url, init, timeoutMs);

    // Validate the result of the fetch is indeed a Json object and not a Json array
    if (Array.isArray(result)) {
      throw new ResponseTypeError('object', result);
    }

    // Return the validated TypeJsonObject
    return result as TypeJsonObject;
  }

  /**
   * Fetches a url for a json response in the form of an array (not an object).
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @returns {Promise<T>} The fetched json response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {ResponseTypeError} If the response from the service is an object instead of an array.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchJsonAsArray(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonArray> {
    // Redirect
    const result = await this.fetchJson(url, init, timeoutMs);

    // Validate the result of the fetch is indeed a Json array and not a Json object
    if (!Array.isArray(result)) {
      throw new ResponseTypeError('array', result);
    }

    // Return the validated TypeJsonArray
    return result as TypeJsonArray;
  }

  /**
   * Fetches a url for a json response and casts the json as 'T'. It doesn't validate the Json structure. It's up to the caller to do so.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @returns {Promise<T>} The fetched json response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   */
  static fetchJsonAs<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    // Redirect
    return Fetch.fetchJson(url, init, timeoutMs) as Promise<T>;
  }

  /**
   * Fetches a url for a text response.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @returns {Promise<TypeJsonObject>} The fetched text response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchText(url: string, init?: RequestInit, timeoutMs?: number): Promise<string> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      timeoutId = timeoutController.timeoutId;
    }

    // Merge the abort signals to support the optional original abort controller and the optional timeout one
    const combinedSignal = Fetch.#mergeAbortSignals([originalSignal, timeoutSignal]);

    try {
      // Query and read
      const response = await fetch(url, {
        ...init,
        signal: combinedSignal,
      });

      // Validate response
      if (!response.ok) throw new ResponseError(response);

      // Get the text body of the response
      const responseText = await response.text();

      // If data in the response
      if (responseText.trim() !== '') {
        // Return the text content
        return responseText;
      }

      // Throw empty response error
      throw new ResponseEmptyError();
    } catch (error) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout if any, we're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches a url for a blob response.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @returns {Promise<Blob>} The fetched blob response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchBlob(url: string, init?: RequestInit, timeoutMs?: number): Promise<Blob> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: NodeJS.Timeout | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      timeoutId = timeoutController.timeoutId;
    }

    // Merge the abort signals to support the optional original abort controller and the optional timeout one
    const combinedSignal = Fetch.#mergeAbortSignals([originalSignal, timeoutSignal]);

    try {
      // Query and read
      const response = await fetch(url, {
        ...init,
        signal: combinedSignal,
      });

      // Validate response
      if (!response.ok) throw new ResponseError(response);

      // Get the blob of the response
      return await response.blob();
    } catch (error) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout if any, we're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches a url for a xml response then converts the response to a json response.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
   * @returns {Promise<TypeJsonObject>} The fetched json response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchXMLToJson(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonObject> {
    // Fetch the text
    const text = await Fetch.fetchText(url, init, timeoutMs);

    // Parse the text/xml to DOM
    const xmlDOMCapabilities = new DOMParser().parseFromString(text, 'text/xml');

    // Parse it using xmlToJson
    const responseJson = xmlToJson(xmlDOMCapabilities);

    // Check if the response is not an empty object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((responseJson as any).constructor === Object && Object.keys(responseJson as any).length > 0) {
      // Return the value
      return responseJson;
    }

    // Throw empty response error
    throw new ResponseEmptyError();
  }

  /**
   * Performs a fetch request with timeout capability
   * @template T - The expected type of the JSON response
   * @param {string} url - The URL to fetch from
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @param {number?} timeoutMs - Timeout in milliseconds before the request is aborted, defaults to 7 seconds
   * @returns {Promise<T>} A promise that resolves with the parsed JSON response
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   *
   * @example
   * try {
   *   const data = await fetchWithTimeout<MyDataType>('https://api.example.com/data', {
   *     method: 'POST',
   *     body: JSON.stringify({ id: 123 })
   *   }, 3000);
   */
  static fetchWithTimeout<T>(url: string, init?: RequestInit, timeoutMs: number = 7000): Promise<T> {
    // Redirect
    return Fetch.fetchJsonAs<T>(url, init, timeoutMs);
  }

  /**
   * Merges multiple AbortSignals into a single signal that aborts if any input signal aborts.
   * @param signals - An array of AbortSignal objects to merge.
   * @returns A new AbortSignal that aborts if any input signal aborts.
   * @private
   */
  static #mergeAbortSignals(signals: (AbortSignal | undefined)[]): AbortSignal {
    // Our managed AbortController
    const controller = new AbortController();

    for (const signal of signals) {
      // If there's a signal
      if (signal) {
        // If the signal is already aborted
        if (signal.aborted) {
          // Abort right away
          controller.abort();
          break;
        } else {
          // Wire a lister to the signal abort to abort our own
          signal.addEventListener('abort', () => controller.abort(), { once: true });
        }
      }
    }

    // Return the controller signal
    return controller.signal;
  }

  /**
   * Creates an AbortController that aborts after a given timeout.
   * @param timeoutMs - Timeout in milliseconds.
   * @returns An object with the AbortController and the timeout ID (for cleanup).
   * @private
   */
  static #createTimeoutAbortController(timeoutMs: number): {
    controller: AbortController;
    timeoutId: NodeJS.Timeout;
  } {
    // Create the abort controller
    const controller = new AbortController();
    // Prepare the timer to abort after the delay
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Return the controller and its timeout id
    return { controller, timeoutId };
  }

  /**
   * Handles errors from a fetch-like operation that may have been aborted due to a timeout or an original (external) signal.
   * This method inspects which signal caused the abort and throws an appropriate typed error:
   * - `RequestTimeoutError` if the operation was cancelled due to a timeout.
   * - `RequestAbortedError` if it was aborted by an external (user-provided) signal.
   * @param {AbortSignal | undefined} originalSignal - The external abort signal passed by the caller (e.g. user cancellation).
   * @param {AbortSignal | undefined} timeoutSignal - The internal abort signal used for enforcing a timeout.
   * @param {number | undefined} timeoutMs - The timeout duration used for the operation (required for timeout error reporting).
   * @throws {RequestTimeoutError} If the request was aborted due to timeout.
   * @throws {RequestAbortedError} If the request was aborted by the caller's signal.
   * @throws {unknown} Rethrows the original error if it was not due to cancellation.
   * @private
   */
  static #throwWhatWeKnow(
    originalSignal: AbortSignal | undefined,
    timeoutSignal: AbortSignal | undefined,
    timeoutMs: number | undefined
  ): void {
    // If the timeout signal caused the abort (and not the user-provided signal)
    if (timeoutSignal?.aborted && !originalSignal?.aborted) {
      throw new RequestTimeoutError(timeoutMs!);
    }

    // If the original signal caused the abort
    if (originalSignal?.aborted) {
      throw new RequestAbortedError(originalSignal);
    }
  }

  /**
   * Tests different fetch situations to explain how to use fetching functions with combination of AbortControllers and/or timeouts.
   */
  static testJson(url: string): void {
    //
    // Option A) Regular fetchJson call
    //

    // Regular fetch
    Fetch.fetchJson(url)
      .then((result) => {
        logger.logDebug('FETCH TEST OPTION A GOOD', result);
      })
      .catch((error) => {
        logger.logError("FETCH TEST OPTION A SHOULDN'T LOG", error);
      });

    //
    // Option B) fetchJson call which is aborted
    //

    // Create a controller that will abort after 1 second
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);

    // Fetch a Json and delay it by 2 seconds so the abort has time to happen in (simulate)
    Fetch.fetchJson(url, { signal: controller.signal }, undefined, 2000)
      .then((result) => {
        logger.logDebug("FETCH TEST OPTION B SHOULDN'T LOG", result);
      })
      .catch((error) => {
        logger.logError('FETCH TEST OPTION B GOOD', error);
      });

    //
    // Option C) fetchJson call which timeouts
    //

    // Fetch a Json and timeout immediately, not giving any chance with 1 millisecond
    Fetch.fetchJson(url, undefined, 1)
      .then((result) => {
        logger.logDebug("FETCH TEST OPTION C SHOULDN'T LOG", result);
      })
      .catch((error) => {
        logger.logError('FETCH TEST OPTION C GOOD', error);
      });

    //
    // Option D) fetchJson call with both an exising abort signal (that's not aborting) and a timeout (which timeouts)
    //

    // Create a controller that won't abort
    const controller2 = new AbortController();

    // Fetch a Json and timeout immediately, not giving any chance with 1 millisecond
    Fetch.fetchJson(url, { signal: controller2.signal }, 1)
      .then((result) => {
        logger.logDebug("FETCH TEST OPTION D SHOULDN'T LOG", result);
      })
      .catch((error) => {
        logger.logError('FETCH TEST OPTION D GOOD', error);
      });

    //
    // Option E) fetchJson call with both an exising abort signal (which aborts) and a timeout (which doesn't timeout)
    //

    // Create a controller that will abort after 1 second
    const controller3 = new AbortController();
    setTimeout(() => controller3.abort(), 1000);

    // Fetch a Json and delay it by 2 seconds so the abort has time to kick in (simulate) and a long timeout (20 seconds is enough)
    Fetch.fetchJson(url, { signal: controller3.signal }, 20000, 2000)
      .then((result) => {
        logger.logDebug("FETCH TEST OPTION E SHOULDN'T LOG", result);
      })
      .catch((error) => {
        logger.logError('FETCH TEST OPTION E GOOD', error);
      });
  }
}
