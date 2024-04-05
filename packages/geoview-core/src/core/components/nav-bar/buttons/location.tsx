import { useTheme } from '@mui/material/styles';

import { IconButton, EmojiPeopleIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useAppStoreActions } from '@/core/stores/store-interface-and-intial-values/app-state';
import { logger } from '@/core/utils/logger';

/**
 * Create a location button to zoom to user location
 *
 * @returns {JSX.Element} the created location button
 */
export default function Location(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/location');

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const { zoomToMyLocation } = useMapStoreActions();
  const { addNotification } = useAppStoreActions();

  /**
   * Zoom to user location
   */
  function zoomToMe(): void {
    function success(position: GeolocationPosition): void {
      zoomToMyLocation(position);
    }

    function error(err: GeolocationPositionError): void {
      addNotification({
        key: 'location',
        message: `ERROR(${err.code}): ${err.message}`,
        notificationType: 'warning',
        count: 0,
      });
    }

    navigator.geolocation.getCurrentPosition(success, error);
  }

  return (
    <IconButton id="location" tooltip="mapnav.location" tooltipPlacement="left" onClick={() => zoomToMe()} sx={sxClasses.navButton}>
      <EmojiPeopleIcon />
    </IconButton>
  );
}
