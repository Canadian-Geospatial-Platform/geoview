import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { useTheme } from '@mui/material';
import { Box, ProgressBar } from '@/ui';
import { useUIActiveAppBarTab, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { GeolocatorResult } from '@/core/components/geolocator/geolocator-result';
import { getSxClasses } from '@/core/components/geolocator/geolocator-style';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import { FocusTrapContainer } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useGeolocator } from '@/core/components/geolocator/hooks/use-geolocator';
import { GeolocatorBar } from '@/core/components/geolocator/geolocator-bar';

export interface GeoListItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  province: string;
  category: string;
}

const MIN_SEARCH_LENGTH = 3;
const DEBOUNCE_DELAY = 500;

export function Geolocator(): JSX.Element {
  logger.logTraceRender('components/geolocator/geolocator');

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const { setActiveAppBarTab } = useUIStoreActions();
  const { tabId, isOpen } = useUIActiveAppBarTab();
  const activeTrapGeoView = useUIActiveTrapGeoView();

  // Custom geolocator hook
  const { data, isLoading, searchValue, error, setSearchValue, getGeolocations, resetState } = useGeolocator();

  // Create debounced version of getGeolocations
  const debouncedRequest = useMemo(
    () =>
      debounce((value: string) => {
        if (value.length >= MIN_SEARCH_LENGTH) {
          getGeolocations(value);
        }
      }, DEBOUNCE_DELAY),
    [getGeolocations]
  );

  const handleSearch = useCallback(() => {
    if (searchValue.length >= MIN_SEARCH_LENGTH) {
      debouncedRequest(searchValue);
    }
  }, [searchValue, debouncedRequest]);

  const handleReset = useCallback(() => {
    setSearchValue('');
    setActiveAppBarTab(DEFAULT_APPBAR_CORE.GEOLOCATOR, false, false);
  }, [setActiveAppBarTab, setSearchValue]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    setSearchValue(value);

    if (!value.length || value.length < MIN_SEARCH_LENGTH) {
      resetState();
      return;
    }

    if (value.length >= MIN_SEARCH_LENGTH) {
      debouncedRequest(value);
    }
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedRequest.cancel();
    };
  }, [debouncedRequest]);

  return (
    <FocusTrapContainer open={tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen && activeTrapGeoView} id="geolocator-focus-trap">
      <Box
        sx={sxClasses.root}
        visibility={tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen ? 'visible' : 'hidden'}
        id="geolocator-search"
      >
        <Box sx={sxClasses.geolocator}>
          <GeolocatorBar
            searchValue={searchValue}
            onChange={handleChange}
            onSearch={handleSearch}
            onReset={handleReset}
            isLoading={isLoading}
          />
        </Box>

        {isLoading && (
          <Box sx={sxClasses.progressBar}>
            <ProgressBar />
          </Box>
        )}

        {(error || (!!data && searchValue?.length >= MIN_SEARCH_LENGTH)) && (
          <Box sx={sxClasses.searchResult}>
            <GeolocatorResult geoLocationData={!data ? [] : data} searchValue={searchValue} error={error} />
          </Box>
        )}
      </Box>
    </FocusTrapContainer>
  );
}
