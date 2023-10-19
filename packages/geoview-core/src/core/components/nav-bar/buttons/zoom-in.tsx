import { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { getGeoViewStore } from '@/core/stores/stores-managers';

import { MapContext } from '@/core/app-start';
import { IconButton, ZoomInIcon } from '@/ui';
import { getSxClasses } from '../nav-bar-style';
import { OL_ZOOM_DURATION } from '@/core/utils/constant';

/**
 * Create a zoom in button
 *
 * @returns {JSX.Element} return the created zoom in button
 */
export default function ZoomIn(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  /**
   * Causes the map to zoom in
   */
  function zoomIn() {
    const currentZoom = getGeoViewStore(mapId).getState().mapState.zoom;
    const { mapElement } = getGeoViewStore(mapId).getState().mapState;

    if (currentZoom) mapElement.getView().animate({ zoom: currentZoom + 0.5, duration: OL_ZOOM_DURATION });
  }

  return (
    <IconButton id="zoomIn" tooltip="mapnav.zoomIn" tooltipPlacement="left" onClick={() => zoomIn()} sx={sxClasses.navButton}>
      <ZoomInIcon />
    </IconButton>
  );
}
