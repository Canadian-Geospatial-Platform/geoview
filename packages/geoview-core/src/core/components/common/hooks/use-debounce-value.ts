import { useState, useEffect } from 'react';

import { debounce } from '@/core/utils/debounce';

/**
 * A custom hook that debounces a value.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  /**
   * Updates the debounced value after the specified delay.
   */
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
