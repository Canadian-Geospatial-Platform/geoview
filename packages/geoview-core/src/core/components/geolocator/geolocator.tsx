import { ChangeEvent, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import debounce from 'lodash/debounce';
import { useTheme } from '@mui/material';
import { CloseIcon, SearchIcon, AppBar, Box, Divider, IconButton, ProgressBar, Toolbar } from '@/ui';
import { FocusTrapElement } from '@/core/components/common/focus-trap-element';
import { StyledInputField, sxClasses } from './geolocator-style';
import { OL_ZOOM_DURATION } from '@/core/utils/constant';
import { useUIAppbarGeolocatorActive, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useAppGeolocatorServiceURL, useAppDisplayLanguage } from '@/core/stores/store-interface-and-intial-values/app-state';
import { GeolocatorResult } from './geolocator-result';
import { logger } from '@/core/utils/logger';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

export interface GeoListItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  province: string;
  category: string;
}

export function Geolocator() {
  // Log
  logger.logTraceRender('components/geolocator/geolocator');

  const { t } = useTranslation();

  const theme = useTheme();
  const { setMapKeyboardPanInteractions } = useMapStoreActions();

  // internal state
  const [data, setData] = useState<GeoListItem[]>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearchInputVisible, setIsSearchInputVisible] = useState<boolean>(false);

  // get store values
  const displayLanguage = useAppDisplayLanguage();
  const geolocatorServiceURL = useAppGeolocatorServiceURL();

  // set the active (visible) or not active (hidden) from geolocator button click
  const active = useUIAppbarGeolocatorActive();
  const { setGeolocatorActive } = useUIStoreActions();

  const urlRef = useRef<string>(`${geolocatorServiceURL}&lang=${displayLanguage}`);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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
   * @returns void
   */
  const getGeolocations = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${urlRef.current}&q=${encodeURIComponent(`${searchTerm}*`)}`);
      if (!response.ok) {
        throw new Error('Error');
      }
      const result = (await response.json()) as GeoListItem[];
      setIsLoading(false);
      const ddSupport = getDecimalDegreeItem(searchTerm);
      if (ddSupport) {
        // insert at the top of array.
        result.unshift(ddSupport);
      }
      setData(result);
    } catch (err) {
      setIsLoading(false);
      setError(err as Error);
    }
  };

  /**
   * Reset search component values when close icon is clicked.
   * @returns void
   */
  const resetSearch = useCallback(() => {
    setIsSearchInputVisible(false);
    setGeolocatorActive(false);
    setSearchValue('');
    setData(undefined);
  }, []);

  /**
   * Do service request after debouncing.
   * @returns void
   */
  const doRequest = debounce((searchTerm: string) => {
    getGeolocations(searchTerm);
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
   * @param {ChangeEvent<HTMLInputElement>} e HTML Change event handler
   * @returns void
   */
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);
    // do fetch request when user enter at least 3 characters.
    if (value.length >= 3) {
      debouncedRequest(value);
    }
    // clear geo list when search term cleared from input field.
    if (!value.length && data?.length) {
      setData(undefined);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    // disables map interactions (arrow keys won't move the map)
    setMapKeyboardPanInteractions(0);

    if (event.key === 'Escape') {
      setGeolocatorActive(false);
    }
  };

  useEffect(() => {
    if (searchInputRef.current && active) {
      searchInputRef.current?.click();
    }
    setSearchValue(active ? searchValue : '');

    if (active) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const searchPanelContent: ReactNode = (
    <Box sx={sxClasses.root} visibility={active ? 'visible' : 'hidden'} id="geolocator-search">
      <Box sx={sxClasses.geolocator}>
        <AppBar position="static">
          <Toolbar
            variant="dense"
            {...(!isSearchInputVisible && { onClick: () => setIsSearchInputVisible(true) })}
            sx={{ cursor: !isSearchInputVisible ? 'pointer' : 'default' }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                doRequest.cancel();
                getGeolocations(searchValue);
              }}
            >
              <StyledInputField ref={searchInputRef} placeholder={t('geolocator.search')!} onChange={onChange} value={searchValue} />

              <Box sx={{ display: 'flex', marginLeft: 'auto', alignItems: 'center' }}>
                <IconButton
                  tabIndex={0}
                  size="small"
                  edge="end"
                  color="inherit"
                  sx={{ mr: 4 }}
                  disabled={isSearchInputVisible && !searchValue.length}
                  onClick={() => {
                    if (searchValue.length) {
                      doRequest.cancel();
                      getGeolocations(searchValue);
                    }
                  }}
                >
                  <SearchIcon fontSize={theme.palette.geoViewFontSize.sm} />
                </IconButton>
                {isSearchInputVisible && (
                  <>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <IconButton tabIndex={0} size="small" edge="end" color="inherit" sx={{ mr: 2, ml: 4 }} onClick={resetSearch}>
                      <CloseIcon fontSize={theme.palette.geoViewFontSize.sm} />
                    </IconButton>
                  </>
                )}
              </Box>
            </form>
          </Toolbar>
        </AppBar>
      </Box>
      {isLoading && (
        <Box sx={sxClasses.progressBar}>
          <ProgressBar />
        </Box>
      )}
      {!!data && (
        <Box sx={sxClasses.searchResult}>
          <GeolocatorResult geoLocationData={data} searchValue={searchValue} error={error} />
        </Box>
      )}
    </Box>
  );

  return <FocusTrapElement id="search-panel" basic active={active} content={searchPanelContent} />;
}
