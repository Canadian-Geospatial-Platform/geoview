import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material';

import { debounce } from '@/core/utils/debounce';
import { Box, ProgressBar, Typography } from '@/ui';

import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreUIActiveAppBarTab, useStoreUIActiveTrapGeoView } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { GeolocatorResult } from '@/core/components/geolocator/geolocator-result';
import { getSxClasses } from '@/core/components/geolocator/geolocator-style';
import { DEFAULT_APPBAR_CORE } from '@/api/types/map-schema-types';
import { FocusTrapContainer } from '@/core/components/common';
import { logger } from '@/core/utils/logger';
import { useGeolocator } from '@/core/components/geolocator/hooks/use-geolocator';
import { GeolocatorBar } from '@/core/components/geolocator/geolocator-bar';
import { handleEscapeKey } from '@/core/utils/utilities';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { CONTAINER_TYPE, TIMEOUT } from '@/core/utils/constant';

/** Geolocation search result item. */
export interface GeoListItem {
  /** Unique key for the item. */
  key: string;
  /** Display name of the location. */
  name: string;
  /** Latitude coordinate. */
  lat: number;
  /** Longitude coordinate. */
  lng: number;
  /** Bounding box as [west, south, east, north]. */
  bbox: [number, number, number, number];
  /** Province or territory name. */
  province: string;
  /** Location category. */
  category: string;
}

/** Minimum number of characters required to trigger a search. */
const MIN_SEARCH_LENGTH = 3;

/** Debounce delay in milliseconds for search input. */
const DEBOUNCE_DELAY = 500;

/**
 * Creates the geolocator search component.
 *
 * @returns The geolocator component
 */
export function Geolocator(): JSX.Element {
  logger.logTraceRender('components/geolocator/geolocator');

  // Hooks
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Store
  const mapId = useStoreGeoViewMapId();
  const uiController = useUIController();
  const { tabId, isOpen } = useStoreUIActiveAppBarTab();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();

  // Derived values
  const isPanelOpen = tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen;

  // Custom geolocator hook
  const { data, isLoading, searchValue, error, setSearchValue, getGeolocations, resetState } = useGeolocator();

  // WCAG - Track loading status changes for screen reader announcements
  const prevLoadingRef = useRef<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // #region HANDLERS

  // Create debounced version of getGeolocations
  const debouncedRequest = useMemo(() => {
    logger.logTraceUseMemo('GEOLOCATOR - debouncedRequest', getGeolocations);
    return debounce((value: string) => {
      if (value.length >= MIN_SEARCH_LENGTH) {
        getGeolocations(value);
      }
    }, DEBOUNCE_DELAY);
  }, [getGeolocations]);

  /**
   * Handles search input value changes.
   */
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const { value } = event.target;
      setSearchValue(value);

      if (!value.length || value.length < MIN_SEARCH_LENGTH) {
        resetState();
        return;
      }

      if (value.length >= MIN_SEARCH_LENGTH) {
        debouncedRequest(value);
      }
    },
    [debouncedRequest, resetState, setSearchValue]
  );

  /**
   * Triggers a search when criteria are met.
   */
  const handleSearch = useCallback((): void => {
    if (searchValue.length >= MIN_SEARCH_LENGTH) {
      debouncedRequest(searchValue);
    }
  }, [searchValue, debouncedRequest]);

  // #endregion HANDLERS

  /**
   * Resets the search and closes the geolocator panel.
   */
  const handleReset = useCallback((): void => {
    setSearchValue('');
    uiController.setActiveAppBarTab(DEFAULT_APPBAR_CORE.GEOLOCATOR, false, false);
    setTimeout(() => {
      uiController.disableFocusTrap(`${mapId}-${CONTAINER_TYPE.APP_BAR}-${DEFAULT_APPBAR_CORE.GEOLOCATOR}-panel-btn`);
    }, TIMEOUT.deferExecution);
  }, [setSearchValue, uiController, mapId]);

  /**
   * Cancels the debounced request on unmount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOLOCATOR - cancel debounced request on unmount');

    return () => {
      debouncedRequest.cancel();
    };
  }, [debouncedRequest]);

  /**
   * Focuses the search input when the geolocator opens.
   */
  useEffect(() => {
    logger.logTraceUseEffect('GEOLOCATOR - focus input', isOpen, tabId);

    if (isOpen && tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && searchInputRef.current) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, tabId]);

  /**
   * Handles ESC key to close the geolocator panel.
   */
  useEffect(() => {
    logger.logTraceUseEffect('GEOLOCATOR - handleKeyDown', isOpen, tabId);

    const panel = panelRef.current;
    const handleKeyDown = (event: KeyboardEvent): void => {
      handleEscapeKey(event.key, `${mapId}-${CONTAINER_TYPE.APP_BAR}-${DEFAULT_APPBAR_CORE.GEOLOCATOR}-panel-btn`, false, handleReset);
    };

    if (isOpen && tabId === DEFAULT_APPBAR_CORE.GEOLOCATOR && panel) {
      panel.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      panel?.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, tabId, handleReset, mapId]);

  /**
   * Tracks loading status changes for screen reader announcements.
   */
  // WCAG - Results are announced separately in the GeolocatorResult component, so we only announce loading status here.
  useEffect(() => {
    logger.logTraceUseEffect('GEOLOCATOR - status announcements', isLoading);

    if (isLoading && !prevLoadingRef.current) {
      setStatusMessage(t('geolocator.loadingResults') || '');
      prevLoadingRef.current = true;
    } else if (!isLoading && prevLoadingRef.current) {
      setStatusMessage(''); // Clear when done loading
      prevLoadingRef.current = false;
    }
  }, [isLoading, t]);

  return (
    // Determine if the panel is actually open and visible

    <Box
      ref={panelRef}
      component="section"
      role={isPanelOpen ? 'dialog' : undefined}
      aria-modal={isPanelOpen && activeTrapGeoView ? true : undefined}
      aria-hidden={!isPanelOpen}
      aria-label={t('geolocator.panelTitle')!}
      sx={memoSxClasses.root}
      visibility={isPanelOpen ? 'visible' : 'hidden'}
      id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-${DEFAULT_APPBAR_CORE.GEOLOCATOR}-panel`}
    >
      <FocusTrapContainer open={isPanelOpen && activeTrapGeoView} id="geolocator-focus-trap" containerType={CONTAINER_TYPE.APP_BAR}>
        <Box sx={memoSxClasses.geolocator}>
          <Typography component="h2" sx={memoSxClasses.visuallyHidden}>
            {t('geolocator.panelTitle')}
          </Typography>

          <GeolocatorBar
            searchValue={searchValue}
            onChange={handleChange}
            onSearch={handleSearch}
            onReset={handleReset}
            isLoading={isLoading}
            inputRef={searchInputRef}
          />
        </Box>

        {/* WCAG - ARIA live region for screen reader announcements */}
        <Box sx={memoSxClasses.visuallyHidden} role="status" aria-live="polite" aria-atomic="true">
          {statusMessage}
        </Box>

        {isLoading && (
          <Box sx={memoSxClasses.progressBar}>
            <ProgressBar aria-label={t('geolocator.loadingResults')!} />
          </Box>
        )}

        {(error || (!!data && searchValue?.length >= MIN_SEARCH_LENGTH)) && (
          <Box sx={memoSxClasses.searchResult}>
            <GeolocatorResult geoLocationData={!data ? [] : data} searchValue={searchValue} error={error} />
          </Box>
        )}
      </FocusTrapContainer>
    </Box>
  );
}
