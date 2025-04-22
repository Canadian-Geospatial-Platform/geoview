// GV This whole file is meant to be used by the workers. This explains the duplication with fetch-helper.ts.
// GV Similar to how the delay() from utilities was breaking the build when called from the worker class, it
// GV seems that if this file tries to use the Fetch class from fetch-helper.ts (e.g. Fetch.fetchJson()) it also
// GV breaks the build. You can create a dummy static function in Fetch class and try to call it here for
// GV proof that it'll break with the busyWorkers after a bit.
// GV Indeed, just having a line "Fetch.toto();" called from within "fetchWithTimeout" for example, even if the function itself
// GV is NOT actually called (as long as it's imported in the worker class as this one is), the build breaks.

import { RequestTimeoutError } from '@/core/exceptions/core-exceptions';

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
export const fetchWithTimeout = async <T>(url: string, options: RequestInit = {}, timeoutMs: number = 7000): Promise<T> => {
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
    return data as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RequestTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
