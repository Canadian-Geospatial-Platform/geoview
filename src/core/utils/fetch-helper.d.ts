import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
export declare class Fetch {
    #private;
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
    static fetchJson(url: string, init?: RequestInit, timeoutMs?: number, delayMs?: number): Promise<TypeJsonObject | TypeJsonArray>;
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
    static fetchJsonAsObject(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonObject>;
    /**
     * Fetches a url for a json response in the form of an object (not an array) and validates the response doesn't actually contain an error.
     * This is useful when a service (e.g. ArcGIS Server) returns a 200 with a response error embedded within it.
     * @param {string} url - The url to fetch.
     * @param {RequestInit?} init - The optional initialization parameters for the fetch.
     * @param {number?} timeoutMs - The optional maximum timeout period to wait for an answer before throwing a RequestTimeoutError.
     * @returns {Promise<T>} The fetched json response.
     * @throws {ResponseError} If the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} If the JSON response is empty.
     * @throws {RequestAbortedError | RequestTimeoutError} If the request was cancelled or timed out.
     * @throws {ResponseTypeError} If the response from the service is an array instead of an object.
     * @throws {ResponseContentError} If the response actually contains an error within it.
     * @throws {Error} For any other unexpected failures.
     */
    static fetchEsriJsonAsObject(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonObject>;
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
    static fetchJsonAsArray(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonArray>;
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
    static fetchJsonAs<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
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
    static fetchText(url: string, init?: RequestInit, timeoutMs?: number): Promise<string>;
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
    static fetchBlob(url: string, init?: RequestInit, timeoutMs?: number): Promise<Blob>;
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
    static fetchXMLToJson(url: string, init?: RequestInit, timeoutMs?: number): Promise<TypeJsonObject>;
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
    static fetchWithTimeout<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
    /**
     * Throws an error if the provided response content contains an embedded error.
     * Internally uses {@link Fetch.checkResponseForEmbeddedErrors} to validate the content.
     * @param {unknown} content - The content to inspect.
     * @throws {ResponseContentError} If the response contains an embedded error.
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
    /**
     * Tests different fetch situations to explain how to use fetching functions with combination of AbortControllers and/or timeouts.
     */
    static testJson(url: string): void;
}
export type VerifiedResponse = {
    valid: boolean;
    code?: number;
    error?: string;
    details?: string[];
};
