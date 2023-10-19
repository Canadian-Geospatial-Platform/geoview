import { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { getGeoViewStore } from '@/core/stores/stores-managers';

import { IconButton, ZoomOutIcon } from '@/ui';
import { MapContext } from '@/core/app-start';
import { getSxClasses } from '../nav-bar-style';
import { OL_ZOOM_DURATION } from '@/core/utils/constant';

/**
 * Create a zoom out button
 *
 * @returns {JSX.Element} return the new created zoom out button
 */
export default function ZoomOut(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  /**
   * Causes the map to zoom out
   */
  function zoomOut() {
    const currentZoom = getGeoViewStore(mapId).getState().mapState.zoom;
    const { mapElement } = getGeoViewStore(mapId).getState().mapState;

    if (currentZoom) mapElement.getView().animate({ zoom: currentZoom - 0.5, duration: OL_ZOOM_DURATION });
  }

  return (
    <IconButton id="zoomOut" tooltip="mapnav.zoomOut" tooltipPlacement="left" onClick={() => zoomOut()} sx={sxClasses.navButton}>
      <ZoomOutIcon />
    </IconButton>
  );
}
