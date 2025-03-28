/**
 * Custom error class for handling request timeout scenarios
 * @extends Error
 */
export class RequestTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

/**
 * Performs a fetch request with timeout capability
 * @template T - The expected type of the JSON response
 * @param {string} url - The URL to fetch from
 * @param {RequestInit} [options={}] - Fetch options to be passed to the fetch call
 * @param {number} [timeoutMs=5000] - Timeout in milliseconds before the request is aborted
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
export const fetchWithTimeout = async <T>(url: string, options: RequestInit = {}, timeoutMs: number = 5000): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    clearTimeout(timeout);
    return data as T;
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RequestTimeoutError(timeoutMs);
    }
    throw error;
  }
};
