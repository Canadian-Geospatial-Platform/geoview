/**
 * Creates a debounced version of a function, optionally controlling
 * whether it runs on the leading or trailing edge of the wait interval.
 * @param fn - Function to debounce
 * @param wait - Delay in milliseconds
 * @param options - Optional settings: { leading, trailing }
 * @returns A debounced function with `cancel` and `flush` methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<F extends (...args: any[]) => any>(fn: F, wait: number, options: DebounceOptions = {}): DebouncedFunction<F> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<F> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastThis: any = null;
  let result: ReturnType<F> | undefined;

  const leading = options.leading ?? false;
  const trailing = options.trailing ?? true;

  const invoke = (): ReturnType<F> | undefined => {
    if (lastArgs) {
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
    return result;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const debounced = function (this: any, ...args: Parameters<F>): ReturnType<F> | undefined {
    lastArgs = args;
    lastThis = this;

    const callNow = leading && !timeout;

    if (timeout) clearTimeout(timeout);

    timeout = setTimeout(() => {
      timeout = undefined;
      if (trailing) invoke();
    }, wait);

    if (callNow) {
      return invoke();
    }

    return result;
  };

  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = undefined;
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
      return invoke();
    }
    return result;
  };

  return debounced as DebouncedFunction<F>;
}

/**
 * Options for the debounced function.
 */
export interface DebounceOptions {
  /**
   * If true, the function will be invoked on the leading edge of the timeout.
   * Default: false
   */
  leading?: boolean;

  /**
   * If true, the function will be invoked on the trailing edge of the timeout.
   * Default: true
   */
  trailing?: boolean;
}

/**
 * Type representing a debounced version of a function F.
 * Includes the original function signature (return type possibly undefined)
 * and adds `cancel` and `flush` methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DebouncedFunction<F extends (...args: any[]) => any> = ((...args: Parameters<F>) => ReturnType<F> | undefined) & {
  /**
   * Cancel any pending invocation of the debounced function.
   */
  cancel: () => void;

  /**
   * Immediately invoke any pending invocation of the debounced function
   * and return its result.
   */
  flush: () => ReturnType<F> | undefined;
};
