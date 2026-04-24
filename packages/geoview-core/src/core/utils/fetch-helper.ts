import { delay, parseXMLToJson, readTextWithBestEncoding } from '@/core/utils/utilities';
import {
  ResponseEmptyError,
  ResponseError,
  RequestAbortedError,
  RequestTimeoutError,
  ResponseContentError,
  ResponseTypeError,
  NetworkError,
} from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/** Result of a HEAD reachability check. */
export interface HeadResult {
  /** The HTTP response object, or null if the server could not be reached. */
  response: Response | null;
  /** The reason for the result: 'ok', 'cors', 'network', or 'timeout'. */
  reason: 'ok' | 'cors' | 'network' | 'timeout';
}

/** Provides static methods for performing HTTP fetch operations with timeout and abort support. */
export abstract class Fetch {
  /**
   * Fetches a url for a json response.
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @param delayMs - Optional delay before performing the actual fetch command (mostly for testing purposes)
   * @returns A promise that resolves with the fetched json response
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchJson<T>(url: string, init?: RequestInit, timeoutMs?: number, delayMs?: number): Promise<T> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      ({ timeoutId } = timeoutController);
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

      // Check if the response is an object with no properties (if it's an empty array, then, that's fine for the purposes here)
      if (responseJson === null || (responseJson.constructor === Object && Object.keys(responseJson).length === 0)) {
        // Throw empty response error
        throw new ResponseEmptyError();
      }

      // Return the value as Object
      return responseJson;
    } catch (error: unknown) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(error, originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout, if any. We're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches a url for a json response in the form of an object (not an array) and validates the response doesn't actually contain an error.
   *
   * This is useful when a service (e.g. ArcGIS Server) returns a 200 with a response error embedded within it.
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the fetched json response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {ResponseTypeError} When the response from the service is not an object
   * @throws {ResponseContentError} When the response actually contains an error within it
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchEsriJson<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    // Redirect
    const result = await this.fetchJson<T>(url, init, timeoutMs);

    // Check and throw exception if the content actually contains an embedded error
    // (ArcGIS Server returns 200 even an error happened)
    this.throwIfResponseHasEmbeddedError(result);

    // Return the validated object
    return result;
  }

  /**
   * Fetches a url for a json response in the form of an array (not an object).
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the fetched json response as an array
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {ResponseTypeError} When the response from the service is not an array
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchJsonAsArray<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T[]> {
    // Redirect
    const result = await this.fetchJson<T[]>(url, init, timeoutMs);

    // Validate the result of the fetch is indeed a Json array and not a Json object
    if (!Array.isArray(result)) {
      throw new ResponseTypeError('array', result);
    }

    // Return the validated array
    return result;
  }

  /**
   * Fetches a url for a text response.
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the fetched text response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the text response is empty
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchText(url: string, init?: RequestInit, timeoutMs?: number): Promise<string> {
    // Get the buffer array of the response
    const buffer = await Fetch.fetchArrayBuffer(url, init, timeoutMs);

    // Guess the best encoding and return the best text we can from the buffer
    const result = readTextWithBestEncoding(buffer);
    const responseText = result.text;

    // If data in the response
    if (responseText.trim() !== '') {
      // Return the text content
      return responseText;
    }

    // Throw empty response error
    throw new ResponseEmptyError();
  }

  /**
   * Fetches a url for an array buffer response.
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the fetched array buffer response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchArrayBuffer(url: string, init?: RequestInit, timeoutMs?: number): Promise<ArrayBuffer> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      ({ timeoutId } = timeoutController);
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
      return await response.arrayBuffer();
    } catch (error: unknown) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(error, originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout, if any. We're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches a blob from the given URL and attempts to read it as an image.
   *
   * Returns a base64-encoded string or ArrayBuffer depending on the file type.
   * Throws an error if the response contains XML (likely an error page).
   *
   * @param url - The URL to fetch the image blob from
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the image as a base64 string or ArrayBuffer, or null on failure
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseContentError} When the fetched blob is of type 'text/xml', indicating an unexpected server error
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchBlobImage(url: string, init?: RequestInit, timeoutMs?: number): Promise<string> {
    // Fetch the blob
    const blob = await Fetch.fetchBlob(url, init, timeoutMs);

    // If blob type is xml
    if (blob.type === 'text/xml') {
      // Throw an error
      throw new ResponseContentError(`Content contained unexpected XML data instead of image (${url}).`);
    }

    // Read the image file
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (error: unknown) => reject(error);
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Fetches a url for a blob response.
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the fetched blob response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchBlob(url: string, init?: RequestInit, timeoutMs?: number): Promise<Blob> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      ({ timeoutId } = timeoutController);
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
    } catch (error: unknown) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(error, originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout, if any. We're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetches a url for a xml response then converts the response to a json response.
   *
   * @param url - The url to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the fetched json response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchXMLToJson<T = Record<string, unknown>>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    // Fetch the text
    const text = await Fetch.fetchText(url, init, timeoutMs);

    // Parse it using xmlToJson
    const responseJson = parseXMLToJson(text);

    // Check if the response is not an empty object
    if (responseJson && typeof responseJson === 'object' && responseJson.constructor === Object && Object.keys(responseJson).length > 0) {
      // Return the value
      return responseJson as T;
    }

    // Throw empty response error
    throw new ResponseEmptyError();
  }

  /**
   * Fetches a URL and returns the response text regardless of the HTTP status code.
   *
   * Unlike `fetchText`, this method does **not** throw on non-2xx responses. This is useful
   * for probing OGC services that may return valid capabilities XML even with 4xx/5xx status codes.
   *
   * @param url - The URL to fetch
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError
   * @returns A promise that resolves with the response text (may be empty)
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {NetworkError} When a network issue happened
   */
  static async fetchTextPermissive(url: string, init?: RequestInit, timeoutMs?: number): Promise<string> {
    // The original signal if any
    const originalSignal = init?.signal || undefined;

    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      ({ timeoutId } = timeoutController);
    }

