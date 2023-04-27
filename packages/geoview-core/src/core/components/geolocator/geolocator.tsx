import { useCallback, useContext, useState } from 'react';
import { AppBar, Box, Toolbar, IconButton, Divider, LinearProgress, Typography, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { fromLonLat } from 'ol/proj';
import GeoList from './geo-list';
import useFetch from './useFetch';
import { StyledInputField, sxClasses } from './styles';
import { MapContext } from '../../app-start';
import { api } from '../../../app';

export interface GeoListItem {
  key: string;
  name: string;
  lat: number;
  lng: number;
  bbox: number[];
  province: string;
  tag: (string | null)[] | null;
}

export function Geolocator() {
  const { mapId } = useContext(MapContext);

  const {
    map,
    mapFeaturesConfig: { serviceUrls },
  } = api.map(mapId);
  const mapSize = map?.getSize() || [0, 0];

  const { i18n, t } = useTranslation<string>();
  const [searchValue, setSearchValue] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [isSearchInputVisible, setIsSearchInputVisible] = useState<boolean>(false);

  const { data, error, loading, reset } = useFetch<GeoListItem[]>(url);

  /**
   * Update the url with search value to send new fetch call.
   * @returns void
   */
  const updateUrl = useCallback(() => {
    if (searchValue.length) {
      const updatedUrl = `${serviceUrls!.geolocator}&q=${encodeURIComponent(searchValue)}&lang=${i18n.language}`;
      setUrl(updatedUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  /**
   * Update the map zoom and location with given coordinates
   * @param {coords} - coordinates [lng, lat] where we want to zoom
   * @returns void
   */
  const zoomToLocation = (coords: [number, number]): void => {
    const { currentProjection } = api.map(mapId);

    const projectionConfig = api.projection.projections[currentProjection];

    map.getView().animate({ center: fromLonLat(coords, projectionConfig), duration: 1000, zoom: 11 });
  };

  /**
   * Reset search component values when close icon is clicked..
   * @returns void
   */
  const resetSearch = useCallback(() => {
    setIsSearchInputVisible(false);
    setUrl('');
    setSearchValue('');
    if (reset) {
      reset();
    }
  }, [reset]);

  return (
    <Box sx={sxClasses.root} id="geolocator-search">
      <Box sx={sxClasses.geolocator}>
        <AppBar position="static">
          <Toolbar variant="dense">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUrl();
              }}
            >
              {isSearchInputVisible && (
                <StyledInputField
                  placeholder={t('geolocator.search')!}
                  autoFocus
                  onChange={(e) => setSearchValue(e.target.value)}
                  value={searchValue}
                />
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
                      updateUrl();
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
      {loading && (
        <Box sx={sxClasses.progressBar}>
          <LinearProgress color="inherit" />
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
