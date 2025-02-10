import { ChangeEvent, useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';
import { useTheme } from '@mui/material';
import { CloseIcon, SearchIcon, AppBarUI, Box, Divider, IconButton, ProgressBar, Toolbar } from '@/ui';
import { StyledInputField, getSxClasses } from './geolocator-style';
import { OL_ZOOM_DURATION } from '@/core/utils/constant';
import { useUIActiveAppBarTab, useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useAppGeolocatorServiceURL, useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { GeolocatorResult } from './geolocator-result';
import { logger } from '@/core/utils/logger';
import { CV_DEFAULT_APPBAR_CORE } from '@/api/config/types/config-constants';
import { FocusTrapContainer } from '@/core/components/common';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { handleEscapeKey } from '@/core/utils/utilities';

export interface GeoListItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  province: string;
  category: string;
}

export function Geolocator(): JSX.Element {
  // Log
  logger.logTraceRender('components/geolocator/geolocator');

  const { t } = useTranslation();

  const theme = useTheme();
  const mapId = useGeoViewMapId();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // internal state
  const [data, setData] = useState<GeoListItem[]>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');

  // get store values
  const displayLanguage = useAppDisplayLanguage();
  const geolocatorServiceURL = useAppGeolocatorServiceURL();
  const { setActiveAppBarTab } = useUIStoreActions();
  const { tabGroup, isOpen } = useUIActiveAppBarTab();
  const activeTrapGeoView = useUIActiveTrapGeoView();

  const displayLanguageRef = useRef(displayLanguage);
  const geolocatorRef = useRef<HTMLDivElement>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimerRef = useRef<NodeJS.Timeout | undefined>();
  const searchInputRef = useRef<HTMLInputElement>();
  const MIN_SEARCH_LENGTH = 3;

  /**
   * Checks if search term is decimal degree coordinate and return geo list item.
   * @param {string} searchTerm search term user searched.
   * @returns GeoListItem | null
   */
  const getDecimalDegreeItem = (searchTerm: string): GeoListItem | null => {
    const latLngRegDD = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;

    if (!latLngRegDD.test(searchTerm)) {
      return null;
    }

    // remove extra spaces and delimiters (the filter). convert string numbers to floaty numbers
    const coords = searchTerm
      .split(/[\s|,|;|]/)
      .filter((n) => !Number.isNaN(n) && n !== '')
      .map((n) => parseFloat(n));

    // apply buffer to create bbox from point coordinates
    const buff = 0.015; // degrees
    const boundingBox: [number, number, number, number] = [coords[1] - buff, coords[0] - buff, coords[1] + buff, coords[0] + buff];

    // prep the lat/long result that needs to be generated along with name based results
    return {
      key: 'coordinates',
      name: `${coords[0]},${coords[1]}`,
      lat: coords[0],
      lng: coords[1],
      bbox: boundingBox,
      province: '',
      category: 'Latitude/Longitude',
    };
  };

  /**
   * Send fetch call to the service for given search term.
   * @param {string} searchTerm the search term entered by the user
   * @returns {Promise<void>}
   */
  const getGeolocations = useCallback(
    async (searchTerm: string): Promise<void> => {
      try {
        setIsLoading(true);
        // Abort any pending requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          clearTimeout(fetchTimerRef.current);
        }

        // Create new abort controller
        const newAbortController = new AbortController();
        abortControllerRef.current = newAbortController;

        // Use the current value from the ref
        const currentUrl = `${geolocatorServiceURL}&lang=${displayLanguageRef.current}`;

        const response = await fetch(`${currentUrl}&q=${encodeURIComponent(`${searchTerm}*`)}`, {
          signal: abortControllerRef.current.signal,
        });
        if (!response.ok) {
          throw new Error('Error');
        }
        const result = (await response.json()) as GeoListItem[];
        const ddSupport = getDecimalDegreeItem(searchTerm);

        if (ddSupport) {
          // insert at the top of array.
          result.unshift(ddSupport);
        }

        setData(result);
        setError(null);
        setIsLoading(false);
        clearTimeout(fetchTimerRef?.current);
      } catch (err) {
        setError(err as Error);
      }
    },
    [geolocatorServiceURL]
  );

  /**
   * Reset loading and data state and clear fetch timer.
   */
  const resetGeoLocatorState = (): void => {
    setIsLoading(false);
    setData([]);
    clearTimeout(fetchTimerRef.current);
  };

  /**
   * Reset search component values when close icon is clicked.
   * @returns void
   */
  const resetSearch = useCallback(() => {
    setSearchValue('');
    setData(undefined);
    setActiveAppBarTab(`${mapId}AppbarPanelButtonGeolocator`, CV_DEFAULT_APPBAR_CORE.GEOLOCATOR, false, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveAppBarTab]);

  /**
   * Do service request after debouncing.
   * @returns void
   */
  const doRequest = debounce((searchTerm: string) => {
    getGeolocations(searchTerm).catch((errorInside) => {
      // Log
      logger.logPromiseFailed('getGeolocations in deRequest in Geolocator', errorInside);
    });
  }, OL_ZOOM_DURATION);

  /**
   * Debounce the get geolocation service request
   * @param {string} searchTerm value to be searched
   * @returns void
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedRequest = useCallback((searchTerm: string) => doRequest(searchTerm), []);

  /**
   * onChange handler for search input field
   * NOTE: search will fire only when user enter atleast 3 characters.
   * when less 3 characters while doing search, list will be cleared out.
   * @param {ChangeEvent<HTMLInputElement>} e HTML Change event handler
   * @returns void
   */
  const onChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { value } = e.target;
    setSearchValue(value);
    // do fetch request when user enter at least 3 characters.
    if (value.length >= MIN_SEARCH_LENGTH) {
      debouncedRequest(value);
    }
    // clear geo list when search term cleared from input field.
    if (!value.length || value.length < MIN_SEARCH_LENGTH) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      resetGeoLocatorState();
      doRequest.cancel();
      setData(undefined);
    }
  };

  /**
   * Geo location handler.
   * @returns void
   */
  const handleGetGeolocations = useCallback(() => {
    if (searchValue.length >= MIN_SEARCH_LENGTH) {
      getGeolocations(searchValue).catch((errorInside) => {
        // Log
        logger.logPromiseFailed('getGeolocations in Geolocator', errorInside);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('GEOLOCATOR - mount');

    if (!geolocatorRef?.current) return () => {};

    const geolocator = geolocatorRef.current;
    const handleGeolocatorEscapeKey = (e: KeyboardEvent): void => {
      handleEscapeKey(e.key, '', false, () => resetSearch());
    };
    geolocator.addEventListener('keydown', handleGeolocatorEscapeKey);

    // Cleanup function to remove event listener
    return () => {
      geolocator.removeEventListener('keydown', handleGeolocatorEscapeKey);
    };
  }, [mapId, resetSearch]);

  useEffect(() => {
    return () => {
      // Cleanup function to abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        clearTimeout(fetchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Set the focus on search field when geolocator is opened.
    if (isOpen && tabGroup === CV_DEFAULT_APPBAR_CORE.GEOLOCATOR && searchInputRef.current) {
      searchInputRef.current.querySelector('input')?.focus();
    }
  }, [isOpen, tabGroup]);

  /**
   * Effect that will track fetch call, so that after 15 seconds if no response comes back,
   * Error will be displayed.
   */
  useEffect(() => {
    if (isLoading) {
      fetchTimerRef.current = setTimeout(() => {
        resetGeoLocatorState();
        setError(new Error('No result found.'));
      }, 15000);
    }
    return () => {
      clearTimeout(fetchTimerRef.current);
    };
  }, [isLoading]);

  // Update the ref whenever displayLanguage changes
  useEffect(() => {
    displayLanguageRef.current = displayLanguage;
  }, [displayLanguage]);

  return (
    <FocusTrapContainer open={tabGroup === CV_DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen && activeTrapGeoView} id="geolocator-focus-trap">
      <Box
        sx={sxClasses.root}
        visibility={tabGroup === CV_DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen ? 'visible' : 'hidden'}
        id="geolocator-search"
        tabIndex={tabGroup === CV_DEFAULT_APPBAR_CORE.GEOLOCATOR && isOpen ? 0 : -1}
        ref={geolocatorRef}
      >
        <Box sx={sxClasses.geolocator}>
          <AppBarUI position="static">
            <Toolbar variant="dense">
              <form
                onSubmit={(e) => {
                  // NOTE: so that when enter is pressed, page is not reloaded.
                  e.preventDefault();
                  if (!isLoading) {
                    handleGetGeolocations();
                  }
                }}
              >
                <StyledInputField
                  placeholder={t('geolocator.search')!}
                  autoFocus
                  onChange={onChange}
                  value={searchValue}
                  ref={searchInputRef}
                />
                <Box sx={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    edge="end"
                    color="inherit"
                    sx={{ mr: 4 }}
                    disabled={!searchValue.length}
                    onClick={handleGetGeolocations}
                  >
                    <SearchIcon fontSize={theme.palette.geoViewFontSize.sm} />
                  </IconButton>
                  <Divider orientation="vertical" variant="middle" flexItem />
                  <IconButton size="small" edge="end" color="inherit" sx={{ mr: 2, ml: 4 }} onClick={resetSearch}>
                    <CloseIcon fontSize={theme.palette.geoViewFontSize.sm} />
                  </IconButton>
                </Box>
              </form>
            </Toolbar>
          </AppBarUI>
        </Box>
        {isLoading && (
          <Box sx={sxClasses.progressBar}>
            <ProgressBar />
          </Box>
        )}
        {!!data && searchValue?.length >= MIN_SEARCH_LENGTH && (
          <Box sx={sxClasses.searchResult}>
            <GeolocatorResult geoLocationData={data} searchValue={searchValue} error={error} />
          </Box>
        )}
      </Box>
    </FocusTrapContainer>
  );
}
