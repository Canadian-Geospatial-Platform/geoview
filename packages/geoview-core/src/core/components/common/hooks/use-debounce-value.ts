import { useState, useEffect } from 'react';
import debounce from 'lodash/debounce';

/**
 * A custom hook that debounces a value
 * @param {T} value - The value to debounce
 * @param {number} delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const debouncedSet = debounce((newValue: T) => {
      setDebouncedValue(newValue);
    }, delay);

    debouncedSet(value);

    return () => {
      debouncedSet.cancel();
    };
  }, [value, delay]);

  return debouncedValue;
}