    // Merge the abort signals to support the optional original abort controller and the optional timeout one
    const combinedSignal = Fetch.#mergeAbortSignals([originalSignal, timeoutSignal]);

    try {
      // Query and read — intentionally not checking response.ok
      const response = await fetch(url, {
        ...init,
        signal: combinedSignal,
      });

      // Return the text regardless of HTTP status
      return await response.text();
    } catch (error: unknown) {
      // Throw the exceptions that we know
      Fetch.#throwWhatWeKnow(error, originalSignal, timeoutSignal, timeoutMs);

      // Throw anything else
      throw error;
    } finally {
      // Clear the timeout, if any. We're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Performs a HEAD request to check URL reachability without downloading the body.
   *
   * Returns a structured result indicating what happened:
   * - 'ok': Server responded (any HTTP status — it is alive).
   * - 'cors': Server is alive but blocks cross-origin requests.
   * - 'network': Server is truly unreachable (bad domain, DNS failure, etc.).
   * - 'timeout': Request timed out before server could respond.
   *
   * @param url - The URL to send the HEAD request to
   * @param timeoutMs - Optional timeout in milliseconds before aborting the request
   * @returns A promise that resolves with a structured result containing the response (if any) and a reason
   */
  static async fetchHeadWithTimeout(url: string, timeoutMs?: number): Promise<HeadResult> {
    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      ({ timeoutId } = timeoutController);
    }

    try {
      // Query
      const response = await fetch(url, { method: 'HEAD', signal: timeoutSignal });

      // Any HTTP response (even 404/500) means the server is alive
      return { response, reason: 'ok' };
    } catch (error: unknown) {
      // AbortController fired — timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { response: null, reason: 'timeout' };
      }

      // TypeError covers both CORS and true network failures.
      // Use a no-cors probe to distinguish: if the server responds (opaque), it is CORS.
      if (error instanceof TypeError) {
        try {
          const probe = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
          if (probe.type === 'opaque') {
            return { response: null, reason: 'cors' };
          }
          return { response: null, reason: 'network' };
        } catch {
          // no-cors probe also failed — server truly unreachable
          return { response: null, reason: 'network' };
        }
      }

      return { response: null, reason: 'network' };
    } finally {
      // Clear the timeout, if any. We're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Probes a file URL for reachability using a minimal GET request with a Range header.
   *
   * Uses `Range: bytes=0-0` to minimize data transfer and does not consume the response body.
   * Unlike `fetchHeadWithTimeout`, this uses GET because some file servers do not support HEAD.
   * Returns a structured result identical to `fetchHeadWithTimeout`.
   *
   * @param url - The URL to probe
   * @param timeoutMs - Optional timeout in milliseconds before aborting the request
   * @returns A promise that resolves with a structured result containing the response (if any) and a reason
   */
  static async fetchProbeUrl(url: string, timeoutMs?: number): Promise<HeadResult> {
    // If we want to use a timeout controller
    let timeoutSignal: AbortSignal | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (timeoutMs) {
      const timeoutController = Fetch.#createTimeoutAbortController(timeoutMs);
      timeoutSignal = timeoutController.controller.signal;
      ({ timeoutId } = timeoutController);
    }

    try {
      // Query with GET + Range header to minimize data transfer
      const response = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        signal: timeoutSignal,
      });

      // Any HTTP response (even 404/500) means the server is alive
      return { response, reason: 'ok' };
    } catch (error: unknown) {
      // AbortController fired — timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        return { response: null, reason: 'timeout' };
      }

