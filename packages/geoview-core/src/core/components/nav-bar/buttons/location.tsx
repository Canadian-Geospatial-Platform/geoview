import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import { IconButton, EmojiPeopleIcon } from '@/ui';
import { getSxClasses } from '@/core/components/nav-bar/nav-bar-style';
import { useUIController } from '@/core/controllers/ui-controller';
import { logger } from '@/core/utils/logger';
import { useMapController } from '@/core/controllers/map-controller';

/**
 * Creates a location button to zoom to user location.
 *
 * @returns The location button
 */
export default function Location(): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/buttons/location');

  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store actions
  const uiController = useUIController();
  const mapController = useMapController();

  /**
   * Handles successful geolocation by zooming to the user position.
   *
   * @param position - The geolocation position
   */
  const successCallback = (position: GeolocationPosition): void => {
    // Zoom to my location
    mapController.zoomToMyLocation(position).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('Failed to zoomToMyLocation in location.successCallback', error);
    });
  };

  /**
   * Handles geolocation errors by showing a notification.
   *
   * @param err - The geolocation position error
   */
  const errorCallback = (err: GeolocationPositionError): void => {
    uiController.addNotification({
      key: 'location',
      message: `ERROR(${err.code}): ${err.message}`,
      notificationType: 'warning',
      count: 0,
    });
  };

  /**
   * Handles when the user clicks the location button.
   */
  const handleZoomToMe = (): void => {
    // Try to get current position and callback
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
  };

  return (
    <IconButton id="location" aria-label={t('mapnav.location')} tooltipPlacement="left" onClick={handleZoomToMe} sx={sxClasses.navButton}>
      <EmojiPeopleIcon />
    </IconButton>
  );
}
