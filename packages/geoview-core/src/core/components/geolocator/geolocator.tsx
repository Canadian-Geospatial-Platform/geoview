import { useCallback, useContext, useState } from 'react';
import { AppBar, Box, Toolbar, IconButton, Divider, LinearProgress, Typography, Paper } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';
import { fromLonLat } from 'ol/proj';
import GeoList from './geo-list';
import { GeoListItem } from './types';
import useFetch from './useFetch';
import { StyledInputField, sxClasses } from './styles';
import { MapContext } from '../../app-start';
import { TypeWindow } from '../../types/cgpv-types';

const w = window as TypeWindow;

export function Geolocator() {
  const { cgpv } = w;
  const { api } = cgpv;
  const mapConfig = useContext(MapContext);

  const { mapId } = mapConfig;
  const { map } = api.map(mapId);
  const mapSize = map?.getSize() || [0, 0];

  const { i18n } = useTranslation<string>();
  const [searchValue, setSearchValue] = useState('');
  const [url, setUrl] = useState('');
  const [isSearchInputVisible, setIsSearchInputVisible] = useState(false);

  const { data, error, loading, reset } = useFetch<GeoListItem[]>(url);

  const updateUrl = useCallback(() => {
    if (searchValue.length) {
      const updatedUrl = `https://fr59c5usw4.execute-api.ca-central-1.amazonaws.com/dev?q=${searchValue}&lang=${i18n.language}&keys=geonames`;
      setUrl(updatedUrl);
    }
  }, [searchValue, i18n.language]);

  // coords : [lng, lat]
  const zoomToLocation = (coords: [number, number]) => {
    const { currentProjection } = api.map(mapId);

    const projectionConfig = api.projection.projections[currentProjection];

    map.getView().animate({ center: fromLonLat(coords, projectionConfig), duration: 1000, zoom: 11 });
  };

  const resetMap = () => {
    const { currentProjection } = api.map(mapId);

    // get map and set initial bounds to use in zoom home
    const { zoom, center } = api.map(mapId).mapFeaturesConfig.map.viewSettings;
    const projectionConfig = api.projection.projections[currentProjection];

    map.getView().animate({ center: fromLonLat(center, projectionConfig), duration: 1000, zoom });
  };

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
                <StyledInputField placeholder="Search" autoFocus onChange={(e) => setSearchValue(e.target.value)} value={searchValue} />
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
                    <IconButton
                      size="small"
                      edge="end"
                      color="inherit"
                      sx={{ mr: 2, ml: 4 }}
                      onClick={() => {
                        setIsSearchInputVisible(false);
                        setUrl('');
                        setSearchValue('');
                        resetMap();
                        if (reset) {
                          reset();
                        }
                      }}
                    >
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
                No matches found for {searchValue}
              </Typography>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
