import { xmlToJson } from '@/core/utils/utilities';
import { ResponseEmptyError, ResponseError, RequestAbortedError, RequestTimeoutError } from '@/core/exceptions/core-exceptions';
import { TypeJsonObject } from '@/api/config/types/config-types';

export class Fetch {
  /**
   * Fetches a url for a json response.
   * If the response is empty, throws an EmptyResponseError.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @returns {Promise<TypeJsonObject>} The fetched json response.
   * @throws {ResponseError} If the response is not OK (non-2xx).
   * @throws {ResponseEmptyError} If the JSON response is empty.
   * @throws {RequestTimeoutError | RequestAbortedError} If the request was cancelled or timed out.
   * @throws {Error} For any other unexpected failures.
   */
  static async fetchJson(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonObject> {
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

      // Get the json body of the response
      const responseJson = await response.json();

      // Check if the response is not an empty object
      if (responseJson.constructor === Object && Object.keys(responseJson).length > 0) {
        // Return the value
        return responseJson as TypeJsonObject;
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
   * Fetches a url for a json response.
   * If the response is empty, throws an EmptyResponseError.
   * @param {string} url - The url to fetch.
   * @param {RequestInit?} init - The optional initialization parameters for the fetch.
   * @returns {Promise<T>} The fetched json response.
   */
  static async fetchJsonAs<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    // Redirect
    return (await Fetch.fetchJson(url, init, timeoutMs)) as T;
  }

  /**
   * Fetches a url for a text response.
   * If the response is empty, throws an EmptyResponseError.
   * @param {string} url - The url to fetch.
   * @returns {Promise<TypeJsonObject>} The fetched text response.
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
   * If the response is empty, throws an EmptyResponseError.
   * @param {string} url - The url to fetch.
   * @returns {Promise<Blob>} The fetched blob response.
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
   * If the response is empty, throws an EmptyResponseError.
   * @param {string} url - The url to fetch.
   * @returns {Promise<TypeJsonObject>} The fetched json response.
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
   * @param {RequestInit} [options={}] - Fetch options to be passed to the fetch call
   * @param {number} [timeoutMs=7000] - Timeout in milliseconds before the request is aborted
   * @returns {Promise<T>} A promise that resolves with the parsed JSON response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {Error} When the response is not OK (status outside 200-299)
   *
   * @example
   * try {
   *   const data = await fetchWithTimeout<MyDataType>('https://api.example.com/data', {
   *     method: 'POST',
   *     body: JSON.stringify({ id: 123 })
   *   }, 3000);
   */
  static fetchWithTimeout<T>(url: string, options: RequestInit = {}, timeoutMs: number = 7000): Promise<T> {
    // Redirect
    return Fetch.fetchJsonAs<T>(url, options, timeoutMs);
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
          // Aboert right away
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
}
