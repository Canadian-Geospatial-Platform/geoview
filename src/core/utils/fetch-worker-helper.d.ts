/**
 * Performs a fetch request with timeout capability
 * @template T - The expected type of the JSON response
 * @param {string} url - The URL to fetch from
 * @param {RequestInit} [init={}] - The optional initialization parameters for the fetch.
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
export declare const fetchWithTimeout: <T>(url: string, init?: RequestInit, timeoutMs?: number) => Promise<T>;
