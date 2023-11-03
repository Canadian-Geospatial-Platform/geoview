import { useContext } from 'react';

import { useTheme } from '@mui/material/styles';

import { MapContext } from '@/core/app-start';
import { IconButton, EmojiPeopleIcon } from '@/ui';
import { api } from '@/app';
import { getSxClasses } from '../nav-bar-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';

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

  // get store actions
  const { zoomToMyLocation } = useMapStoreActions();

  /**
   * Zoom to user location
   */
  function zoomToMe() {
    function success(position: GeolocationPosition) {
      zoomToMyLocation(position);
    }

    function error(err: GeolocationPositionError) {
      api.utilities.showWarning(mapId, `ERROR(${err.code}): ${err.message}`, true);
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }

  return (
    <IconButton id="location" tooltip="mapnav.location" tooltipPlacement="left" onClick={() => zoomToMe()} sx={sxClasses.navButton}>
      <EmojiPeopleIcon />
    </IconButton>
  );
}
