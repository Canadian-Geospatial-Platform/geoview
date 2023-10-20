import { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { fromLonLat } from 'ol/proj';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';

// import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { IconButton, EmojiPeopleIcon } from '@/ui';
import { Coordinate, api } from '@/app';
import { getSxClasses } from '../nav-bar-style';

/**
 * Create a location button to zoom to user location
 *
 * @returns {JSX.Element} the created location button
 */
export default function Location(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  /**
   * Zoom to user location
   */
  function zoomToMe() {
    let coordinates: Coordinate = [];
    function success(pos: GeolocationPosition) {
      coordinates = [pos.coords.longitude, pos.coords.latitude];

      const { currentProjection } = api.maps[mapId];
      const projectionConfig = api.projection.projections[currentProjection];

      const projectedCoords = fromLonLat(coordinates, projectionConfig);
      const extent: Extent = [...projectedCoords, ...projectedCoords];

      const options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: 13, duration: 500 };

      api.maps[mapId].zoomToExtent(extent, options);
    }

    function error(err: GeolocationPositionError) {
      // eslint-disable-next-line no-console
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }

  return (
    <IconButton id="location" tooltip="mapnav.location" tooltipPlacement="left" onClick={() => zoomToMe()} sx={sxClasses.navButton}>
      <EmojiPeopleIcon />
    </IconButton>
  );
}
