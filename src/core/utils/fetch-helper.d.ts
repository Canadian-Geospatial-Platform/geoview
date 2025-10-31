export declare class Fetch {
    #private;
    /**
     * Fetches a url for a json response.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @param {number?} delayMs - The option delay before performing the actual fetch command (mostly for testing purposes).
     * @returns {Promise<T>} The fetched json response.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchJson<T>(url: string, init?: RequestInit, timeoutMs?: number, delayMs?: number): Promise<T>;
    /**
     * Fetches a url for a json response in the form of an object (not an array) and validates the response doesn't actually contain an error.
     * This is useful when a service (e.g. ArcGIS Server) returns a 200 with a response error embedded within it.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<T>} The fetched json response.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
     * @throws {ResponseTypeError} Errow thrown when the response from the service is not an object.
     * @throws {ResponseContentError} Error thrown when the response actually contains an error within it.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchEsriJson<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
    /**
     * Fetches a url for a json response in the form of an array (not an object).
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<T[]>} The fetched json response.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
     * @throws {ResponseTypeError} Error thrown when the response from the service is not an array.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchJsonAsArray<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T[]>;
    /**
     * Fetches a url for a text response.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<string>} The fetched text response.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchText(url: string, init?: RequestInit, timeoutMs?: number): Promise<string>;
    /**
     * Fetches a url for an array buffer response.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<ArrayBuffer>} The fetched array buffer response.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchArrayBuffer(url: string, init?: RequestInit, timeoutMs?: number): Promise<ArrayBuffer>;
    /**
     * Fetches a blob from the given URL and attempts to read it as an image.
     * Returns a base64-encoded string or ArrayBuffer depending on the file type.
     * Throws an error if the response contains XML (likely an error page).
     * @param {string} url - The URL to fetch the image blob from.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<string | ArrayBuffer | null>} The image as a base64 string or ArrayBuffer, or null on failure.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseContentError} Error thrown when the fetched blob is of type 'text/xml', indicating an unexpected server error.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchBlobImage(url: string, init?: RequestInit, timeoutMs?: number): Promise<string | ArrayBuffer | null>;
    /**
     * Fetches a url for a blob response.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<Blob>} The fetched blob response.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchBlob(url: string, init?: RequestInit, timeoutMs?: number): Promise<Blob>;
    /**
     * Fetches a url for a xml response then converts the response to a json response.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<T = Record<string, unknown>>} The fetched json response.
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     */
    static fetchXMLToJson<T = Record<string, unknown>>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
    /**
     * Performs a fetch request with timeout capability
     * @template T - The expected type of the JSON response
     * @param {string} url - The URL to fetch from
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - Timeout in milliseconds before the request is aborted, defaults to 7 seconds
     * @returns {Promise<T>} A promise that resolves with the parsed JSON response
     * @throws {RequestTimeoutError} Error thrown when the request exceeds the timeout duration.
     * @throws {RequestAbortedError} Error thrown when the request was aborted by the caller's signal.
     * @throws {ResponseError} Error thrown when the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} Error thrown when the JSON response is empty.
     * @throws {NetworkError} Errow thrown when a network issue happened.
     *
     * @example
     * try {
     *   const data = await fetchWithTimeout<MyDataType>('https://api.example.com/data', {
     *     method: 'POST',
     *     body: JSON.stringify({ id: 123 })
     *   }, 3000);
     */
    static fetchWithTimeout<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
    /**
     * Throws an error if the provided response content contains an embedded error.
     * Internally uses {@link Fetch.checkResponseForEmbeddedErrors} to validate the content.
     * @param {unknown} content - The content to inspect.
     * @throws {ResponseContentError} Error thrown when the response contains an embedded error.
     */
    static throwIfResponseHasEmbeddedError(content: unknown): void;
    /**
     * Checks a JSON response for embedded error information.
     * This function is useful when working services which may return a 200 OK HTTP
     * status but still embed an error object in the response payload.
     * @param {unknown} content - The content response from the server (expecting a json, but can be text).
     * @returns An object describing whether the response is valid, and if not, includes error details.
     */
    static checkResponseForEmbeddedErrors(content: unknown): VerifiedResponse;
}
export type VerifiedResponse = {
    valid: boolean;
    code?: number;
    error?: string;
    details?: string[];
};
//# sourceMappingURL=fetch-helper.d.ts.map