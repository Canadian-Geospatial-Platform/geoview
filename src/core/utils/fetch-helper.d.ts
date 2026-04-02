/** Result of a HEAD reachability check. */
export interface HeadResult {
    /** The HTTP response object, or null if the server could not be reached. */
    response: Response | null;
    /** The reason for the result: 'ok', 'cors', 'network', or 'timeout'. */
    reason: 'ok' | 'cors' | 'network' | 'timeout';
}
/** Provides static methods for performing HTTP fetch operations with timeout and abort support. */
export declare abstract class Fetch {
    #private;
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
    static fetchJson<T>(url: string, init?: RequestInit, timeoutMs?: number, delayMs?: number): Promise<T>;
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
    static fetchEsriJson<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
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
    static fetchJsonAsArray<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T[]>;
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
    static fetchText(url: string, init?: RequestInit, timeoutMs?: number): Promise<string>;
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
    static fetchArrayBuffer(url: string, init?: RequestInit, timeoutMs?: number): Promise<ArrayBuffer>;
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
    static fetchBlobImage(url: string, init?: RequestInit, timeoutMs?: number): Promise<string | ArrayBuffer | null>;
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
    static fetchBlob(url: string, init?: RequestInit, timeoutMs?: number): Promise<Blob>;
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
    static fetchXMLToJson<T = Record<string, unknown>>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
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
    static fetchHeadWithTimeout(url: string, timeoutMs?: number): Promise<HeadResult>;
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
    static fetchWithTimeout<T>(url: string, init?: RequestInit, timeoutMs?: number): Promise<T>;
    /**
     * Throws an error if the provided response content contains an embedded error.
     *
     * Internally uses {@link Fetch.checkResponseForEmbeddedErrors} to validate the content.
     *
     * @param content - The content to inspect
     * @throws {ResponseContentError} When the response contains an embedded error
     */
    static throwIfResponseHasEmbeddedError(content: unknown): void;
    /**
     * Checks a JSON response for embedded error information.
     *
     * This function is useful when working with services which may return a 200 OK HTTP
     * status but still embed an error object in the response payload.
     *
     * @param content - The content response from the server (expecting a json, but can be text)
     * @returns An object describing whether the response is valid, and if not, includes error details
     */
    static checkResponseForEmbeddedErrors(content: unknown): VerifiedResponse;
}
/** Result of checking a response for embedded errors. */
export type VerifiedResponse = {
    valid: boolean;
    code?: number;
    error?: string;
    details?: string[];
};
//# sourceMappingURL=fetch-helper.d.ts.map