import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from '@/core/utils/debounce';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Box, ProgressBar } from '@/ui';
import { useUIActiveAppBarTab, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { GeolocatorResult } from '@/core/components/geolocator/geolocator-result';
import { getSxClasses } from '@/core/components/geolocator/geolocator-style';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import { FocusTrapContainer } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useGeolocator } from '@/core/components/geolocator/hooks/use-geolocator';
import { GeolocatorBar } from '@/core/components/geolocator/geolocator-bar';
import { handleEscapeKey } from '@/core/utils/utilities';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TIMEOUT } from '@/core/utils/constant';

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
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const mapId = useGeoViewMapId();

  // Store
  const { setActiveAppBarTab, disableFocusTrap } = useUIStoreActions();
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
    setTimeout(() => {
      disableFocusTrap(`${DEFAULT_APPBAR_CORE.GEOLOCATOR}-panel-btn-${mapId}`);
    }, TIMEOUT.deferExecution);
  }, [setActiveAppBarTab, setSearchValue, disableFocusTrap, mapId]);

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

  // Focus search input when geolocator opens
  useEffect(() => {
    logger.logTraceUseEffect('GEOLOCATOR - focus input', isOpen, tabId);

    if (isOpen && tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && searchInputRef.current) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, tabId]);

  // Handle ESC key to close geolocator
  useEffect(() => {
    logger.logTraceUseEffect('GEOLOCATOR - handleKeyDown', isOpen, tabId);

    const panel = panelRef.current;
    const handleKeyDown = (event: KeyboardEvent): void => {
      handleEscapeKey(event.key, `${DEFAULT_APPBAR_CORE.GEOLOCATOR}-panel-btn-${mapId}`, false, handleReset);
    };

    if (isOpen && tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && panel) {
      panel.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      panel?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, tabId, handleReset, mapId]);

  return (
    <Box
      ref={panelRef}
      component="section"
      role="dialog"
      aria-label={t('geolocator.panelTitle')!}
      sx={sxClasses.root}
      visibility={tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen ? 'visible' : 'hidden'}
      className="appbar-panel-geolocator-search"
      id={`appbar-panel-geolocator-${mapId}`}
    >
      <FocusTrapContainer open={tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen && activeTrapGeoView} id="geolocator-focus-trap">
        <Box sx={sxClasses.geolocator}>
          <GeolocatorBar
            searchValue={searchValue}
            onChange={handleChange}
            onSearch={handleSearch}
            onReset={handleReset}
            isLoading={isLoading}
            inputRef={searchInputRef}
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
      </FocusTrapContainer>
    </Box>
  );
}
