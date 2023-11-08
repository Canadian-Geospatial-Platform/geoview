import { ChangeEvent, useCallback, useContext, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { fromLonLat, transformExtent } from 'ol/proj';
import debounce from 'lodash/debounce';

import { CloseIcon, SearchIcon, AppBar, Box, Divider, IconButton, Paper, ProgressBar, Toolbar, Typography } from '@/ui';
import GeoList from './geo-list';
import { StyledInputField, sxClasses } from './geolocator-style';
import { MapContext } from '@/core/app-start';
import { EVENT_NAMES, api } from '@/app';
import { bboxHighlightPayload } from '@/api/events/payloads/bbox-highlight-payload';
import { OL_ZOOM_DURATION } from '@/core/utils/constant';
import { useUIappbarGeolocatorActive } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

export interface GeoListItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  province: string;
  tag: (string | null)[] | null;
}

export function Geolocator() {
  const { mapId } = useContext(MapContext);

  const {
    map,
    mapFeaturesConfig: { serviceUrls },
  } = api.maps[mapId];
  const mapSize = map?.getSize() || [0, 0];
  const { i18n, t } = useTranslation<string>();

  const [searchValue, setSearchValue] = useState<string>('');
  const [isSearchInputVisible, setIsSearchInputVisible] = useState<boolean>(false);

  const urlRef = useRef<string>(`${serviceUrls!.geolocator}&lang=${i18n.language}`);

  // internal state
  const [data, setData] = useState<GeoListItem[]>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // set the active (visible) or not active (hidden) from geolocator button click
  const active = useUIappbarGeolocatorActive();
  const { showClickMarker } = useMapStoreActions();

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
      setData(result);
    } catch (err) {
      setIsLoading(false);
      setError(err as Error);
    }
  };

  /**
   * Update the map zoom and location with given coordinates
   * @param {[number, number]} coords coordinates [lng, lat] where we want to zoom
   * @param {[number, number, number, number]} bbox bounding box to zoom to
   * @returns void
   */
  const zoomToLocation = (coords: [number, number], bbox?: [number, number, number, number]): void => {
    const { currentProjection } = api.maps[mapId];
    const indicatorBox = document.getElementsByClassName('ol-overviewmap-box') as HTMLCollectionOf<Element>;
    for (let i = 0; i < indicatorBox.length; i++) {
      (indicatorBox[i] as HTMLElement).style.display = 'none';
    }
    const projectionConfig = api.projection.projections[currentProjection];
    if (bbox) {
      //! There were issues with fromLonLat in rare cases in LCC projections, transformExtent seems to solve them.
      //! fromLonLat and transformExtent give differing results in many cases, fromLonLat had issues with the first
      //! three results from a geolocator search for "vancouver river"
      const convertedExtent = transformExtent(bbox, 'EPSG:4326', projectionConfig);
      api.maps[mapId].zoomToExtent(convertedExtent, {
        padding: [50, 50, 50, 50],
        maxZoom: 16,
        duration: OL_ZOOM_DURATION,
      });
      api.event.emit(bboxHighlightPayload(EVENT_NAMES.FEATURE_HIGHLIGHT.EVENT_HIGHLIGHT_BBOX, mapId, convertedExtent));
      setTimeout(() => {
        showClickMarker({ lnglat: coords });
        for (let i = 0; i < indicatorBox.length; i++) {
          (indicatorBox[i] as HTMLElement).style.display = '';
        }
      }, OL_ZOOM_DURATION + 150);
    } else {
      map.getView().animate({ center: fromLonLat(coords, projectionConfig), duration: OL_ZOOM_DURATION, zoom: 16 });
      setTimeout(() => {
        showClickMarker({ lnglat: coords });
        for (let i = 0; i < indicatorBox.length; i++) {
          (indicatorBox[i] as HTMLElement).style.display = '';
        }
      }, OL_ZOOM_DURATION + 150);
    }
  };

  /**
   * Reset search component values when close icon is clicked.
   * @returns void
   */
  const resetSearch = useCallback(() => {
    setIsSearchInputVisible(false);
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
    if (value.length) {
      debouncedRequest(value);
    }
    // clear geo list when search term cleared from input field.
    if (!value.length && data?.length) {
      setData(undefined);
    }
  };

  return (
    <Box sx={sxClasses.root} visibility={active ? 'visible' : 'hidden'} id="geolocator-search">
      <Box sx={sxClasses.geolocator}>
        <AppBar position="static">
          <Toolbar
            variant="dense"
            // attach event handler to toolbar when search input is hidden.
            {...(!isSearchInputVisible && { onClick: () => setIsSearchInputVisible(true) })}
            sx={{ cursor: !isSearchInputVisible ? 'pointer' : 'default' }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // cancel the debounce fn, when enter key clicked before wait time.
                doRequest.cancel();
                getGeolocations(searchValue);
              }}
            >
              {isSearchInputVisible && (
                <StyledInputField placeholder={t('geolocator.search')!} autoFocus onChange={onChange} value={searchValue} />
              )}

              <Box sx={{ display: 'flex', marginLeft: 'auto' }}>
                <IconButton
                  size="small"
                  edge="end"
                  color="inherit"
                  sx={{ mr: 4 }}
                  disabled={isSearchInputVisible && !searchValue.length}
                  onClick={() => {
                    if (!isSearchInputVisible) {
                      setIsSearchInputVisible(true);
                    } else if (searchValue.length) {
                      doRequest.cancel();
                      getGeolocations(searchValue);
                    }
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
                {isSearchInputVisible && (
                  <>
                    <Divider orientation="vertical" variant="middle" flexItem />
                    <IconButton size="small" edge="end" color="inherit" sx={{ mr: 2, ml: 4 }} onClick={resetSearch}>
                      <CloseIcon fontSize="small" />
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
          <Paper
            component="div"
            square
            elevation={4}
            sx={{ width: 400, height: mapSize[1] - 80, maxHeight: mapSize[1] - 80, overflowY: 'auto' }}
          >
            {!!data.length && <GeoList geoListItems={data} zoomToLocation={zoomToLocation} />}
            {(!data.length || error) && (
              <Typography component="p" sx={{ fontSize: 14, p: 10 }}>
                {t('geolocator.errorMessage')} {searchValue}
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
