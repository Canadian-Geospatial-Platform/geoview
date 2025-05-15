import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppGeolocatorServiceURL, useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { cleanPostalCode, getDecimalDegreeItem } from '@/core/components/geolocator/utilities';
import { GeoListItem } from '@/core/components/geolocator/geolocator';
import { logger } from '@/core/utils/logger';
import { Fetch } from '@/core/utils/fetch-helper';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';

interface UseGeolocatorReturn {
  /** Array of geolocation results */
  data: GeoListItem[] | undefined;
  /** Loading state during requests */
  isLoading: boolean;
  /** Current search input value */
  searchValue: string;
  /** Error value */
  error: boolean;
  /** Function to update search value */
  setSearchValue: (value: string) => void;
  /** Function to trigger geolocation search */
  getGeolocations: (searchTerm: string) => void;
  /** Function to reset the hook state */
  resetState: () => void;
}

const TIMEOUT_DELAY = 15000;

export const useGeolocator = (): UseGeolocatorReturn => {
  logger.logTraceCore('GEOLOCATOR - useGeolocator');

  // States
  const [data, setData] = useState<GeoListItem[] | undefined>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  // Store
  const displayLanguage = useAppDisplayLanguage();
  const geolocatorServiceURL = useAppGeolocatorServiceURL();

  // Refs
  const displayLanguageRef = useRef(displayLanguage);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimerRef = useRef<NodeJS.Timeout | undefined>();

  // Reset state helper
  const resetState = useCallback(() => {
    setData(undefined);
    setError(false);
    setIsLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Cleanup function uses the captured timer reference
    if (fetchTimerRef.current) {
      clearTimeout(fetchTimerRef.current);
    }
  }, []);

  // Handle timeout effect
  useEffect(() => {
    if (isLoading) {
      // Store the current timer reference
      const timer = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        setData(undefined);
        setError(true);
        setIsLoading(false);
        logger.logError('GEOLOCATOR - search timeout error');
      }, TIMEOUT_DELAY);

      fetchTimerRef.current = timer;

      // Cleanup function uses the captured timer reference
      return () => {
        clearTimeout(timer);
      };
    }

    return () => {};
  }, [isLoading, resetState]);

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      resetState();
    };
  }, [resetState]);

  const fetchGeolocations = useCallback(
    async (searchTerm: string): Promise<void> => {
      logger.logTraceUseCallback('GEOLOCATOR use-geolocator fetchGeolocations', searchTerm);

      try {
        // Check if it is a postal code and return clean term
        const cleanSearchTerm = cleanPostalCode(searchTerm);
        setIsLoading(true);

        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          clearTimeout(fetchTimerRef.current);
        }

        const newAbortController = new AbortController();
        abortControllerRef.current = newAbortController;

        const currentUrl = `${geolocatorServiceURL}&lang=${displayLanguageRef.current}`;
        const result = await Fetch.fetchJsonAs<GeoListItem[]>(`${currentUrl}&q=${encodeURIComponent(`${cleanSearchTerm}*`)}`, {
          signal: abortControllerRef.current.signal,
        });

        // If cleanSearchTerm is a coordinate, add it to the list
        const ddSupport = getDecimalDegreeItem(cleanSearchTerm);
        if (ddSupport) result.unshift(ddSupport);

        setData(result);
      } finally {
        setIsLoading(false);
        clearTimeout(fetchTimerRef.current);
      }
    },
    [geolocatorServiceURL]
  );

  // Public function that handles the Promise
  const getGeolocations = useCallback(
    (searchTerm: string): void => {
      fetchGeolocations(searchTerm).catch((err) => {
        // If aborted response
        if (err instanceof RequestAbortedError) {
          // Cancel...
          return;
        }

        // Handle or log any errors here if needed
        setError(true);
        setData(undefined);
        logger.logError('GEOLOCATOR - search failed', err);
      });
    },
    [fetchGeolocations]
  );

  useEffect(() => {
    logger.logTraceUseEffect('GEOLOCATOR - change language', displayLanguage, searchValue);

    // Set language and redo request
    displayLanguageRef.current = displayLanguage;
    getGeolocations(searchValue);

    // Only listen to change in language and getGeolocations to request new value with updated language
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayLanguage, getGeolocations]);

  return {
    data,
    isLoading,
    searchValue,
    error,
    setSearchValue,
    getGeolocations,
    resetState,
  };
};
