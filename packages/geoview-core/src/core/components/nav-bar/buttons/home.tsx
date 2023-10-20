import { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { fromLonLat } from 'ol/proj';
import { Extent } from 'ol/extent';
import { FitOptions } from 'ol/View';

import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { IconButton, HomeIcon } from '@/ui';
import { api } from '@/app';
import { getSxClasses } from '../nav-bar-style';

/**
 * Create a home button to return the user to the map center
 *
 * @returns {JSX.Element} the created home button
 */
export default function Home(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  /**
   * Return user to map initial center
   */
  function setHome() {
    // get map and set initial bounds to use in zoom home
    const store = getGeoViewStore(mapId);
    const { center, zoom } = store.getState().mapConfig!.map.viewSettings;
    const projectionConfig = api.projection.projections[store.getState().mapState.currentProjection];

    const projectedCoords = fromLonLat(center, projectionConfig);
    const extent: Extent = [...projectedCoords, ...projectedCoords];

    const options: FitOptions = { padding: [100, 100, 100, 100], maxZoom: zoom, duration: 500 };

    api.maps[mapId].zoomToExtent(extent, options);
  }

  return (
    <IconButton id="home" tooltip="mapnav.home" tooltipPlacement="left" onClick={() => setHome()} sx={sxClasses.navButton}>
      <HomeIcon />
    </IconButton>
  );
}
