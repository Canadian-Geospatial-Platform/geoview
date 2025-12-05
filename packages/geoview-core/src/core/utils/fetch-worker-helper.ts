// GV This whole file is meant to be used by the workers. It is a lighter version of 'fetch-helper.ts'.
// GV It uses the least possible of our framework to not 'break the build'.
// GV This is reminiscent of the issue we were having when the worker was trying to call the 'delay' function
// GV from our framework package utilities and it was breaking the build. Since the function(s) in this file are
// GV also called from the worker, we hit the same kind of issue that the code it executes must not refer to
// GV our framework package too much.
// GV E.g. if we try to call 'fetchJson' from Fetch class in fetch-helper.ts instead of a basic fetch it
// GV breaks the build. You can even create a dummy static function in Fetch class and try to call it here for
// GV proof that it'll break with the busyWorkers after a bit! Simply *alluding* to a 'Class' from our package
// GV breaks the build even if not executing it!
// GV Indeed, just having a line "Fetch.toto();" called from within "fetchWithTimeout" for example, even if the function itself
// GV is NOT actually called (as long as it's imported in the worker class as this one is), the build breaks.
// GV Therefore, this is a simpler 'fetchWithTimeout' than the elaborated one we have in Fetch so that the
// GV worker (in separate thread) can execute.

import { RequestTimeoutError } from '@/core/exceptions/core-exceptions';

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
export const fetchWithTimeout = async <T>(url: string, init: RequestInit = {}, timeoutMs: number = 7000): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data as T;
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new RequestTimeoutError(timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