      // TypeError covers both CORS and true network failures.
      // Use a no-cors probe to distinguish: if the server responds (opaque), it is CORS.
      if (error instanceof TypeError) {
        try {
          const probe = await fetch(url, { method: 'GET', mode: 'no-cors' });
          if (probe.type === 'opaque') {
            return { response: null, reason: 'cors' };
          }
          return { response: null, reason: 'network' };
        } catch {
          // no-cors probe also failed — server truly unreachable
          return { response: null, reason: 'network' };
        }
      }

      return { response: null, reason: 'network' };
    } finally {
      // Clear the timeout, if any. We're done
      clearTimeout(timeoutId);
    }
  }

  /**
   * Performs a fetch request with timeout capability.
   *
   * @template T - The expected type of the JSON response
   * @param url - The URL to fetch from
   * @param init - Optional initialization parameters for the fetch
   * @param timeoutMs - Optional timeout in milliseconds before the request is aborted (defaults to 7 seconds)
   * @returns A promise that resolves with the parsed JSON response
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {ResponseError} When the response is not OK (non-2xx)
   * @throws {ResponseEmptyError} When the JSON response is empty
   * @throws {NetworkError} When a network issue happened
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
    return Fetch.fetchJson<T>(url, init, timeoutMs);
  }

  /**
   * Throws an error if the provided response content contains an embedded error.
   *
   * Internally uses {@link Fetch.checkResponseForEmbeddedErrors} to validate the content.
   *
   * @param content - The content to inspect
   * @throws {ResponseContentError} When the response contains an embedded error
   */
  static throwIfResponseHasEmbeddedError(content: unknown): void {
    // Check for the response content
    const checked = Fetch.checkResponseForEmbeddedErrors(content);

    // If not valid, throw the error
    if (!checked.valid) throw new ResponseContentError(`${checked.code} | ${checked.error} | ${checked.details}`);
  }

  /**
   * Checks a JSON response for embedded error information.
   *
   * This function is useful when working with services which may return a 200 OK HTTP
   * status but still embed an error object in the response payload.
   *
   * @param content - The content response from the server (expecting a json, but can be text)
   * @returns An object describing whether the response is valid, and if not, includes error details
   */
  static checkResponseForEmbeddedErrors(content: unknown): VerifiedResponse {
    let valid: boolean = true;
    let code: number | undefined;
    let message: string | undefined;
    let details: string[] | undefined;
    let json = content;

    // If content is a string, try to read as JSON
    if (typeof content === 'string') {
      try {
        // Parse the string as JSON
        json = JSON.parse(content);
      } catch (error: unknown) {
        // Failed to parse it, return immediately as valid, don't mess with it
        logger.logWarning('Failed to parse the content as json when verifying for errors.', error);
        return { valid: true };
      }
    }

    // If there's an error property
    if (typeof json === 'object' && json !== null && 'error' in json) {
      // Error
      valid = false;
      message = 'Error found in the content';

      // Try to get the code
      if (typeof json.error === 'object' && json.error !== null) {
        if ('code' in json.error) {
          code = json.error.code as number;
        }
        // Try to get the message
        if ('message' in json.error) {
          message = json.error.message as string;
        }
        // Try to get the details
        if ('details' in json.error) {
          details = json.error.details as string[];
        }
      }
    }

    // Return the result of the validation of the content
    return { valid, code, error: message, details };
  }

  /**
   * Merges multiple AbortSignals into a single signal that aborts if any input signal aborts.
   *
   * @param signals - An array of AbortSignal objects to merge
   * @returns A new AbortSignal that aborts if any input signal aborts
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
   *
   * @param timeoutMs - Timeout in milliseconds
   * @returns An object with the AbortController and the timeout ID (for cleanup)
   */
  static #createTimeoutAbortController(timeoutMs: number): {
    controller: AbortController;
    timeoutId: ReturnType<typeof setTimeout>;
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
   *
   * This method inspects which signal caused the abort and throws an appropriate typed error:
   * - `RequestTimeoutError` if the operation was cancelled due to a timeout.
   * - `RequestAbortedError` if it was aborted by an external (user-provided) signal.
   * - `NetworkError` if it was a network related issue such as CORS.
   *
   * @param error - The caught error to inspect
   * @param originalSignal - The external abort signal passed by the caller (e.g. user cancellation)
   * @param timeoutSignal - The internal abort signal used for enforcing a timeout
   * @param timeoutMs - The timeout duration used for the operation (required for timeout error reporting)
   * @throws {RequestTimeoutError} When the request exceeds the timeout duration
   * @throws {RequestAbortedError} When the request was aborted by the caller's signal
   * @throws {NetworkError} When a network issue happened
   */
  static #throwWhatWeKnow(
    error: unknown,
    originalSignal: AbortSignal | undefined,
    timeoutSignal: AbortSignal | undefined,
    timeoutMs: number | undefined
  ): void {
    // If the original signal caused the abort
    if (originalSignal?.aborted) {
      throw new RequestAbortedError(originalSignal);
    }
    // If the timeout signal caused the abort
    if (timeoutSignal?.aborted) {
      throw new RequestTimeoutError(timeoutMs!);
    }

    // If the error is a TypeError, it's likely a network issue
    if (error instanceof TypeError) {
      // Likely a network or CORS error
      throw new NetworkError('Network or CORS error occurred.', 'ERR_NETWORK', error);
    }
  }

  // GV: Uncomment to test the fetch functions of this class
  // /**
  //  * Tests different fetch situations to explain how to use fetching functions with combination of AbortControllers and/or timeouts.
  //  */
  // static #testJson(url: string): void {
  //   //
  //   // Option A) Regular fetchJson call
  //   //

  //   // Regular fetch
  //   Fetch.fetchJson(url)
  //     .then((result) => {
  //       logger.logDebug('FETCH TEST OPTION A GOOD', result);
  //     })
  //     .catch((error: unknown) => {
  //       logger.logError("FETCH TEST OPTION A SHOULDN'T LOG", error);
  //     });

  //   //
  //   // Option B) fetchJson call which is aborted
  //   //

  //   // Create a controller that will abort after 1 second
  //   const controller = new AbortController();
  //   setTimeout(() => controller.abort(), 1000);

  //   // Fetch a Json and delay it by 2 seconds so the abort has time to happen in (simulate)
  //   Fetch.fetchJson(url, { signal: controller.signal }, undefined, 2000)
  //     .then((result) => {
  //       logger.logDebug("FETCH TEST OPTION B SHOULDN'T LOG", result);
  //     })
  //     .catch((error: unknown) => {
  //       logger.logError('FETCH TEST OPTION B GOOD', error);
  //     });

  //   //
  //   // Option C) fetchJson call which timeouts
  //   //

  //   // Fetch a Json and timeout immediately, not giving any chance with 1 millisecond
  //   Fetch.fetchJson(url, undefined, 1)
  //     .then((result) => {
  //       logger.logDebug("FETCH TEST OPTION C SHOULDN'T LOG", result);
  //     })
  //     .catch((error: unknown) => {
  //       logger.logError('FETCH TEST OPTION C GOOD', error);
  //     });

  //   //
  //   // Option D) fetchJson call with both an exising abort signal (that's not aborting) and a timeout (which timeouts)
  //   //

  //   // Create a controller that won't abort
  //   const controller2 = new AbortController();

  //   // Fetch a Json and timeout immediately, not giving any chance with 1 millisecond
  //   Fetch.fetchJson(url, { signal: controller2.signal }, 1)
  //     .then((result) => {
  //       logger.logDebug("FETCH TEST OPTION D SHOULDN'T LOG", result);
  //     })
  //     .catch((error: unknown) => {
  //       logger.logError('FETCH TEST OPTION D GOOD', error);
  //     });

  //   //
  //   // Option E) fetchJson call with both an exising abort signal (which aborts) and a timeout (which doesn't timeout)
  //   //

  //   // Create a controller that will abort after 1 second
  //   const controller3 = new AbortController();
  //   setTimeout(() => controller3.abort(), 1000);

  //   // Fetch a Json and delay it by 2 seconds so the abort has time to kick in (simulate) and a long timeout (20 seconds is enough)
  //   Fetch.fetchJson(url, { signal: controller3.signal }, 20000, 2000)
  //     .then((result) => {
  //       logger.logDebug("FETCH TEST OPTION E SHOULDN'T LOG", result);
  //     })
  //     .catch((error: unknown) => {
  //       logger.logError('FETCH TEST OPTION E GOOD', error);
  //     });
  // }
}

/** Result of checking a response for embedded errors. */
export type VerifiedResponse = { valid: boolean; code?: number; error?: string; details?: string[] };
